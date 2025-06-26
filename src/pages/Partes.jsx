import { useState, useEffect } from "react";
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
    setTurnoEditar(turno);
    setModalAbierto(true);
  };
  
  const cerrarModal = () => {
    setModalAbierto(false);
    setTurnoEditar(null);
  };
  
  const abrirVer = (turno, texto) => setParteVer({ turno, texto });
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Partes Diarios</h1>
          <p className="text-amber-700 text-lg">Gestión de reportes por turnos</p>
        </div>

        {/* Controles principales */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-amber-100">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <FiCalendar className="text-2xl text-amber-600" />
                <label className="text-lg font-semibold text-amber-800">Fecha:</label>
              </div>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all text-lg font-medium"
              />
            </div>
            
            <button
              onClick={() => abrirModal(null)}
              className="bg-amber-600 text-white px-8 py-3 rounded-xl hover:bg-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Cargar Parte
            </button>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <FiFileText className="text-2xl text-amber-600" />
                <div>
                  <p className="text-sm text-amber-600 font-medium">Partes Cargados</p>
                  <p className="text-2xl font-bold text-amber-800">{partesCargados}/3</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <FiClock className="text-2xl text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Estado</p>
                  <p className="text-lg font-bold text-orange-800">
                    {partesCargados === 3 ? "Completo" : "Pendiente"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-2xl text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Resumen</p>
                  <p className="text-lg font-bold text-purple-800">
                    {resumenYaExiste ? "Generado" : "Pendiente"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para generar resumen */}
        {!resumenYaExiste && partesCompletos && (
          <div className="mb-6">
            <button
              onClick={generarResumen}
              disabled={generandoResumen}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
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

        {errorResumen && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-red-600 w-5 h-5" />
              <p className="text-red-700 font-medium">{errorResumen}</p>
            </div>
          </div>
        )}

        {/* Resumen del día */}
        {partes.resumen?.texto && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl shadow-lg p-6 border border-yellow-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-800">Resumen del Día</h3>
                  <p className="text-yellow-600 text-sm">Resumen combinado automáticamente</p>
                </div>
              </div>
              <button
                onClick={() => setParteVer({ turno: "Resumen del día", texto: partes.resumen.texto })}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" />
                Ver Completo
              </button>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-200">
              <p className="text-yellow-800 line-clamp-3">
                {partes.resumen.texto.substring(0, 200)}...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-red-600 w-5 h-5" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Lista de turnos */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-amber-700 font-medium">Cargando partes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TURNOS.map(turno => (
              <div key={turno.value} className="bg-white rounded-2xl shadow-xl p-6 border border-amber-100 hover:shadow-2xl transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{turno.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-800">{turno.label}</h3>
                      <p className="text-amber-600 text-sm">Turno</p>
                    </div>
                  </div>
                  {partes[turno.value]?.texto && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirVer(turno.label, partes[turno.value].texto)}
                        className="bg-amber-100 text-amber-700 p-2 rounded-lg hover:bg-amber-200 transition-colors"
                        title="Ver parte"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => abrirModal(turno.value)}
                        className="bg-orange-100 text-orange-700 p-2 rounded-lg hover:bg-orange-200 transition-colors"
                        title="Editar parte"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  {partes[turno.value]?.texto ? (
                    <div className="flex items-center gap-2 text-amber-700">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Parte cargado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <FiAlertCircle className="w-5 h-5" />
                      <span className="font-medium">Sin parte cargado</span>
                    </div>
                  )}
                </div>

                {!partes[turno.value]?.texto && (
                  <button
                    onClick={() => abrirModal(turno.value)}
                    className="w-full mt-4 bg-amber-600 text-white py-3 px-4 rounded-xl hover:bg-amber-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Cargar Parte
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal para cargar/editar parte */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-2xl text-amber-600 hover:text-amber-800 transition-colors p-2 hover:bg-amber-100 rounded-full"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <FiX className="w-6 h-6" />
              </button>
              <CargarParte fechaInicial={fecha} turnoInicial={turnoEditar} onClose={cerrarModal} />
            </div>
          </div>
        )}

        {/* Modal para ver parte o resumen */}
        {parteVer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-2xl text-amber-600 hover:text-amber-800 transition-colors p-2 hover:bg-amber-100 rounded-full"
                onClick={cerrarVer}
                aria-label="Cerrar"
              >
                <FiX className="w-6 h-6" />
              </button>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-amber-800 mb-2">{parteVer.turno}</h3>
                <div className="w-16 h-1 bg-amber-600 rounded-full"></div>
              </div>
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 max-h-[60vh] overflow-y-auto">
                <div className="whitespace-pre-line text-amber-800 text-lg leading-relaxed">
                  {parteVer.texto}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Partes; 