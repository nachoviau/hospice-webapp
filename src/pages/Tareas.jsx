import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiCheck, FiTrash2, FiEdit3, FiX } from "react-icons/fi";

const Tareas = () => {
  const { puedeEditar } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    completada: false
  });

  // Cargar tareas desde Firestore
  useEffect(() => {
    const cargarTareas = async () => {
      try {
        const q = query(collection(db, "tareas"), orderBy("fechaCreacion", "desc"));
        const querySnapshot = await getDocs(q);
        const tareasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaCreacion: doc.data().fechaCreacion?.toDate(),
          fechaCompletada: doc.data().fechaCompletada?.toDate()
        }));
        setTareas(tareasData);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      }
    };
    cargarTareas();
  }, []);

  const abrirModal = (tarea = null) => {
    if (!puedeEditar) return; // No permitir editar si es usuario anónimo
    
    if (tarea) {
      setEditando(tarea);
      setFormData({
        titulo: tarea.titulo || "",
        descripcion: tarea.descripcion || "",
        completada: tarea.completada || false
      });
    } else {
      setEditando(null);
      setFormData({
        titulo: "",
        descripcion: "",
        completada: false
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
  };

  const guardarTarea = async () => {
    try {
      const tareaData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        completada: formData.completada,
        fechaCreacion: editando ? editando.fechaCreacion : new Date(),
        fechaCompletada: formData.completada ? new Date() : null
      };

      if (editando) {
        // Actualizar tarea existente
        await updateDoc(doc(db, "tareas", editando.id), tareaData);
        setTareas(prev => prev.map(t => 
          t.id === editando.id ? { ...t, ...tareaData } : t
        ));
      } else {
        // Crear nueva tarea
        const docRef = await addDoc(collection(db, "tareas"), tareaData);
        const nuevaTarea = { id: docRef.id, ...tareaData };
        setTareas(prev => [nuevaTarea, ...prev]);
      }
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar tarea:", error);
    }
  };

  const toggleCompletada = async (tarea) => {
    if (!puedeEditar) return; // No permitir cambiar estado si es usuario anónimo
    
    try {
      const nuevaCompletada = !tarea.completada;
      await updateDoc(doc(db, "tareas", tarea.id), {
        completada: nuevaCompletada,
        fechaCompletada: nuevaCompletada ? new Date() : null
      });
      setTareas(prev => prev.map(t => 
        t.id === tarea.id 
          ? { ...t, completada: nuevaCompletada, fechaCompletada: nuevaCompletada ? new Date() : null }
          : t
      ));
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
    }
  };

  const confirmarEliminacion = (tarea) => {
    if (!puedeEditar) return; // No permitir eliminar si es usuario anónimo
    setTareaAEliminar(tarea);
    setMostrarConfirmacion(true);
  };

  const eliminarTarea = async () => {
    if (!tareaAEliminar) return;
    
    try {
      await deleteDoc(doc(db, "tareas", tareaAEliminar.id));
      setTareas(prev => prev.filter(t => t.id !== tareaAEliminar.id));
      setMostrarConfirmacion(false);
      setTareaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
    }
  };

  const tareasFiltradas = tareas.filter(tarea => 
    mostrarCompletadas ? tarea.completada : !tarea.completada
  );

  const tareasPendientes = tareas.filter(tarea => !tarea.completada).length;
  const tareasCompletadas = tareas.filter(tarea => tarea.completada).length;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-amber-900">Tareas Pendientes</h2>
          {puedeEditar && (
            <button
              onClick={() => abrirModal()}
                              className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FiPlus className="text-xl" />
              Nueva Tarea
            </button>
          )}
        </div>

        {/* Estadísticas */}
        <div className="flex gap-6 mb-6">
          <div className="flex-1 bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="text-2xl font-bold text-amber-800">{tareasPendientes}</div>
            <div className="text-sm text-amber-600">Pendientes</div>
          </div>
          <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-800">{tareasCompletadas}</div>
            <div className="text-sm text-green-600">Completadas</div>
          </div>
        </div>

        {/* Botones de filtro */}
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarCompletadas(false)}
            className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 ${
              !mostrarCompletadas 
                ? "bg-amber-200 border-amber-400 text-amber-900 shadow-md" 
                : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
            }`}
          >
            Pendientes ({tareasPendientes})
          </button>
          <button
            onClick={() => setMostrarCompletadas(true)}
            className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 ${
              mostrarCompletadas 
                ? "bg-green-200 border-green-400 text-green-900 shadow-md" 
                : "bg-white border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            Completadas ({tareasCompletadas})
          </button>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-200">
        {tareasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {mostrarCompletadas ? "✅" : "📝"}
            </div>
            <h3 className="text-xl font-semibold text-amber-800 mb-2">
              {mostrarCompletadas ? "No hay tareas completadas" : "No hay tareas pendientes"}
            </h3>
            <p className="text-amber-600 mb-6">
              {mostrarCompletadas 
                ? "Completa algunas tareas para verlas aquí."
                : "¡Crea tu primera tarea para empezar!"
              }
            </p>
            {!mostrarCompletadas && puedeEditar && (
              <button
                onClick={() => abrirModal()}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                + Crear primera tarea
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-amber-100">
            {tareasFiltradas.map((tarea) => (
              <div
                key={tarea.id}
                className={`p-6 transition-all duration-200 hover:bg-amber-50 ${
                  tarea.completada ? "bg-green-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleCompletada(tarea)}
                    disabled={!puedeEditar}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                      tarea.completada
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-amber-300 hover:border-amber-500"
                    } ${!puedeEditar ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {tarea.completada && <FiCheck className="w-full h-full p-0.5" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      tarea.completada 
                        ? "text-green-800 line-through" 
                        : "text-amber-900"
                    }`}>
                      {tarea.titulo}
                    </h3>
                    <p className={`text-sm mb-2 ${
                      tarea.completada 
                        ? "text-green-600 line-through" 
                        : "text-amber-700"
                    }`}>
                      {tarea.descripcion}
                    </p>
                    <div className="text-xs text-amber-500">
                      Creada: {tarea.fechaCreacion?.toLocaleDateString('es-ES')}
                      {tarea.fechaCompletada && (
                        <span className="ml-4 text-green-500">
                          Completada: {tarea.fechaCompletada.toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {puedeEditar && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModal(tarea)}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmarEliminacion(tarea)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Dar de baja"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar tarea */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all border border-amber-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-amber-900">
                {editando ? "Editar Tarea" : "Nueva Tarea"}
              </h3>
              <button
                onClick={cerrarModal}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  placeholder="Título de la tarea"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all resize-none"
                  rows="4"
                  placeholder="Descripción de la tarea"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="completada"
                  checked={formData.completada}
                  onChange={(e) => setFormData(prev => ({ ...prev, completada: e.target.checked }))}
                  className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="completada" className="text-sm font-semibold text-amber-800">
                  Marcar como completada
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-6 py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarTarea}
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                >
                  {editando ? "Actualizar" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && tareaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all border border-amber-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">
                Confirmar baja
              </h3>
              <p className="text-amber-700 text-lg">
                ¿Deseas dar de baja la tarea <strong>"{tareaAEliminar.titulo}"</strong> del sistema?
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setTareaAEliminar(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarTarea}
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

export default Tareas; 