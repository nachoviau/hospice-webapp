import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const ListaHuespedes = ({ refrescar }) => {
  const [huespedes, setHuespedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerHuespedes = async () => {
      try {
        console.log("🔄 Iniciando carga de huéspedes...");
        setCargando(true);
        setError("");
        
        const querySnapshot = await getDocs(collection(db, "huespedes"));
        console.log("📊 Documentos encontrados:", querySnapshot.size);
        
        const lista = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("📄 Documento:", doc.id, data);
          return {
            id: doc.id,
            ...data,
          };
        });
        
        console.log("✅ Lista final de huéspedes:", lista);
        setHuespedes(lista);
      } catch (error) {
        console.error("❌ Error al obtener huéspedes:", error);
        setError(`Error: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };
    obtenerHuespedes();
  }, [refrescar]);

  if (cargando) return <p className="text-green-700">Cargando huéspedes...</p>;

  if (error) return <p className="text-green-700 bg-orange-100 p-4 rounded-2xl">Error: {error}</p>;

  return (
    <div className="flex flex-col gap-6">
      {huespedes.length === 0 ? (
        <div className="text-center">
                        <p className="text-green-700 text-lg font-medium">Aún no hay huéspedes registrados.</p>
          <p className="text-green-600 text-sm mt-2">Total de documentos: {huespedes.length}</p>
        </div>
      ) : (
        <>
          <p className="text-green-600 text-sm font-medium mb-2">Total de huéspedes: {huespedes.length}</p>
          {huespedes.map((h) => (
            <button
              key={h.id}
              onClick={() => navigate(`/huespedes/${h.id}`)}
              className="bg-green-50 rounded-2xl shadow-md hover:shadow-lg p-8 border border-green-200 text-left text-xl font-semibold text-green-800 hover:bg-green-100 transition-all duration-300 transform hover:-translate-y-1 select-none"
            >
              {h.nombre}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default ListaHuespedes;