const admin = require("firebase-admin");
const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");

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
