const admin = require("firebase-admin");
const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");

admin.initializeApp();

// Secret for OpenAI API key (set via: firebase functions:secrets:set OPENAI_API_KEY)
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Helper to call OpenAI Chat Completions via REST
async function callOpenAIChat({ apiKey, model, messages, temperature = 0.3 }) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature })
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenAI API error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return content;
}

exports.generateSummary = onRequest({ secrets: [OPENAI_API_KEY], region: "us-central1" }, async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { manana, tarde, noche, fecha } = req.body || {};

    if ((!manana || !manana.trim()) && (!tarde || !tarde.trim()) && (!noche || !noche.trim())) {
      return res.status(400).json({ error: "No hay contenido para generar resumen." });
    }

    const bloques = [];
    if (manana && manana.trim()) bloques.push(`TURNO MAÑANA:\n${manana.trim()}`);
    if (tarde && tarde.trim()) bloques.push(`TURNO TARDE:\n${tarde.trim()}`);
    if (noche && noche.trim()) bloques.push(`TURNO NOCHE:\n${noche.trim()}`);

    const prompt = `
Redactá un resumen corto y pragmático del día${fecha ? ` (${fecha})` : ''} para el Hospice a partir de los registros:\n\n${bloques.join("\n\n")}\n\nRequisitos del resumen:\n- Claridad y concisión (máximo ~8 oraciones).\n- Tono humano, sensible y objetivo.\n- Evitar adornos; destacar hechos relevantes, cambios clínicos, incidencias, y acciones de equipos.\n- Incluir alertas o follow-ups en una lista final si aplica.`;

    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY no configurada como secreto" });
    }

    const resumen = await callOpenAIChat({
      apiKey,
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    if (fecha) {
      await admin.firestore().collection("partesDiarios").doc(fecha).set({
        resumen: { texto: resumen, generadoPorIA: true, fechaGeneracion: new Date() }
      }, { merge: true });
    }

    res.status(200).json({ resumen });
  } catch (error) {
    console.error("Error al generar resumen:", error);
    res.status(500).json({ error: "Error al generar resumen" });
  }
});

const ANONYMOUS_USER = "usuario_anonimo";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const volunteerDocId = (email) => encodeURIComponent(normalizeEmail(email));

const isInvalidTokenError = (code) =>
  code === "messaging/invalid-registration-token" ||
  code === "messaging/registration-token-not-registered";

const TURNOS = ["mañana", "tarde", "noche"];

async function getVolunteerDocByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized === ANONYMOUS_USER) return null;

  const docsByPath = new Map();

  const byIdRef = admin.firestore().collection("voluntarios").doc(volunteerDocId(normalized));
  const byIdSnap = await byIdRef.get();
  if (byIdSnap.exists) {
    docsByPath.set(byIdSnap.ref.path, { ref: byIdSnap.ref, data: byIdSnap.data() || {} });
  }

  const byFieldSnap = await admin
    .firestore()
    .collection("voluntarios")
    .where("email", "==", normalized)
    .get();

  byFieldSnap.forEach((docSnap) => {
    docsByPath.set(docSnap.ref.path, { ref: docSnap.ref, data: docSnap.data() || {} });
  });

  if (docsByPath.size === 0) return null;

  const refs = [];
  const tokensSet = new Set();
  let enabledByAnyDoc = false;

  docsByPath.forEach(({ ref, data }) => {
    refs.push(ref);
    if (data.notificationsEnabled !== false) {
      enabledByAnyDoc = true;
    }
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    tokens.forEach((token) => {
      if (typeof token === "string" && token.trim()) {
        tokensSet.add(token);
      }
    });
  });

  return {
    refs,
    data: {
      notificationsEnabled: enabledByAnyDoc,
      tokens: Array.from(tokensSet),
    },
  };
}

async function getAllResponsibleTokensExcluding(excludedEmail) {
  const excluded = normalizeEmail(excludedEmail);
  const volunteerSnap = await admin.firestore().collection("voluntarios").get();
  const tokenToOwner = new Map();
  const ownerDocs = new Map();
  const groupedByEmail = new Map();

  volunteerSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const email = normalizeEmail(data.email);
    if (!email || email === ANONYMOUS_USER) return;
    if (excluded && email === excluded) return;
    const group = groupedByEmail.get(email) || {
      refs: [],
      enabledByAnyDoc: false,
      tokens: new Set(),
    };
    group.refs.push(docSnap.ref);
    if (data.notificationsEnabled !== false) {
      group.enabledByAnyDoc = true;
    }
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    tokens.forEach((token) => {
      if (typeof token === "string" && token.trim()) {
        group.tokens.add(token);
      }
    });
    groupedByEmail.set(email, group);
  });

  groupedByEmail.forEach((group, email) => {
    if (!group.enabledByAnyDoc) return;
    const dedupedTokens = Array.from(group.tokens);
    if (dedupedTokens.length === 0) return;

    ownerDocs.set(email, group.refs);
    dedupedTokens.forEach((token) => {
      tokenToOwner.set(token, email);
    });
  });

  return { allTokens: Array.from(tokenToOwner.keys()), tokenToOwner, ownerDocs };
}

async function cleanupInvalidTokens(response, allTokens, tokenToOwner, ownerDocs) {
  const invalidByOwner = new Map();

  response.responses.forEach((sendResult, index) => {
    if (sendResult.success) return;
    const code = sendResult.error?.code;
    if (!isInvalidTokenError(code)) return;
    const token = allTokens[index];
    const owner = tokenToOwner.get(token);
    if (!owner) return;
    const ownerInvalid = invalidByOwner.get(owner) || [];
    ownerInvalid.push(token);
    invalidByOwner.set(owner, ownerInvalid);
  });

  const cleanupTasks = [];
  invalidByOwner.forEach((invalidTokens, ownerEmail) => {
    const refs = ownerDocs.get(ownerEmail);
    if (!refs || refs.length === 0 || invalidTokens.length === 0) return;
    refs.forEach((ref) => {
      cleanupTasks.push(
        ref.update({
          tokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    });
  });

  if (cleanupTasks.length > 0) {
    await Promise.all(cleanupTasks);
  }
}

exports.notifyPartCommentParticipants = onDocumentCreated(
  {
    document: "partesDiarios/{fecha}/comentarios/{commentId}",
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { fecha } = event.params;
    const comment = snap.data() || {};
    const turno = comment.turno;
    const author = normalizeEmail(comment.autor);
    const commentText = String(comment.texto || "").trim();

    if (!fecha || !turno || !author || author === ANONYMOUS_USER) return;

    const participants = new Set();

    const parteSnap = await admin.firestore().collection("partesDiarios").doc(fecha).get();
    if (parteSnap.exists) {
      const parteData = parteSnap.data() || {};
      const turnoData = parteData?.turnos?.[turno] || {};
      const uploadedBy = normalizeEmail(turnoData.uploadedBy);
      if (uploadedBy && uploadedBy !== ANONYMOUS_USER) {
        participants.add(uploadedBy);
      }
    }

    const commentsSnap = await admin
      .firestore()
      .collection("partesDiarios")
      .doc(fecha)
      .collection("comentarios")
      .where("turno", "==", turno)
      .get();

    commentsSnap.forEach((docSnap) => {
      const commentAuthor = normalizeEmail(docSnap.data()?.autor);
      if (commentAuthor && commentAuthor !== ANONYMOUS_USER) {
        participants.add(commentAuthor);
      }
    });

    participants.delete(author);
    if (participants.size === 0) return;

    const tokenToOwner = new Map();
    const ownerDocs = new Map();

    for (const participant of participants) {
      const volunteerDoc = await getVolunteerDocByEmail(participant);
      if (!volunteerDoc) continue;

      const notificationsEnabled = volunteerDoc.data.notificationsEnabled !== false;
      const tokens = Array.isArray(volunteerDoc.data.tokens) ? volunteerDoc.data.tokens : [];
      if (!notificationsEnabled || tokens.length === 0) continue;

      ownerDocs.set(participant, volunteerDoc.refs);
      for (const token of tokens) {
        if (typeof token === "string" && token.trim()) {
          tokenToOwner.set(token, participant);
        }
      }
    }

    const allTokens = Array.from(tokenToOwner.keys());
    if (allTokens.length === 0) return;

    const safeText = commentText.length > 160 ? `${commentText.slice(0, 157)}...` : commentText;
    const title = `Nueva respuesta en el parte de la ${turno}`;
    const body = safeText
      ? `${author} respondió: "${safeText}"`
      : `${author} respondió en el parte de la ${turno} (${fecha}).`;
    const url = `/partes?fecha=${encodeURIComponent(fecha)}&turno=${encodeURIComponent(turno)}`;

    const response = await admin.messaging().sendEachForMulticast({
      tokens: allTokens,
      webpush: {
        headers: { Urgency: "high" },
        data: {
          title,
          body,
          url,
          fecha,
          turno,
          autor: author,
        },
      },
    });

    await cleanupInvalidTokens(response, allTokens, tokenToOwner, ownerDocs);
  }
);

exports.notifyPartCreatedToResponsibles = onDocumentWritten(
  {
    document: "partesDiarios/{fecha}",
    region: "us-central1",
  },
  async (event) => {
    const afterSnap = event.data?.after;
    if (!afterSnap || !afterSnap.exists) return;

    const beforeData = event.data?.before?.data() || {};
    const afterData = afterSnap.data() || {};
    const beforeTurnos = beforeData.turnos || {};
    const afterTurnos = afterData.turnos || {};
    const { fecha } = event.params;

    const createdTurnos = TURNOS.filter((turno) => {
      const beforeTexto = String(beforeTurnos?.[turno]?.texto || "").trim();
      const afterTexto = String(afterTurnos?.[turno]?.texto || "").trim();
      return !beforeTexto && !!afterTexto;
    });

    if (createdTurnos.length === 0) return;

    for (const turno of createdTurnos) {
      const uploader = normalizeEmail(afterTurnos?.[turno]?.uploadedBy);
      const { allTokens, tokenToOwner, ownerDocs } = await getAllResponsibleTokensExcluding(uploader);
      if (allTokens.length === 0) continue;

      const actor = uploader || "Un responsable";
      const title = `Se cargó el parte de la ${turno}`;
      const body = `${actor} cargó el parte de la ${turno} (${fecha}).`;
      const url = `/partes?fecha=${encodeURIComponent(fecha)}&turno=${encodeURIComponent(turno)}`;

      const response = await admin.messaging().sendEachForMulticast({
        tokens: allTokens,
        webpush: {
          headers: { Urgency: "high" },
          data: {
            title,
            body,
            url,
            fecha,
            turno,
            actor,
            eventType: "new-part",
          },
        },
      });

      await cleanupInvalidTokens(response, allTokens, tokenToOwner, ownerDocs);
    }
  }
);
