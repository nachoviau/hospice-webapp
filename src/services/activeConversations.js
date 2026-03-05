import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const normalizeTurno = (turno) => String(turno || "").trim().toLowerCase();

export const activeConversationId = (fecha, turno) =>
  `${String(fecha || "").trim()}__${encodeURIComponent(normalizeTurno(turno))}`;

export async function markConversationActive({ fecha, turno, texto, autor }) {
  const cleanFecha = String(fecha || "").trim();
  const cleanTurno = normalizeTurno(turno);
  if (!cleanFecha || !cleanTurno) return;

  await setDoc(
    doc(db, "conversacionesActivas", activeConversationId(cleanFecha, cleanTurno)),
    {
      fecha: cleanFecha,
      turno: cleanTurno,
      activa: true,
      lastCommentText: String(texto || "").trim(),
      lastCommentAuthor: String(autor || "").trim().toLowerCase(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
