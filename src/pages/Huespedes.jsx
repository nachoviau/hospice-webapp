import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ListaHuespedes from "../components/ListaHuespedes";
import { FiUserPlus, FiX } from "react-icons/fi";
import FormularioHuesped from "../components/FormularioHuesped";

const Huespedes = () => {
  const { puedeEditar } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [refrescar, setRefrescar] = useState(0);
  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);
  const onAgregado = () => {
    setRefrescar(r => r + 1);
    cerrarModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-6 pb-20">
      <div className="flex flex-col gap-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-green-800 tracking-wide">Huéspedes</h2>
          {puedeEditar && (
            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-3 py-2 text-base shadow transition-colors sm:px-6 sm:py-3 sm:text-lg select-none"
              onClick={abrirModal}
            >
              <FiUserPlus /> Agregar huésped
            </button>
          )}
        </div>
        <ListaHuespedes refrescar={refrescar} />

        {/* Modal */}
        {modalAbierto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={cerrarModal}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-8 relative w-full max-w-lg mx-4 animate-fadeIn border border-amber-200 max-h-[90vh] overflow-y-auto overscroll-contain"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-2xl text-amber-900 hover:text-amber-600"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <FiX />
              </button>
              <FormularioHuesped onSuccess={onAgregado} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Huespedes; 