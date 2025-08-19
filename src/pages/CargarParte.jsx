import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiCamera, FiImage, FiX } from "react-icons/fi";

const TURNOS = [
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
];

// Sanea segmentos para rutas de Storage: sin acentos, solo ascii seguro
const sanitizePathSegment = (segment) => {
  return segment
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos
    .replace(/[^a-zA-Z0-9_\-]/g, "-") // reemplazar otros por guión
    .toLowerCase();
};

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imagenes, setImagenes] = useState([]);
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
          const imagenesExistentes = data.turnos?.[turno]?.imagenes || [];
          setTexto(parte);
          
          // Convertir imágenes existentes al formato local
          const imagenesConvertidas = imagenesExistentes.map((img, index) => ({
            id: `existing_${index}`,
            preview: img.url,
            name: img.name,
            isExisting: true,
            url: img.url
          }));
          setImagenes(imagenesConvertidas);
        } else {
          setTexto("");
          setImagenes([]);
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
      // Subir imágenes a Firebase Storage
      const imagenesUrls = [];
      if (imagenes.length > 0) {
        for (const imagen of imagenes) {
          if (imagen.isExisting) {
            // Mantener imágenes existentes
            imagenesUrls.push({
              url: imagen.url,
              name: imagen.name,
              uploadedAt: imagen.uploadedAt || new Date()
            });
          } else {
            // Subir nuevas imágenes
            try {
              const timestamp = Date.now();
              const safeTurno = sanitizePathSegment(turno);
              const fileName = `partes/${fecha}/${safeTurno}/${timestamp}_${imagen.name}`;
              const storageRef = ref(storage, fileName);
              
              const snapshot = await uploadBytes(storageRef, imagen.file);
              const downloadURL = await getDownloadURL(snapshot.ref);
              
              imagenesUrls.push({
                url: downloadURL,
                name: imagen.name,
                uploadedAt: new Date()
              });
            } catch (uploadError) {
              throw new Error(`Error subiendo imagen ${imagen.name}: ${uploadError.message}`);
            }
          }
        }
      }

      const docRef = doc(db, "partesDiarios", fecha);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        await updateDoc(docRef, {
          [`turnos.${turno}.texto`]: texto,
          [`turnos.${turno}.imagenes`]: imagenesUrls,
          [`turnos.${turno}.fechaActualizacion`]: new Date(),
        });
      } else {
        await setDoc(docRef, {
          fecha,
          turnos: {
            [turno]: { 
              texto, 
              imagenes: imagenesUrls,
              fechaCreacion: new Date()
            },
          },
        });
      }
      
      setMensaje("¡Parte guardado con éxito!");
      setImagenes([]); // Limpiar imágenes después de guardar
      
      // Cerrar inmediatamente después del guardado exitoso
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError("No se pudo guardar el parte: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarClick = () => {
    if (!texto.trim()) {
      setError("El parte no puede estar vacío.");
      return;
    }
    setConfirmOpen(true);
  };

  const cancelarConfirmacion = () => setConfirmOpen(false);
  const confirmarGuardado = () => {
    setConfirmOpen(false);
    guardarParte();
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name
          };
          setImagenes(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Limpiar el input
    event.target.value = '';
  };

  const removeImage = (imageId) => {
    setImagenes(prev => prev.filter(img => img.id !== imageId));
  };

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera
    input.onchange = handleImageUpload;
    input.click();
  };

  const openGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handleImageUpload;
    input.click();
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
          
          {/* Sección de imágenes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-green-800 font-semibold text-lg">Imágenes (opcional):</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium select-none"
                >
                  <FiCamera className="w-4 h-4" />
                  Cámara
                </button>
                <button
                  type="button"
                  onClick={openGallery}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium select-none"
                >
                  <FiImage className="w-4 h-4" />
                  Galería
                </button>
              </div>
            </div>
            
            {/* Preview de imágenes */}
            {imagenes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagenes.map((imagen) => (
                  <div key={imagen.id} className="relative group">
                    <img
                      src={imagen.preview}
                      alt={imagen.name}
                      className="w-full h-32 object-cover rounded-lg border border-orange-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(imagen.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-green-600 mt-1 truncate">{imagen.name}</p>
                  </div>
                ))}
              </div>
            )}
            
            {imagenes.length > 0 && (
              <p className="text-sm text-green-600 font-medium">
                {imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''} seleccionada{imagenes.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleGuardarClick}
            className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed border-2 border-green-900 select-none"
            disabled={guardando}
            aria-label="Guardar parte"
          >
            {guardando ? "Guardando..." : "Guardar parte"}
          </button>

          {/* Modal de confirmación */}
          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-amber-200 animate-fadeIn max-h-[90vh] overflow-y-auto overscroll-contain">
                <h3 className="text-xl font-bold text-amber-900 mb-4">Confirmar guardado</h3>
                <div className="text-amber-800 mb-6">
                  <p>Estás guardando el parte del día <span className="font-semibold">{fecha}</span> para el turno <span className="font-semibold">{turno}</span>.</p>
                  {imagenes.length > 0 && (
                    <p className="mt-2 text-sm">
                      Incluye <span className="font-semibold">{imagenes.length}</span> imagen{imagenes.length !== 1 ? 'es' : ''}.
                    </p>
                  )}
                  <p className="mt-2">¿Estás de acuerdo?</p>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={cancelarConfirmacion}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-semibold select-none"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarGuardado}
                    className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg border-2 border-purple-700 select-none"
                  >
                    De acuerdo
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CargarParte; 