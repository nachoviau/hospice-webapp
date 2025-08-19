import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FiX, FiSave } from "react-icons/fi";

const AdiosHuesped = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [existe, setExiste] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        // Obtener el nombre desde el historial
        const histRef = doc(db, "huespedes_historial", id);
        const histSnap = await getDoc(histRef);
        if (histSnap.exists()) {
          setNombre(histSnap.data().nombre || "");
        }
        // Obtener A‑Dios
        const adiosRef = doc(db, `huespedes_historial/${id}/adios/principal`);
        const adiosSnap = await getDoc(adiosRef);
        if (adiosSnap.exists()) {
          setExiste(true);
          setTexto(adiosSnap.data().contenido || "");
        } else {
          setExiste(false);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const guardar = async () => {
    try {
      setGuardando(true);
      setError("");
      const adiosRef = doc(db, `huespedes_historial/${id}/adios/principal`);
      await setDoc(adiosRef, {
        contenido: texto,
        actualizadoAt: serverTimestamp(),
      }, { merge: true });
      setExiste(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p className="text-green-700 p-4">Cargando...</p>;
  if (error) return <p className="text-green-700 bg-orange-100 p-4 rounded-2xl">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-amber-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200">
          <h1 className="text-2xl font-bold text-purple-700">A‑Dios {nombre ? `a ${nombre}` : ''}</h1>
          <button onClick={() => navigate(-1)} className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg p-2 border border-purple-200" aria-label="Cerrar">
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="p-6">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí aquí el A‑Dios..."
            rows={14}
            className="w-full rounded-xl border border-amber-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg bg-white shadow-sm"
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiSave className="inline align-middle mr-2" /> {existe ? 'Guardar cambios' : 'Guardar A‑Dios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdiosHuesped; 