const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Configuration, OpenAIApi } = require("openai");

admin.initializeApp();

const configuration = new Configuration({
  apiKey: functions.config().openai.key,
});

const openai = new OpenAIApi(configuration);

exports.generateSummary = functions.https.onRequest(async (req, res) => {
  try {
    const { manana, tarde, noche, fecha } = req.body;

    if (!manana || !tarde || !noche) {
      return res.status(400).json({ error: "Faltan partes de algún turno." });
    }

    const prompt = `
Redactá un parte diario para el Hospice a partir de los siguientes registros de turnos:

TURNO MAÑANA:
${manana}

TURNO TARDE:
${tarde}

TURNO NOCHE:
${noche}

El resumen debe ser claro, humano, sensible, y reflejar los eventos del día.
    `;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // o "gpt-4" si tenés acceso
      messages: [{ role: "user", content: prompt }],
    });

    const resumen = response.data.choices[0].message.content;

    // (Opcional) Guardarlo en Firestore
    if (fecha) {
      await admin.firestore().collection("partesDiarios").doc(fecha).update({
        resumen,
      });
    }

    res.status(200).json({ resumen });
  } catch (error) {
    console.error("Error al generar resumen:", error);
    res.status(500).json({ error: "Error al generar resumen" });
  }
});
