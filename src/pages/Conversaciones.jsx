import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FiArrowLeft, FiMessageCircle, FiXCircle, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import { markConversationActive } from "../services/activeConversations";

const Conversaciones = () => {
  const navigate = useNavigate();
  const { puedeEditar } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentsByConversation, setCommentsByConversation] = useState({});
  const [expandedByConversation, setExpandedByConversation] = useState({});
  const [partPreviewByConversation, setPartPreviewByConversation] = useState({});
  const [partFullTextByConversation, setPartFullTextByConversation] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [pendingCloseConversation, setPendingCloseConversation] = useState(null);
  const [newCommentText, setNewCommentText] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const keyFor = (fecha, turno) => `${fecha}__${turno}`;

  const buildPreview = (texto) => {
    const clean = String(texto || "").trim();
    if (!clean) return "No hay texto disponible para este parte.";
    return clean.length > 260 ? `${clean.slice(0, 257)}...` : clean;
  };

  const loadConversaciones = async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "conversacionesActivas"), where("activa", "==", true)));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const aMs = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bMs = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bMs - aMs;
      });
      setConversaciones(items);
      setExpandedByConversation((prev) => {
        const next = {};
        items.forEach((item) => {
          next[item.id] = prev[item.id] ?? false;
        });
        return next;
      });
      await Promise.all(items.map((item) => Promise.all([loadComments(item.fecha, item.turno), loadPartPreview(item.fecha, item.turno)])));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversaciones();
  }, []);

  const loadComments = async (fecha, turno) => {
    const q = query(
      collection(db, "partesDiarios", fecha, "comentarios"),
      where("turno", "==", turno),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCommentsByConversation((prev) => ({ ...prev, [keyFor(fecha, turno)]: comments }));
  };

  const loadPartPreview = async (fecha, turno) => {
    const parteSnap = await getDoc(doc(db, "partesDiarios", fecha));
    const turnos = parteSnap.exists() ? parteSnap.data()?.turnos || {} : {};
    const texto = turnos?.[turno]?.texto || "";
    const key = keyFor(fecha, turno);
    setPartPreviewByConversation((prev) => ({
      ...prev,
      [key]: buildPreview(texto),
    }));
    setPartFullTextByConversation((prev) => ({
      ...prev,
      [key]: texto || "No hay texto disponible para este parte.",
    }));
  };

  const handleAddComment = async (fecha, turno) => {
    const texto = (newCommentText[keyFor(fecha, turno)] || "").trim();
    if (!puedeEditar || !texto) return;
    const autor = localStorage.getItem("voluntarioEmail") || "anónimo";
    try {
      await addDoc(collection(db, "partesDiarios", fecha, "comentarios"), {
        turno,
        texto,
        autor,
        fechaInformada: fecha,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await markConversationActive({ fecha, turno, texto, autor });
      setNewCommentText((prev) => ({ ...prev, [keyFor(fecha, turno)]: "" }));
      await loadComments(fecha, turno);
      await loadConversaciones();
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const saveEditComment = async (fecha, comment) => {
    if (!puedeEditar || !editingText.trim()) return;
    try {
      await updateDoc(doc(db, "partesDiarios", fecha, "comentarios", comment.id), {
        texto: editingText.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingCommentId(null);
      setEditingText("");
      await loadComments(fecha, comment.turno);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const removeComment = async (fecha, comment) => {
    if (!puedeEditar) return;
    try {
      await deleteDoc(doc(db, "partesDiarios", fecha, "comentarios", comment.id));
      await loadComments(fecha, comment.turno);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const closeConversation = async (conversation) => {
    if (!puedeEditar) return;
    try {
      await updateDoc(doc(db, "conversacionesActivas", conversation.id), {
        activa: false,
        closedAt: serverTimestamp(),
        closedBy: localStorage.getItem("voluntarioEmail") || "anónimo",
        updatedAt: serverTimestamp(),
      });
      await loadConversaciones();
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const requestCloseConversation = (conversation) => {
    if (!puedeEditar) return;
    setPendingCloseConversation(conversation);
  };

  const cancelCloseConversation = () => setPendingCloseConversation(null);

  const confirmCloseConversation = async () => {
    if (!pendingCloseConversation) return;
    await closeConversation(pendingCloseConversation);
    setPendingCloseConversation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-2 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/partes")}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 font-semibold"
          >
            <FiArrowLeft /> Volver a partes
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-900">Conversaciones activas</h1>
        </div>

        {error && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">{error}</div>}
        {loading && <div className="text-purple-700">Cargando conversaciones...</div>}
        {!loading && conversaciones.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">No hay conversaciones activas.</div>
        )}

        <div className="space-y-4">
          {conversaciones.map((conversation) => {
            const key = keyFor(conversation.fecha, conversation.turno);
            const comments = commentsByConversation[key] || [];
            const partPreview = partPreviewByConversation[key] || "Cargando preview del parte...";
            const isExpanded = expandedByConversation[conversation.id] ?? true;
            return (
              <div key={conversation.id} className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedByConversation((prev) => ({
                          ...prev,
                          [conversation.id]: !isExpanded,
                        }))
                      }
                      className="inline-flex items-center gap-2 text-purple-900 font-semibold hover:text-purple-700 transition-colors"
                    >
                      <FiMessageCircle />
                      {conversation.fecha} - {conversation.turno}
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    <span className="rounded-full bg-purple-100 border border-purple-300 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                      {comments.length} comentario{comments.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {puedeEditar && (
                    <button
                      onClick={() => requestCloseConversation(conversation)}
                      title="Dar de baja conversación"
                      aria-label="Dar de baja conversación"
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPart({
                          fecha: conversation.fecha,
                          turno: conversation.turno,
                          texto:
                            partFullTextByConversation[key] ||
                            "No hay texto disponible para este parte.",
                        })
                      }
                      className="mb-3 w-full text-left rounded-lg border border-indigo-200 bg-indigo-50 p-3 hover:bg-indigo-100 transition-colors"
                    >
                      <p className="text-xs font-semibold text-indigo-700 mb-1">Preview del parte respondido</p>
                      <p className="text-sm text-indigo-900 whitespace-pre-wrap">{partPreview}</p>
                      <p className="text-xs text-indigo-700 mt-2 font-semibold">Tocar para ver parte completo</p>
                    </button>

                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div key={c.id} className="rounded border border-gray-200 bg-gray-50 p-2">
                          <div className="text-xs text-gray-500">{c.autor || "anónimo"}</div>
                          {editingCommentId === c.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                className="w-full rounded border border-gray-300 p-2 text-sm"
                                rows={2}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => saveEditComment(conversation.fecha, c)}
                                  className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingText("");
                                  }}
                                  className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{c.texto}</div>
                          )}
                          {puedeEditar && editingCommentId !== c.id && (
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditingText(c.texto || "");
                                }}
                                className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => removeComment(conversation.fecha, c)}
                                className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                              >
                                Borrar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {puedeEditar && isExpanded && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder="Escribí un comentario..."
                        className="flex-1 rounded border border-gray-300 p-2 text-sm"
                        value={newCommentText[key] || ""}
                        onChange={(e) =>
                          setNewCommentText((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => handleAddComment(conversation.fecha, conversation.turno)}
                        className="rounded bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-indigo-200 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-indigo-900">
                Parte completo - {selectedPart.fecha} ({selectedPart.turno})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPart(null)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200 font-semibold"
              >
                Cerrar
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-900 whitespace-pre-wrap">{selectedPart.texto}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingCloseConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-red-200">
            <div className="px-6 py-5">
              <h3 className="text-xl font-bold text-red-900 mb-3">Confirmar baja de conversación</h3>
              <p className="text-red-800 mb-1">
                Vas a dar de baja la conversación de:
              </p>
              <p className="font-semibold text-red-900">
                {pendingCloseConversation.fecha} - {pendingCloseConversation.turno}
              </p>
              <p className="text-sm text-red-700 mt-3">
                La conversación dejará de aparecer en esta lista activa.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-red-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelCloseConversation}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCloseConversation}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 font-semibold"
              >
                Dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversaciones;
