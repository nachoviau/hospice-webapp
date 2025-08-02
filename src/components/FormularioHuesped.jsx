import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

const FormularioHuesped = ({ onSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [infoHuesped, setInfoHuesped] = useState("");
  const [gustos, setGustos] = useState("");
  const [movilidad, setMovilidad] = useState("plena");
  const [comeAsistido, setComeAsistido] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const limpiarFormulario = () => {
    setNombre("");
    setInfoHuesped("");
    setGustos("");
    setMovilidad("plena");
    setComeAsistido(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setEnviando(true);
    if (!nombre.trim()) {
      setError("Por favor completá el nombre del huésped.");
      setEnviando(false);
      return;
    }
    try {
      await addDoc(collection(db, "huespedes"), {
        nombre,
        info_huesped: infoHuesped,
        gustos,
        movilidad,
        come_asistido: comeAsistido,
      });
      setMensaje("¡Huésped agregado exitosamente!");
      limpiarFormulario();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("No se pudo agregar el huésped: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-white rounded-xl shadow-xl p-6 flex flex-col gap-4 border border-amber-200">
      <h2 className="text-2xl font-bold text-amber-800 mb-2">Agregar Huésped</h2>
      {mensaje && <p className="text-green-700 bg-green-100 rounded p-2 text-center">{mensaje}</p>}
      {error && <p className="text-amber-700 bg-amber-100 rounded p-2 text-center">{error}</p>}
      <div>
        <label className="block text-amber-900 font-medium mb-1">Nombre*:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Info. huésped:</label>
        <textarea value={infoHuesped} onChange={e => setInfoHuesped(e.target.value)} rows="3" className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" placeholder="Información general del huésped..." />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Gustos:</label>
        <textarea value={gustos} onChange={e => setGustos(e.target.value)} rows="3" className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" placeholder="Gustos y preferencias..." />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Movilidad:</label>
        <select value={movilidad} onChange={e => setMovilidad(e.target.value)} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg">
          <option value="plena">Plena</option>
          <option value="alta">Alta</option>
          <option value="baja">Baja</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={comeAsistido} onChange={e => setComeAsistido(e.target.checked)} id="comeAsistido" className="rounded focus:ring-amber-300" />
        <label htmlFor="comeAsistido" className="text-amber-900 font-medium">Come asistido</label>
      </div>
                <button type="submit" disabled={enviando} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {enviando ? "Agregando..." : "Agregar huésped"}
      </button>
    </form>
  );
};

export default FormularioHuesped; 