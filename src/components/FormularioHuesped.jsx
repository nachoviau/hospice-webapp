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
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto bg-orange-50 rounded-3xl shadow-lg p-8 flex flex-col gap-6 border border-orange-200">
      <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">Agregar Huésped</h2>
      {mensaje && <p className="text-green-700 bg-green-100 rounded p-2 text-center">{mensaje}</p>}
      {error && <p className="text-green-700 bg-orange-100 rounded-2xl p-3 text-center">{error}</p>}
      <div>
        <label className="block text-green-800 font-semibold mb-2">Nombre*:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" />
      </div>
      <div>
        <label className="block text-green-800 font-semibold mb-2">Info. huésped:</label>
        <textarea value={infoHuesped} onChange={e => setInfoHuesped(e.target.value)} rows="4" className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" placeholder="Información general del huésped..." />
      </div>
      <div>
        <label className="block text-green-800 font-semibold mb-2">Gustos:</label>
        <textarea value={gustos} onChange={e => setGustos(e.target.value)} rows="4" className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm" placeholder="Gustos y preferencias..." />
      </div>
      <div>
        <label className="block text-green-800 font-semibold mb-2">Movilidad:</label>
        <select value={movilidad} onChange={e => setMovilidad(e.target.value)} className="w-full rounded-xl border border-orange-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg bg-white shadow-sm">
          <option value="plena">Plena</option>
          <option value="alta">Alta</option>
          <option value="baja">Baja</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={comeAsistido} onChange={e => setComeAsistido(e.target.checked)} id="comeAsistido" className="rounded focus:ring-amber-300" />
        <label htmlFor="comeAsistido" className="text-green-800 font-semibold">Come asistido</label>
      </div>
                <button type="submit" disabled={enviando} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 select-none">
        {enviando ? "Agregando..." : "Agregar huésped"}
      </button>
    </form>
  );
};

export default FormularioHuesped; 