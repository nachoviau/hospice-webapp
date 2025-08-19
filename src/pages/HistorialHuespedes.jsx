import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const HistorialHuespedes = () => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [adiosDisponibilidad, setAdiosDisponibilidad] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [objetivoEliminar, setObjetivoEliminar] = useState(null);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [adiosModalAbierto, setAdiosModalAbierto] = useState(false);
  const [huespedSeleccionado, setHuespedSeleccionado] = useState(null);
  const [adiosTexto, setAdiosTexto] = useState("");
  const [adiosCargando, setAdiosCargando] = useState(false);
  const [adiosGuardando, setAdiosGuardando] = useState(false);
  const [adiosExiste, setAdiosExiste] = useState(false);
  const [adiosError, setAdiosError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const q = query(collection(db, "huespedes_historial"), orderBy("despedidoAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const chequearAdios = async () => {
      const entradas = await Promise.all(items.map(async (it) => {
        try {
          const adiosRef = doc(db, `huespedes_historial/${it.id}/adios/principal`);
          const adiosSnap = await getDoc(adiosRef);
          return [it.id, adiosSnap.exists()];
        } catch {
          return [it.id, false];
        }
      }));
      const mapa = Object.fromEntries(entradas);
      setAdiosDisponibilidad(mapa);
    };
    if (items.length > 0) {
      chequearAdios();
    } else {
      setAdiosDisponibilidad({});
    }
  }, [items]);

  const abrirAdios = async (item) => {
    setAdiosModalAbierto(true);
    setHuespedSeleccionado(item);
    setAdiosCargando(true);
    setAdiosError("");
    try {
      const adiosRef = doc(db, `huespedes_historial/${item.id}/adios/principal`);
      const adiosSnap = await getDoc(adiosRef);
      if (adiosSnap.exists()) {
        setAdiosExiste(true);
        setAdiosTexto(adiosSnap.data().contenido || "");
      } else {
        setAdiosExiste(false);
        setAdiosTexto("");
      }
    } catch (e) {
      setAdiosError(e.message);
    } finally {
      setAdiosCargando(false);
    }
  };

  const cerrarAdios = () => {
    setAdiosModalAbierto(false);
    setHuespedSeleccionado(null);
    setAdiosTexto("");
    setAdiosExiste(false);
    setAdiosError("");
  };

  const guardarAdios = async () => {
    if (!huespedSeleccionado) return;
    setAdiosGuardando(true);
    setAdiosError("");
    try {
      const adiosRef = doc(db, `huespedes_historial/${huespedSeleccionado.id}/adios/principal`);
      await setDoc(adiosRef, { contenido: adiosTexto, actualizadoAt: serverTimestamp() }, { merge: true });
      setAdiosExiste(true);
      setAdiosDisponibilidad(prev => ({ ...prev, [huespedSeleccionado.id]: true }));
      cerrarAdios();
    } catch (e) {
      setAdiosError(e.message);
    } finally {
      setAdiosGuardando(false);
    }
  };

  const solicitarEliminacion = (item) => {
    setObjetivoEliminar(item);
    setTextoConfirmacion("");
    setMostrarConfirmacion(true);
  };

  const confirmarEliminacion = async () => {
    if (!objetivoEliminar) return;
    setEliminando(true);
    try {
      try {
        await deleteDoc(doc(db, `huespedes_historial/${objetivoEliminar.id}/adios/principal`));
      } catch {}
      await deleteDoc(doc(db, "huespedes_historial", objetivoEliminar.id));
      setItems(prev => prev.filter(x => x.id !== objetivoEliminar.id));
      setMostrarConfirmacion(false);
      setObjetivoEliminar(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) return <p className="text-green-700">Cargando historial...</p>;
  if (error) return <p className="text-green-700 bg-orange-100 p-4 rounded-2xl">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-2 pb-16">
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-purple-700 tracking-wide">Historial de huéspedes</h2>
        </div>
        <button onClick={() => navigate('/huespedes')} className="self-start text-green-700 hover:text-green-800 hover:bg-green-50 px-4 py-2 rounded-xl transition-all duration-200 text-base font-medium select-none">&larr; Volver</button>
        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-purple-700 text-lg font-medium">Aún no hay registros en el historial.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map(it => (
              <div key={it.id} className="bg-purple-50 rounded-2xl shadow p-5 border border-purple-200 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-semibold text-purple-900">{it.nombre || 'Sin nombre'}</div>
                    {it.despedidoAt?.toDate && (
                      <div className="text-sm text-purple-700 mt-1">
                        Partió: {it.despedidoAt.toDate().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => solicitarEliminacion(it)}
                    className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 border border-gray-200 transition-colors select-none"
                    aria-label={`Quitar a ${it.nombre || 'este huésped'} del historial`}
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => abrirAdios(it)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow px-4 py-2 border border-purple-700 text-sm sm:text-base font-semibold transition-colors select-none"
                  >
                    {adiosDisponibilidad[it.id] ? 'Leer A‑Dios' : 'Cargar A‑Dios'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal A‑Dios */}
      {adiosModalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={cerrarAdios}>
          <div className="bg-white rounded-2xl shadow-xl p-6 relative w-full max-w-3xl mx-4 border border-amber-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-purple-700">
                A‑Dios {huespedSeleccionado?.nombre ? `a ${huespedSeleccionado.nombre}` : ''}
              </h3>
              <button onClick={cerrarAdios} className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg p-2 border border-purple-200" aria-label="Cerrar">
                <FiX className="text-xl" />
              </button>
            </div>

            {adiosError && (
              <p className="text-green-700 bg-orange-100 p-3 rounded-xl mb-3">Error: {adiosError}</p>
            )}

            {adiosCargando ? (
              <p className="text-green-700">Cargando A‑Dios...</p>
            ) : (
              <>
                <textarea
                  value={adiosTexto}
                  onChange={(e) => setAdiosTexto(e.target.value)}
                  placeholder="Escribí aquí el A‑Dios..."
                  rows={12}
                  className="w-full rounded-xl border border-amber-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg bg-white shadow-sm"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={guardarAdios}
                    disabled={adiosGuardando}
                    className="px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Guardar A‑Dios
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {mostrarConfirmacion && objetivoEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-orange-50 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-orange-200">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Quitar del historial</h3>
              <p className="text-green-700 text-base">
                Para continuar, escribí <strong>de acuerdo</strong>.
              </p>
            </div>
            <input
              value={textoConfirmacion}
              onChange={(e) => setTextoConfirmacion(e.target.value)}
              placeholder="de acuerdo"
              className="w-full rounded-xl border border-amber-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-base bg-white shadow-sm"
            />
            <div className="flex gap-4 mt-5">
              <button
                onClick={() => { setMostrarConfirmacion(false); setObjetivoEliminar(null); }}
                className="flex-1 px-6 py-3 border-2 border-orange-300 text-green-700 rounded-xl font-semibold hover:bg-yellow-50 transition-all duration-200 select-none"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                disabled={textoConfirmacion.trim().toLowerCase() !== 'de acuerdo' || eliminando}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed select-none"
              >
                {eliminando ? 'Quitando...' : 'Quitar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialHuespedes; 