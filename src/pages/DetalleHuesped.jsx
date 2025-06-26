import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const DetalleHuesped = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [huesped, setHuesped] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [editData, setEditData] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const fetchHuesped = async () => {
      try {
        const docRef = doc(db, "huespedes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHuesped({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Huésped no encontrado.");
        }
      } catch (err) {
        setError("Error al obtener huésped: " + err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchHuesped();
  }, [id]);

  const startEdit = () => {
    setEditando(true);
    setEditData({
      nombre: huesped.nombre || "",
      diagnostico: huesped.diagnostico || "",
      medicacion: huesped.medicacion || "",
      come_asistido: huesped.come_asistido || false,
      movilidad: huesped.movilidad || "plena",
      gustos: huesped.gustos || "",
      historia: huesped.historia || "",
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
      setError("Error al guardar cambios: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarHuesped = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este huésped?")) return;
    setEliminando(true);
    try {
      await deleteDoc(doc(db, "huespedes", id));
      navigate("/huespedes");
    } catch (err) {
      setError("Error al eliminar huésped: " + err.message);
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) return <p className="text-amber-700">Cargando...</p>;
  if (error) return <p className="text-red-700 bg-red-100 rounded p-2 text-center">{error}</p>;
  if (!huesped) return null;

  return (
    <div className="max-w-xl mx-auto bg-white/90 rounded-2xl shadow-lg p-8 mt-8">
      <button onClick={() => navigate(-1)} className="mb-6 text-amber-700 hover:underline text-base">&larr; Volver</button>
      <h2 className="text-3xl font-bold text-amber-900 mb-6">{huesped.nombre}</h2>
      {editando ? (
        <form onSubmit={e => { e.preventDefault(); guardarEdicion(); }} className="flex flex-col gap-4">
          <div>
            <label className="block text-amber-900 font-medium mb-1">Nombre:</label>
            <input name="nombre" value={editData.nombre} onChange={handleEditChange} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Diagnóstico:</label>
            <input name="diagnostico" value={editData.diagnostico} onChange={handleEditChange} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Gustos:</label>
            <textarea name="gustos" value={editData.gustos} onChange={handleEditChange} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Historia clínica:</label>
            <textarea name="historia" value={editData.historia} onChange={handleEditChange} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Medicación:</label>
            <input name="medicacion" value={editData.medicacion} onChange={handleEditChange} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
          </div>
          <div>
            <label className="block text-amber-900 font-medium mb-1">Movilidad:</label>
            <select name="movilidad" value={editData.movilidad} onChange={handleEditChange} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg">
              <option value="plena">Plena</option>
              <option value="asistida">Asistida</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="come_asistido" checked={editData.come_asistido} onChange={handleEditChange} className="rounded focus:ring-amber-300" />
            <label htmlFor="come_asistido" className="text-amber-900 font-medium">Come asistido</label>
          </div>
          <div className="flex gap-4 mt-4">
            <button type="submit" disabled={guardando} className="flex-1 py-3 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-900 font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Guardar</button>
            <button type="button" onClick={() => setEditando(false)} className="flex-1 py-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-lg shadow transition-colors">Cancelar</button>
          </div>
        </form>
      ) : (
        <>
          <dl className="mb-6">
            <dt className="font-semibold text-amber-800">Diagnóstico:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.diagnostico}</dd>
            <dt className="font-semibold text-amber-800">Gustos:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.gustos}</dd>
            <dt className="font-semibold text-amber-800">Historia clínica:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.historia}</dd>
            <dt className="font-semibold text-amber-800">Medicación:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.medicacion}</dd>
            <dt className="font-semibold text-amber-800">Movilidad:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.movilidad}</dd>
            <dt className="font-semibold text-amber-800">Come asistido:</dt>
            <dd className="mb-2 text-lg text-amber-900">{huesped.come_asistido ? "Sí" : "No"}</dd>
          </dl>
          <div className="flex gap-4">
            <button onClick={startEdit} className="flex-1 py-3 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-900 font-bold text-lg shadow transition-colors">Editar</button>
            <button onClick={eliminarHuesped} disabled={eliminando} className="flex-1 py-3 rounded-lg bg-red-200 hover:bg-red-300 text-red-900 font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
};

export default DetalleHuesped; 