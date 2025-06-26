import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

const FormularioHuesped = ({ onSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [medicacion, setMedicacion] = useState("");
  const [comeAsistido, setComeAsistido] = useState(false);
  const [movilidad, setMovilidad] = useState("plena");
  const [gustos, setGustos] = useState("");
  const [historia, setHistoria] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const limpiarFormulario = () => {
    setNombre("");
    setDiagnostico("");
    setMedicacion("");
    setComeAsistido(false);
    setMovilidad("plena");
    setGustos("");
    setHistoria("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setEnviando(true);
    if (!nombre.trim() || !diagnostico.trim()) {
      setError("Por favor completá los campos requeridos.");
      setEnviando(false);
      return;
    }
    try {
      await addDoc(collection(db, "huespedes"), {
        nombre,
        diagnostico,
        medicacion,
        come_asistido: comeAsistido,
        movilidad,
        gustos,
        historia,
      });
      setMensaje("¡Huésped agregado exitosamente!");
      limpiarFormulario();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Error al agregar huésped: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-white/90 rounded-xl shadow-md p-6 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-amber-800 mb-2">Agregar Huésped</h2>
      {mensaje && <p className="text-green-700 bg-green-100 rounded p-2 text-center">{mensaje}</p>}
      {error && <p className="text-red-700 bg-red-100 rounded p-2 text-center">{error}</p>}
      <div>
        <label className="block text-amber-900 font-medium mb-1">Nombre*:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Diagnóstico*:</label>
        <input type="text" value={diagnostico} onChange={e => setDiagnostico(e.target.value)} required className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Medicación:</label>
        <input type="text" value={medicacion} onChange={e => setMedicacion(e.target.value)} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={comeAsistido} onChange={e => setComeAsistido(e.target.checked)} id="comeAsistido" className="rounded focus:ring-amber-300" />
        <label htmlFor="comeAsistido" className="text-amber-900 font-medium">Come asistido</label>
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Movilidad:</label>
        <select value={movilidad} onChange={e => setMovilidad(e.target.value)} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg">
          <option value="plena">Plena</option>
          <option value="asistida">Asistida</option>
          <option value="baja">Baja</option>
        </select>
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Gustos:</label>
        <textarea value={gustos} onChange={e => setGustos(e.target.value)} rows={2} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <div>
        <label className="block text-amber-900 font-medium mb-1">Historia clínica:</label>
        <textarea value={historia} onChange={e => setHistoria(e.target.value)} rows={2} className="w-full rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg" />
      </div>
      <button type="submit" disabled={enviando} className="w-full py-3 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-900 font-bold text-lg shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {enviando ? "Agregando..." : "Agregar huésped"}
      </button>
    </form>
  );
};

export default FormularioHuesped; 