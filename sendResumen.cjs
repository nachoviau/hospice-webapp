// sendResumen.js
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const path = require("path");
const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config();

// CONFIGURA TUS DATOS
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const REMITENTE = process.env.SENDGRID_FROM || "tucorreo@tudominio.com"; // El mail que usaste en SendGrid
const ASUNTO = "Resumen diario San Camilo";
const FECHA = new Date().toISOString().split("T")[0];

const LAST_SENT_FILE = "lastResumenSent.txt";
let lastSent = "";
if (fs.existsSync(LAST_SENT_FILE)) {
  lastSent = fs.readFileSync(LAST_SENT_FILE, "utf8").trim();
}

// Inicializa Firebase Admin
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Inicializa SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

async function main() {
  if (lastSent === FECHA) {
    console.log("Ya se envió el resumen para la fecha:", FECHA);
    return;
  }

  // 1. Leer resumen del día
  const docRef = db.collection("partesDiarios").doc(FECHA);
  const docSnap = await docRef.get();
  if (!docSnap.exists || !docSnap.data().resumen || !docSnap.data().resumen.texto) {
    console.error("No hay resumen para la fecha:", FECHA);
    return;
  }
  const resumen = docSnap.data().resumen.texto;

  // 2. Leer todos los mails de voluntarios
  const voluntariosSnap = await db.collection("voluntarios").get();
  const emails = voluntariosSnap.docs.map(doc => doc.data().email).filter(Boolean);

  if (emails.length === 0) {
    console.error("No hay voluntarios registrados.");
    return;
  }

  // 3. Enviar el mail a todos
  const msg = {
    to: emails,
    from: REMITENTE,
    subject: ASUNTO,
    text: resumen,
    html: `<pre>${resumen}</pre>`
  };

  try {
    await sgMail.sendMultiple(msg);
    console.log("Resumen enviado a:", emails.join(", "));
    fs.writeFileSync(LAST_SENT_FILE, FECHA);
  } catch (err) {
    console.error("Error enviando mails:", err.response ? err.response.body : err);
  }
}

main();