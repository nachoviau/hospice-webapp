import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import addWeeks from "date-fns/addWeeks";
import subWeeks from "date-fns/subWeeks";
import addMonths from "date-fns/addMonths";
import subMonths from "date-fns/subMonths";
import es from "date-fns/locale/es";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Estilos personalizados para el calendario
const calendarStyles = {
  // Contenedor principal
  '.rbc-calendar': {
    backgroundColor: '#fdf6ec',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  // Header del calendario
  '.rbc-header': {
    backgroundColor: '#f7ecd7',
    color: '#6d4c1b',
    fontWeight: 'bold',
    padding: '12px 8px',
    borderBottom: '2px solid #e0d1bd',
    fontSize: '14px',
  },
  
  // Celdas de días
  '.rbc-day-bg': {
    backgroundColor: '#ffffff',
    border: '1px solid #e0d1bd',
  },
  
  // Día actual
  '.rbc-today': {
    backgroundColor: '#f3e6d2 !important',
  },
  
  // Eventos
  '.rbc-event': {
    backgroundColor: '#e9decf !important',
    color: '#6d4c1b !important',
    border: 'none !important',
    borderRadius: '8px !important',
    padding: '4px 8px !important',
    fontSize: '12px !important',
    fontWeight: '500 !important',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
  },
  
  // Eventos al hacer hover
  '.rbc-event:hover': {
    backgroundColor: '#d4c4a8 !important',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15) !important',
  },
  
  // Botones de navegación
  '.rbc-btn-group button': {
    backgroundColor: '#f7ecd7',
    color: '#6d4c1b',
    border: '1px solid #e0d1bd',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '600',
  },
  
  '.rbc-btn-group button:hover': {
    backgroundColor: '#e9decf',
  },
  
  '.rbc-btn-group button.rbc-active': {
    backgroundColor: '#6d4c1b',
    color: '#ffffff',
  },
  
  // Toolbar del calendario
  '.rbc-toolbar': {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f7ecd7',
    borderRadius: '12px',
    border: '1px solid #e0d1bd',
  },
  
  // Título del mes/semana
  '.rbc-toolbar-label': {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6d4c1b',
  },
  
  // Horas en vista semanal
  '.rbc-time-header': {
    backgroundColor: '#f7ecd7',
    borderBottom: '2px solid #e0d1bd',
  },
  
  '.rbc-time-content': {
    backgroundColor: '#ffffff',
  },
  
  // Líneas de tiempo
  '.rbc-timeslot-group': {
    borderBottom: '1px solid #e0d1bd',
  },
  
  '.rbc-time-slot': {
    borderTop: '1px solid #f3e6d2',
  },
  
  // Selección de slots
  '.rbc-slot-selecting': {
    backgroundColor: 'rgba(109, 76, 27, 0.1) !important',
  },
  
  // Scrollbar personalizado
  '.rbc-time-content::-webkit-scrollbar': {
    width: '8px',
  },
  
  '.rbc-time-content::-webkit-scrollbar-track': {
    backgroundColor: '#f3e6d2',
    borderRadius: '4px',
  },
  
  '.rbc-time-content::-webkit-scrollbar-thumb': {
    backgroundColor: '#d4c4a8',
    borderRadius: '4px',
  },
  
  '.rbc-time-content::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#6d4c1b',
  },
  
  // Estilos para vista agenda
  '.rbc-agenda-view': {
    backgroundColor: '#ffffff',
  },
  
  '.rbc-agenda-view table': {
    borderCollapse: 'collapse',
    width: '100%',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table': {
    border: '1px solid #e0d1bd',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td': {
    padding: '12px 16px',
    borderBottom: '1px solid #f3e6d2',
    verticalAlign: 'top',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td:first-child': {
    fontWeight: 'bold',
    color: '#6d4c1b',
    backgroundColor: '#f7ecd7',
    borderRight: '1px solid #e0d1bd',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td:last-child': {
    backgroundColor: '#ffffff',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table tbody > tr:hover': {
    backgroundColor: '#fdf6ec',
  },
  
  '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td:first-child:hover': {
    backgroundColor: '#e9decf',
  },
  
  // Estilos para mensaje de no eventos
  '.rbc-agenda-empty': {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6d4c1b',
    fontSize: '16px',
    backgroundColor: '#fdf6ec',
    borderRadius: '8px',
    margin: '20px',
  },
  
  // Estilos para inputs de fecha y hora
  'input[type="date"], input[type="time"]': {
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  
  'input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator': {
    filter: 'invert(0.4) sepia(1) saturate(2) hue-rotate(30deg)',
    cursor: 'pointer',
  }
};

const locales = {
  "es": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes
  getDay,
  locales,
});

const Calendario = () => {
  const { puedeEditar } = useAuth();
  const [vista, setVista] = useState("week");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hora después
    allDay: false,
    description: ""
  });

  // Funciones de navegación
  const irAnterior = () => {
    if (vista === "week") {
      setFechaActual(prev => subWeeks(prev, 1));
    } else if (vista === "month") {
      setFechaActual(prev => subMonths(prev, 1));
    } else if (vista === "agenda") {
      setFechaActual(prev => subWeeks(prev, 1));
    }
  };

  const irSiguiente = () => {
    if (vista === "week") {
      setFechaActual(prev => addWeeks(prev, 1));
    } else if (vista === "month") {
      setFechaActual(prev => addMonths(prev, 1));
    } else if (vista === "agenda") {
      setFechaActual(prev => addWeeks(prev, 1));
    }
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  // Cargar eventos desde Firestore
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const eventosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate()
        }));
        setEventos(eventosData);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      }
    };
    cargarEventos();
  }, []);

  const abrirModalNuevo = () => {
    if (!puedeEditar) return; // No permitir crear si es usuario anónimo
    
    const ahora = new Date();
    const horaInicio = new Date(ahora.getTime() + 30 * 60 * 1000); // 30 minutos después
    const horaFin = new Date(horaInicio.getTime() + 60 * 60 * 1000); // 1 hora después
    
    setEventoEditando(null);
    setFormData({
      title: "",
      start: horaInicio,
      end: horaFin,
      allDay: false,
      description: ""
    });
    setModalAbierto(true);
  };

  const abrirModal = (evento = null) => {
    if (!puedeEditar) return; // No permitir editar si es usuario anónimo
    
    if (evento) {
      // Editar evento existente
      setEventoEditando(evento);
      setFormData({
        title: evento.title || "",
        start: evento.start,
        end: evento.end,
        allDay: evento.allDay || false,
        description: evento.description || ""
      });
    } else {
      // Nuevo evento - mantener las fechas que ya están en formData
      setEventoEditando(null);
      // No resetear las fechas aquí, ya se establecen en handleSelect
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEventoEditando(null);
  };

  const guardarEvento = async () => {
    try {
      const eventoData = {
        title: formData.title,
        start: formData.start,
        end: formData.end,
        allDay: formData.allDay,
        description: formData.description
      };

      if (eventoEditando) {
        // Actualizar evento existente
        await updateDoc(doc(db, "eventos", eventoEditando.id), eventoData);
        setEventos(prev => prev.map(e => 
          e.id === eventoEditando.id ? { ...e, ...eventoData } : e
        ));
      } else {
        // Crear nuevo evento
        const docRef = await addDoc(collection(db, "eventos"), eventoData);
        const nuevoEvento = { id: docRef.id, ...eventoData };
        setEventos(prev => [...prev, nuevoEvento]);
      }
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar evento:", error);
    }
  };

  const confirmarEliminacion = (evento) => {
    setEventoAEliminar(evento);
    setMostrarConfirmacion(true);
  };

  const eliminarEvento = async () => {
    if (!eventoAEliminar) return;
    
    try {
      await deleteDoc(doc(db, "eventos", eventoAEliminar.id));
      setEventos(prev => prev.filter(e => e.id !== eventoAEliminar.id));
      setMostrarConfirmacion(false);
      setEventoAEliminar(null);
      cerrarModal(); // Cerrar modal automáticamente después de eliminar
    } catch (error) {
      console.error("Error al eliminar evento:", error);
    }
  };

  const handleSelect = ({ start, end }) => {
    if (!puedeEditar) return; // No permitir crear eventos si es usuario anónimo
    
    console.log("Fecha seleccionada:", start, end);
    setFormData(prev => ({
      ...prev,
      title: "",
      description: "",
      start: start,
      end: end,
      allDay: false
    }));
    abrirModal();
  };

  const handleSelectEvent = (evento) => {
    abrirModal(evento);
  };

  // Componente para mostrar cuando no hay eventos
  const NoEventsMessage = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📅</div>
      <h3 className="text-xl font-semibold text-amber-800 mb-2">
        No hay eventos programados
      </h3>
      <p className="text-amber-600 mb-6">
        {vista === "agenda" 
          ? "No tienes eventos en esta semana."
          : vista === "week"
            ? "No tienes eventos en esta semana."
            : "No tienes eventos en este mes."
        }
      </p>
      {puedeEditar && (
        <button
          onClick={() => abrirModalNuevo()}
                        className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          + Crear primer evento
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-4 md:mt-8 pb-20">
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-4 md:mb-6 border border-amber-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-900">Calendario</h2>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold border-2 transition-all duration-200 text-sm md:text-base ${
                vista === "week" 
                  ? "bg-amber-200 border-amber-400 text-amber-900 shadow-md" 
                  : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setVista("week")}
            >
              Semana
            </button>
            <button
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold border-2 transition-all duration-200 text-sm md:text-base ${
                vista === "month" 
                  ? "bg-amber-200 border-amber-400 text-amber-900 shadow-md" 
                  : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setVista("month")}
            >
              Mes
            </button>
            <button
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold border-2 transition-all duration-200 text-sm md:text-base ${
                vista === "agenda" 
                  ? "bg-amber-200 border-amber-400 text-amber-900 shadow-md" 
                  : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setVista("agenda")}
            >
              Agenda
            </button>
            {puedeEditar && (
              <button
                onClick={() => abrirModalNuevo()}
                className="bg-amber-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm md:text-base"
              >
                + Nuevo Evento
              </button>
            )}
          </div>
        </div>
        
        {/* Navegación */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4">
          <button
            onClick={irAnterior}
            className="p-2 md:p-3 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg md:text-xl"
            title={vista === "week" ? "Semana anterior" : vista === "month" ? "Mes anterior" : "Semana anterior"}
          >
            ←
          </button>
          
                  <button
          onClick={irHoy}
          className="px-4 md:px-6 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm md:text-base"
        >
            Hoy
          </button>
          
          <button
            onClick={irSiguiente}
            className="p-2 md:p-3 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg md:text-xl"
            title={vista === "week" ? "Semana siguiente" : vista === "month" ? "Mes siguiente" : "Semana siguiente"}
          >
            →
          </button>
        </div>
        
        {/* Título de la fecha actual */}
        <div className="text-center">
          <h3 className="text-lg md:text-xl font-bold text-amber-800">
            {vista === "week" 
              ? `${format(fechaActual, "d 'de' MMMM", { locale: es })} - ${format(addWeeks(fechaActual, 1), "d 'de' MMMM", { locale: es })}`
              : vista === "month"
                ? format(fechaActual, "MMMM 'de' yyyy", { locale: es })
                : format(fechaActual, "d 'de' MMMM", { locale: es })
            }
          </h3>
        </div>
      </div>
      
      {/* Calendario responsive y scrollable en móvil */}
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto w-full pb-20 border border-amber-200">
        <style>
          {Object.entries(calendarStyles).map(([selector, styles]) => 
            `${selector} { ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`).join('; ')} }`
          ).join('\n')}
          
          {`
            @media (max-width: 768px) {
              .rbc-calendar {
                font-size: 12px !important;
              }
              .rbc-header {
                padding: 8px 4px !important;
                font-size: 12px !important;
              }
              .rbc-toolbar {
                padding: 12px !important;
                margin-bottom: 16px !important;
              }
              .rbc-toolbar-label {
                font-size: 18px !important;
              }
              .rbc-event {
                font-size: 10px !important;
                padding: 2px 4px !important;
              }
              .rbc-btn-group button {
                padding: 6px 12px !important;
                font-size: 12px !important;
              }
            }
          `}
        </style>
        <div className="min-w-[800px] sm:min-w-[600px] md:min-w-0">
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            views={["week", "month", "agenda"]}
            view={vista}
            onView={setVista}
            date={fechaActual}
            onNavigate={setFechaActual}
            selectable={puedeEditar}
            onSelectSlot={handleSelect}
            onSelectEvent={handleSelectEvent}
            toolbar={false}
            step={60}
            timeslots={1}
            min={new Date(2024, 0, 1, 6, 0, 0)}
            max={new Date(2024, 0, 1, 22, 0, 0)}
            messages={{
              week: "Semana",
              month: "Mes",
              agenda: "Agenda",
              today: "Hoy",
              previous: "Anterior",
              next: "Siguiente",
              day: "Día",
              showMore: total => `+${total} más`,
              noEventsInRange: "No hay eventos programados en este período.",
              allDay: "Todo el día",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
            }}
            culture="es"
            components={{
              noEventsInRange: NoEventsMessage
            }}
          />
        </div>
      </div>

      {/* Modal para crear/editar eventos */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all border border-amber-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-amber-900">
                {eventoEditando ? "Editar Evento" : "Nuevo Evento"}
              </h3>
              <button
                onClick={cerrarModal}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  placeholder="Título del evento"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  rows="3"
                  placeholder="Descripción (opcional)"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-800 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={format(formData.start, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const nuevaFecha = new Date(e.target.value);
                      const horaInicio = formData.start.getHours();
                      const minutoInicio = formData.start.getMinutes();
                      const horaFin = formData.end.getHours();
                      const minutoFin = formData.end.getMinutes();
                      
                      const nuevoInicio = new Date(nuevaFecha);
                      nuevoInicio.setHours(horaInicio, minutoInicio);
                      
                      const nuevoFin = new Date(nuevaFecha);
                      nuevoFin.setHours(horaFin, minutoFin);
                      
                      setFormData(prev => ({
                        ...prev,
                        start: nuevoInicio,
                        end: nuevoFin
                      }));
                    }}
                    className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-amber-800 mb-2">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={format(formData.start, "HH:mm")}
                      onChange={(e) => {
                        const [horas, minutos] = e.target.value.split(':');
                        const nuevoInicio = new Date(formData.start);
                        nuevoInicio.setHours(parseInt(horas), parseInt(minutos));
                        setFormData(prev => ({ ...prev, start: nuevoInicio }));
                      }}
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      step="900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-amber-800 mb-2">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={format(formData.end, "HH:mm")}
                      onChange={(e) => {
                        const [horas, minutos] = e.target.value.split(':');
                        const nuevoFin = new Date(formData.end);
                        nuevoFin.setHours(parseInt(horas), parseInt(minutos));
                        setFormData(prev => ({ ...prev, end: nuevoFin }));
                      }}
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      step="900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                  className="mr-3 w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="allDay" className="text-sm font-semibold text-amber-800">
                  Todo el día
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {eventoEditando && (
                <button
                  onClick={() => confirmarEliminacion(eventoEditando)}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancelar evento
                </button>
              )}
              <button
                onClick={cerrarModal}
                className="flex-1 px-6 py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEvento}
                className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
              >
                {eventoEditando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && eventoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all border border-amber-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">
                Confirmar cancelación
              </h3>
              <p className="text-amber-700 text-lg">
                ¿Deseas cancelar el evento <strong>"{eventoAEliminar.title}"</strong>?
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setEventoAEliminar(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarEvento}
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

export default Calendario; 