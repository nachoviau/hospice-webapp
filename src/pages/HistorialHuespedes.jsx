import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";

const HistorialHuespedes = () => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  if (cargando) return <p className="text-green-700">Cargando historial...</p>;
  if (error) return <p className="text-green-700 bg-orange-100 p-4 rounded-2xl">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-2 pb-16">
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-purple-700 tracking-wide">Historial de huéspedes</h2>
        </div>
        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-purple-700 text-lg font-medium">Aún no hay registros en el historial.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map(it => (
              <div key={it.id} className="bg-purple-50 rounded-2xl shadow p-5 border border-purple-200 text-left">
                <div className="text-2xl sm:text-3xl font-semibold text-purple-900">{it.nombre || 'Sin nombre'}</div>
                {it.despedidoAt?.toDate && (
                  <div className="text-sm text-purple-700 mt-1">
                    Despedido: {it.despedidoAt.toDate().toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialHuespedes; 