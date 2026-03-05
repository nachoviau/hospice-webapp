import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";

const DetalleHuesped = () => {
  const { puedeEditar } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [huesped, setHuesped] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [editData, setEditData] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  // Bienvenida
  const [modalBienvenidaAbierto, setModalBienvenidaAbierto] = useState(false);
  const [bienvenidaEditando, setBienvenidaEditando] = useState(false);
  const [bienvenidaTexto, setBienvenidaTexto] = useState("");
  const [guardandoBienvenida, setGuardandoBienvenida] = useState(false);

  useEffect(() => {
    const fetchHuesped = async () => {
      try {
        const docRef = doc(db, "huespedes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHuesped({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("No se encontró información para este huésped.");
        }
      } catch (err) {
        setError("No se pudo obtener la información del huésped: " + err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchHuesped();
  }, [id]);

  const startEdit = () => {
    if (!puedeEditar) return; // No permitir editar si es usuario anónimo
    setEditando(true);
    setEditData({
      nombre: huesped.nombre || "",
      info_huesped: huesped.info_huesped || "",
      gustos: huesped.gustos || "",
      movilidad: huesped.movilidad || "plena",
      come_asistido: huesped.come_asistido || false,
      importante: huesped.importante || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, "huespedes", id), editData);
      setHuesped((prev) => ({ ...prev, ...editData }));
      setEditando(false);
    } catch (err) {
      setError("No se pudieron guardar los cambios: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = () => {
    if (!puedeEditar) return; // No permitir eliminar si es usuario anónimo
    setMostrarConfirmacion(true);
  };

  const eliminarHuesped = async () => {
    setMostrarConfirmacion(false);
    setEliminando(true);
    try {
      // Archivar en historial antes de borrar
      const docRef = doc(db, "huespedes", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const historialRef = doc(db, "huespedes_historial", id);
        await setDoc(historialRef, {
          ...data,
          despedidoAt: serverTimestamp(),
        });
      }
      await deleteDoc(doc(db, "huespedes", id));
      navigate("/huespedes");
    } catch (err) {
      setError("No se pudo dar de baja al huésped: " + err.message);
    } finally {
      setEliminando(false);
    }
  };

  const abrirBienvenida = () => {
    const texto = huesped?.bienvenida?.texto || "";
    setBienvenidaTexto(texto);
    setBienvenidaEditando(!texto && puedeEditar);
    setModalBienvenidaAbierto(true);
  };

  const cerrarBienvenida = () => {
    setModalBienvenidaAbierto(false);
    setBienvenidaEditando(false);
    setBienvenidaTexto("");
  };

  const guardarBienvenida = async () => {
    if (!puedeEditar) return;
    setGuardandoBienvenida(true);
    try {
      const nueva = { texto: bienvenidaTexto || "", fechaActualizacion: serverTimestamp() };
      await updateDoc(doc(db, "huespedes", id), { bienvenida: nueva });
      setHuesped(prev => ({ ...prev, bienvenida: { ...nueva, fechaActualizacion: new Date() } }));
      setBienvenidaEditando(false);
    } catch (err) {
      setError("No se pudo guardar la bienvenida: " + (err?.message || String(err)));
    } finally {
      setGuardandoBienvenida(false);
    }
  };

  if (cargando) return <p className="text-green-700 font-medium">Cargando...</p>;
  if (error) return <p className="text-green-700 bg-orange-100 rounded-2xl p-4 text-center">{error}</p>;
  if (!huesped) return null;

  return (
    <div className="max-w-2xl mx-auto bg-orange-50 rounded-3xl shadow-lg p-10 mt-8 border border-orange-200">
      <button onClick={() => navigate(-1)} className="mb-8 text-green-700 hover:text-green-800 hover:bg-green-50 px-4 py-2 rounded-xl transition-all duration-200 text-base font-medium select-none">&larr; Volver</button>
      <h2 className="text-4xl font-bold text-green-800 mb-3 text-center">{huesped.nombre}</h2>
      <div className="text-center mb-8">
        <button
          onClick={abrirBienvenida}
          className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-colors border-2 bg-green-700 text-white hover:bg-green-800 border-green-900"
        >
          {huesped?.bienvenida?.texto ? 'Leer bienvenida' : 'Cargar bienvenida'}
        </button>
      </div>
      {editando ? (
        <form onSubmit={e => { e.preventDefault(); guardarEdicion(); }} className="flex flex-col gap-4">
          <div>
            <label className="block text-green-800 font-semibold mb-2">Nombre:</label>
            <input name="nombre" value={editData.nombre} onChange={handleEditChange} required className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" />
          </div>
          <div>
            <label className="block text-green-800 font-semibold mb-2">Info. huésped:</label>
            <textarea name="info_huesped" value={editData.info_huesped} onChange={handleEditChange} rows="4" className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" placeholder="Información general del huésped..." />
          </div>
          <div>
            <label className="block text-green-800 font-semibold mb-2">Importante (opcional) ⚠️</label>
            <textarea name="importante" value={editData.importante} onChange={handleEditChange} rows="3" className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" placeholder="Notas importantes para el equipo (visibles con alerta en el listado)" />
          </div>
          <div>
            <label className="block text-green-800 font-semibold mb-2">Gustos:</label>
            <textarea name="gustos" value={editData.gustos} onChange={handleEditChange} rows="4" className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" placeholder="Gustos y preferencias..." />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Movilidad:</label>
            <select name="movilidad" value={editData.movilidad} onChange={handleEditChange} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg">
              <option value="plena">Plena</option>
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="come_asistido" checked={editData.come_asistido} onChange={handleEditChange} className="rounded focus:ring-amber-300" />
            <label htmlFor="come_asistido" className="text-amber-900 font-medium">Come asistido</label>
          </div>
          <div className="flex gap-4 mt-4">
                            <button type="submit" disabled={guardando} className="flex-1 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Guardar</button>
            <button type="button" onClick={() => setEditando(false)} className="flex-1 py-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-lg shadow transition-colors">Cancelar</button>
          </div>
        </form>
      ) : (
        <>
          <dl className="mb-8 space-y-6">
            {huesped.importante && huesped.importante.trim() && (
              <div>
                <dt className="font-bold text-red-700 text-lg mb-2">Importante ⚠️</dt>
                <dd className="text-lg text-red-800 bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm whitespace-pre-wrap">
                  {huesped.importante}
                </dd>
              </div>
            )}
            <div>
              <dt className="font-bold text-green-800 text-lg mb-2">Info. huésped:</dt>
              <dd className="text-lg text-green-900 bg-yellow-50 p-5 rounded-2xl border border-yellow-200 shadow-sm">
                {huesped.info_huesped || "No hay información disponible"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-green-800 text-lg mb-2">Gustos:</dt>
              <dd className="text-lg text-green-900 bg-yellow-50 p-5 rounded-2xl border border-yellow-200 shadow-sm">
                {huesped.gustos || "No hay gustos registrados"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-green-800 text-lg mb-2">Movilidad:</dt>
              <dd className="text-lg text-green-900">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  huesped.movilidad === 'plena' ? 'bg-green-100 text-green-800' :
                  huesped.movilidad === 'alta' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {huesped.movilidad === 'plena' ? 'Plena' :
                   huesped.movilidad === 'alta' ? 'Alta' : 'Baja'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-bold text-green-800 text-lg mb-2">Come asistido:</dt>
              <dd className="text-lg text-green-900">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  huesped.come_asistido ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {huesped.come_asistido ? "Sí" : "No"}
                </span>
              </dd>
            </div>
          </dl>
          {puedeEditar && (
            <div className="flex gap-4">
              <button onClick={startEdit} className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 select-none">Editar</button>
              <button onClick={confirmarEliminacion} disabled={eliminando} className="flex-1 py-3 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none">
                {eliminando ? "Procesando..." : "A-dios"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-orange-50 rounded-3xl p-10 w-full max-w-lg mx-4 shadow-2xl transform transition-all border border-orange-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🕊️</div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Confirmar despedida
              </h3>
              <p className="text-green-700 text-lg">
                ¿Deseas dar de baja a <strong>{huesped.nombre}</strong> del sistema?
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-6 py-3 border-2 border-orange-300 text-green-700 rounded-xl font-semibold hover:bg-yellow-50 transition-all duration-200 transform hover:scale-105 select-none"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarHuesped}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg select-none"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bienvenida */}
      {modalBienvenidaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl mx-4 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-amber-900">Bienvenida</h3>
              <button onClick={cerrarBienvenida} className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors">
                ×
              </button>
            </div>
            {bienvenidaEditando ? (
              <div className="space-y-4">
                <textarea
                  rows="10"
                  value={bienvenidaTexto}
                  onChange={e => setBienvenidaTexto(e.target.value)}
                  className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm"
                  placeholder="Escribí aquí la bienvenida..."
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setBienvenidaEditando(false)} className="px-5 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold">Cancelar</button>
                  <button onClick={guardarBienvenida} disabled={guardandoBienvenida} className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-semibold border-2 border-purple-800 disabled:opacity-60">
                    {guardandoBienvenida ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">{huesped?.bienvenida?.texto || 'Sin bienvenida cargada.'}</p>
                </div>
                {huesped?.bienvenida?.fechaActualizacion && (
                  <div className="text-sm text-amber-600">Actualizado: {(() => { try { return huesped.bienvenida.fechaActualizacion.toDate().toLocaleString('es-ES'); } catch { return ''; } })()}</div>
                )}
                {puedeEditar && (
                  <div className="flex justify-end">
                    <button onClick={() => setBienvenidaEditando(true)} className="px-6 py-3 rounded-lg bg-green-700 text-white hover:bg-green-800 font-semibold border-2 border-green-900">Editar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleHuesped; 