import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const TURNOS = [
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
];

const getFechaHoy = () => {
  const hoy = new Date();
  return hoy.toISOString().split("T")[0]; // yyyy-mm-dd
};

const CargarParte = ({ fechaInicial, turnoInicial, onClose }) => {
  const [fecha, setFecha] = useState(fechaInicial || getFechaHoy());
  const [turno, setTurno] = useState(turnoInicial || "mañana");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFecha(fechaInicial || getFechaHoy());
  }, [fechaInicial]);

  useEffect(() => {
    setTurno(turnoInicial || "mañana");
  }, [turnoInicial]);

  // Cargar parte existente si hay
  useEffect(() => {
    const fetchParte = async () => {
      setCargando(true);
      setMensaje("");
      setError("");
      setTexto("");
      try {
        const docRef = doc(db, "partesDiarios", fecha);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const parte = data.turnos?.[turno]?.texto || "";
          setTexto(parte);
        } else {
          setTexto("");
        }
      } catch (err) {
        setError("No se pudo cargar el parte: " + err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchParte();
  }, [fecha, turno]);

  const guardarParte = async () => {
    if (!texto.trim()) {
      setError("El parte no puede estar vacío.");
      return;
    }
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const docRef = doc(db, "partesDiarios", fecha);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        await updateDoc(docRef, {
          [`turnos.${turno}.texto`]: texto,
        });
      } else {
        await setDoc(docRef, {
          fecha,
          turnos: {
            [turno]: { texto },
          },
        });
      }
      setMensaje("¡Parte guardado con éxito!");
      if (onClose) setTimeout(onClose, 500);
    } catch (err) {
      setError("No se pudo guardar el parte: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl mx-auto mt-0 border border-amber-200">
      <h2 className="text-2xl font-bold mb-4 text-amber-900">Cargar parte diario</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block text-amber-900 font-medium mb-1">Día:</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg"
          />
        </div>
        <div>
          <label className="block text-amber-900 font-medium mb-1">Turno:</label>
          <select
            value={turno}
            onChange={e => setTurno(e.target.value)}
            className="rounded-lg border border-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg"
          >
            {TURNOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-amber-700 bg-amber-100 rounded p-2 text-center mb-2">{error}</p>}
      {mensaje && <p className="text-green-700 bg-green-100 rounded p-2 text-center mb-2">{mensaje}</p>}
      {cargando ? (
        <p className="text-amber-700">Cargando parte...</p>
      ) : (
        <>
          <textarea
            rows="8"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            className="w-full p-4 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg mb-4"
            placeholder="Escribí aquí el parte del turno..."
            aria-label="Parte del turno"
          />
          <button
            onClick={guardarParte}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={guardando}
            aria-label="Guardar parte"
          >
            {guardando ? "Guardando..." : "Guardar parte"}
          </button>
        </>
      )}
    </div>
  );
};

export default CargarParte; 