import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CargarParte from "./CargarParte";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { generateSummary } from "../services/chatgptService";
import { FiCalendar, FiPlus, FiEye, FiEdit, FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

const TURNOS = [
  { value: "mañana", label: "Mañana", icon: "🌅", color: "amber" },
  { value: "tarde", label: "Tarde", icon: "☀️", color: "orange" },
  { value: "noche", label: "Noche", icon: "🌙", color: "purple" },
];

const Partes = () => {
  const { puedeEditar } = useAuth();
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [turnoEditar, setTurnoEditar] = useState(null);
  const [partes, setPartes] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [parteVer, setParteVer] = useState(null);
  const [generandoResumen, setGenerandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState("");

  const abrirModal = (turno = null) => {
    if (!puedeEditar) return; // No permitir editar si es usuario anónimo
    setTurnoEditar(turno);
    setModalAbierto(true);
  };
  
  const cerrarModal = () => {
    setModalAbierto(false);
    setTurnoEditar(null);
  };
  
  const abrirVer = (turno, texto) => {
    // Buscar las imágenes del parte
    const parteCompleto = partes[turnoToKey(turno)];
    const imagenes = parteCompleto?.imagenes || [];
    setParteVer({ turno, texto, imagenes });
  };

  const turnoToKey = (turnoLabel) => {
    const turnoMap = {
      'Mañana': 'mañana',
      'Tarde': 'tarde', 
      'Noche': 'noche'
    };
    return turnoMap[turnoLabel] || turnoLabel.toLowerCase();
  };

  const cerrarVer = () => setParteVer(null);

  useEffect(() => {
    const fetchPartes = async () => {
      setCargando(true);
      setError("");
      setPartes({});
      try {
        const docRef = doc(db, "partesDiarios", fecha);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setPartes(snapshot.data().turnos || {});
          if (snapshot.data().resumen) {
            setPartes(prev => ({ ...prev, resumen: snapshot.data().resumen }));
          }
        } else {
          setPartes({});
        }
      } catch (err) {
        setError("Error al cargar los partes: " + err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchPartes();
  }, [fecha, modalAbierto, generandoResumen]);

  const generarResumen = async () => {
    if (!puedeEditar) return; // No permitir generar resumen si es usuario anónimo
    
    setGenerandoResumen(true);
    setErrorResumen("");
    try {
              const resumenTexto = await generateSummary(
          fecha,
          partes["mañana"]?.texto || "",
          partes["tarde"]?.texto || "",
          partes["noche"]?.texto || ""
        );

        const docRef = doc(db, "partesDiarios", fecha);
      await updateDoc(docRef, {
        resumen: { texto: resumenTexto, generadoPorIA: true, fechaGeneracion: new Date() }
      });

      setPartes(prev => ({
        ...prev,
        resumen: { texto: resumenTexto, generadoPorIA: true }
      }));

    } catch (err) {
      setErrorResumen(err.message || "Error al generar resumen");
    } finally {
      setGenerandoResumen(false);
    }
  };

  const resumenYaExiste = !!partes.resumen?.texto;
  const partesCompletos = partes["mañana"]?.texto && partes["tarde"]?.texto && partes["noche"]?.texto;
  const partesCargados = Object.values(TURNOS).filter(t => partes[t.value]?.texto).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 p-2 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Partes Diarios</h1>
          <p className="text-amber-700 text-lg">Gestión de reportes por turnos</p>
        </div>

        {/* Controles principales */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6 border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <FiCalendar className="text-2xl text-gray-600" />
                <label className="text-lg font-semibold text-gray-800">Fecha:</label>
              </div>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-medium bg-white/70"
              />
            </div>
            
            {puedeEditar && (
              <button
                onClick={() => abrirModal(null)}
                className="bg-green-700 text-white px-8 py-3 rounded-xl hover:bg-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 font-semibold flex items-center gap-2 border-2 border-green-900 select-none"
              >
                <FiPlus className="w-5 h-5" />
                Cargar Parte
              </button>
            )}

          </div>

          {/* Estadísticas */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-4">
                <FiFileText className="text-3xl text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-semibold">Partes Cargados</p>
                  <p className="text-3xl font-bold text-green-800">{partesCargados}/3</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorResumen && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2">
                              <FiAlertCircle className="text-amber-600 w-5 h-5" />
                <p className="text-amber-700 font-medium">{errorResumen}</p>
            </div>
          </div>
        )}

        {/* Lista de turnos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {TURNOS.map((turno) => {
            const parte = partes[turno.value];
            const tieneTexto = parte?.texto;
            
            return (
              <div
                key={turno.value}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-200 ${
                  tieneTexto 
                    ? "border-green-300 hover:border-green-400" 
                    : "border-gray-300"
                }`}
              >
                <div className={`p-6 ${tieneTexto ? "bg-green-50" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{turno.icon}</span>
                      <h3 className={`text-xl font-bold ${tieneTexto ? "text-green-800" : "text-gray-600"}`}>
                        {turno.label}
                      </h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      tieneTexto 
                        ? "bg-green-200 text-green-800" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {tieneTexto ? "Cargado" : "Pendiente"}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tieneTexto ? (
                      <>
                        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
                          <p className="text-gray-700 text-sm line-clamp-3">
                            {parte.texto.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirVer(turno.label, parte.texto)}
                            className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            <FiEye className="w-4 h-4" />
                            Ver
                          </button>
                          {puedeEditar && (
                            <button
                              onClick={() => abrirModal(turno.value)}
                              className="flex-1 bg-amber-100 text-amber-700 py-2 px-4 rounded-lg hover:bg-amber-200 transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                              <FiEdit className="w-4 h-4" />
                              Editar
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3 text-gray-400">📝</div>
                        <p className="text-gray-500 font-medium">Aún no hay parte cargado para este turno</p>
                        <p className="text-gray-400 text-sm mt-2">Usa el botón "Cargar Parte" para agregar contenido</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para generar resumen */}
        {!resumenYaExiste && partesCompletos && puedeEditar && (
          <div className="mb-6">
            <button
              onClick={generarResumen}
              disabled={generandoResumen}
              className="w-full bg-gradient-to-r from-green-700 to-purple-600 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 border-2 border-green-900 select-none"
            >
              {generandoResumen ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generando resumen...
                </>
              ) : (
                <>
                  <FiFileText className="w-5 h-5" />
                  Combinar Reportes del Día
                </>
              )}
            </button>
          </div>
        )}

        {/* Resumen del día */}
        {resumenYaExiste && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📊</div>
                <h3 className="text-2xl font-bold text-purple-800">Resumen del Día</h3>
              </div>
              <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Generado por IA
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-300 shadow-sm">
              <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">
                {partes.resumen.texto}
              </p>
            </div>
            
            {partes.resumen.fechaGeneracion && (
              <div className="mt-4 text-sm text-purple-600">
                Generado el: {partes.resumen.fechaGeneracion.toDate().toLocaleString('es-ES')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para cargar/editar parte */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto border border-amber-200 overscroll-contain">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-amber-900">
                {turnoEditar ? `Editar Parte - ${TURNOS.find(t => t.value === turnoEditar)?.label}` : "Cargar Nuevo Parte"}
              </h3>
              <button
                onClick={cerrarModal}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
                          <CargarParte 
                fechaInicial={fecha} 
                turnoInicial={turnoEditar} 
                onClose={cerrarModal}
            />
          </div>
        </div>
      )}

      {/* Modal para ver parte */}
      {parteVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto border border-amber-200 overscroll-contain">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-amber-900">
                Parte - {parteVer.turno}
              </h3>
              <button
                onClick={cerrarVer}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">
                {parteVer.texto}
              </p>
            </div>
            
            {/* Mostrar imágenes si existen */}
            {parteVer.imagenes && parteVer.imagenes.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-amber-900 mb-4">
                  Imágenes ({parteVer.imagenes.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {parteVer.imagenes.map((imagen, index) => (
                    <div key={index} className="group cursor-pointer">
                      <img
                        src={imagen.url}
                        alt={imagen.name || `Imagen ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-shadow group-hover:scale-105 transform transition-transform"
                        onClick={() => window.open(imagen.url, '_blank')}
                      />
                      <p className="text-xs text-amber-600 mt-1 truncate">
                        {imagen.name || `imagen_${index + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2 italic">
                  Click en una imagen para verla en tamaño completo
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Partes; 