import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
      await deleteDoc(doc(db, "huespedes", id));
      navigate("/huespedes");
    } catch (err) {
      setError("No se pudo dar de baja al huésped: " + err.message);
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) return <p className="text-amber-700">Cargando...</p>;
  if (error) return <p className="text-amber-700 bg-amber-100 rounded p-2 text-center">{error}</p>;
  if (!huesped) return null;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8 border border-amber-200">
      <button onClick={() => navigate(-1)} className="mb-6 text-amber-700 hover:underline text-base">&larr; Volver</button>
      <h2 className="text-3xl font-bold text-amber-900 mb-6">{huesped.nombre}</h2>
      {editando ? (
        <form onSubmit={e => { e.preventDefault(); guardarEdicion(); }} className="flex flex-col gap-4">
          <div>
            <label className="block text-amber-900 font-medium mb-1">Nombre:</label>
            <input name="nombre" value={editData.nombre} onChange={handleEditChange} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Info. huésped:</label>
            <textarea name="info_huesped" value={editData.info_huesped} onChange={handleEditChange} rows="3" className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" placeholder="Información general del huésped..." />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Gustos:</label>
            <textarea name="gustos" value={editData.gustos} onChange={handleEditChange} rows="3" className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" placeholder="Gustos y preferencias..." />
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
          <dl className="mb-6 space-y-4">
            <div>
              <dt className="font-semibold text-amber-800">Info. huésped:</dt>
              <dd className="mt-1 text-lg text-amber-900 bg-amber-50 p-3 rounded-lg">
                {huesped.info_huesped || "No hay información disponible"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-800">Gustos:</dt>
              <dd className="mt-1 text-lg text-amber-900 bg-amber-50 p-3 rounded-lg">
                {huesped.gustos || "No hay gustos registrados"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-800">Movilidad:</dt>
              <dd className="mt-1 text-lg text-amber-900">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  huesped.movilidad === 'plena' ? 'bg-blue-100 text-blue-800' :
                  huesped.movilidad === 'alta' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {huesped.movilidad === 'plena' ? 'Plena' :
                   huesped.movilidad === 'alta' ? 'Alta' : 'Baja'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-800">Come asistido:</dt>
              <dd className="mt-1 text-lg text-amber-900">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  huesped.come_asistido ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {huesped.come_asistido ? "Sí" : "No"}
                </span>
              </dd>
            </div>
          </dl>
          {puedeEditar && (
            <div className="flex gap-4">
              <button onClick={startEdit} className="flex-1 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg shadow transition-colors">Editar</button>
              <button onClick={confirmarEliminacion} disabled={eliminando} className="flex-1 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {eliminando ? "Procesando..." : "A-dios"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🕊️</div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">
                Confirmar despedida
              </h3>
              <p className="text-amber-700 text-lg">
                ¿Deseas dar de baja a <strong>{huesped.nombre}</strong> del sistema?
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-6 py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarHuesped}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleHuesped; 