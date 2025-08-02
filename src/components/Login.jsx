// src/components/Login.jsx
import { useState } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FiMail, FiLogIn, FiUser } from "react-icons/fi";
import PWAInstallBanner from "./PWAInstallBanner";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Validar email simple
      if (!email.match(/^\S+@\S+\.\S+$/)) {
        setError("Por favor ingresa un correo válido.");
        setLoading(false);
        return;
      }
      // Buscar si ya existe
      const q = query(collection(db, "voluntarios"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // No existe, lo agrego
        await addDoc(collection(db, "voluntarios"), { email });
      }
      // Guardar en localStorage
      localStorage.setItem("voluntarioEmail", email);
      onLogin(email);
    } catch (err) {
      setError("No se pudo registrar el correo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Ingresar como usuario sin registrar email
    localStorage.setItem("voluntarioEmail", "usuario_anonimo");
    onLogin("usuario_anonimo");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <PWAInstallBanner />
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img src="/logo-hospice.png" alt="Hospice San Camilo" className="mx-auto mb-4 w-28 h-28 object-contain rounded-xl shadow" />
          <h1 className="text-4xl font-bold text-amber-900 mb-2">San Camilo</h1>
          <p className="text-amber-700 text-lg">Sistema de Gestión</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-amber-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Ingresar</h2>
            <p className="text-amber-600">Ingresa tu correo para continuar</p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-700 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-bold text-amber-800 mb-2">Correo electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all text-lg"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <p className="text-base text-amber-700 mt-2 font-semibold">Solo usamos su correo para registrarlos y enviarles los partes diarios.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" /> Ingresar
                </>
              )}
            </button>
          </form>
          
          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-amber-200"></div>
            <span className="px-4 text-amber-500 text-sm font-medium">o</span>
            <div className="flex-1 border-t border-amber-200"></div>
          </div>
          
          {/* Botón para ingresar como usuario */}
          <button
            onClick={handleGuestLogin}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-gray-200"
          >
            <FiUser className="w-5 h-5" /> Ingresar como usuario
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">
            Acceso sin registro de correo
          </p>
          
          {/* Botón de prueba PWA - solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                localStorage.removeItem('pwaBannerDismissed');
                window.location.reload();
              }}
              className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm"
            >
              🔄 Reset PWA Banner (Debug)
            </button>
          )}
        </div>
        <div className="text-center mt-8">
          <p className="text-amber-600 text-sm">
            © 2024 San Camilo. Sistema de gestión para cuidados paliativos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;