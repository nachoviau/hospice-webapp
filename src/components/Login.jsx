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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-green-300 to-yellow-200 px-4">
      <PWAInstallBanner />
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img src="/logo-hospice.png" alt="Hospice San Camilo" className="mx-auto mb-4 w-28 h-28 object-contain rounded-xl shadow" />
          <h1 className="text-4xl font-bold text-green-800 mb-2 drop-shadow-lg">San Camilo</h1>
          <p className="text-green-700 text-lg font-medium">Sistema de gestión hospitalaria</p>
        </div>
        <div className="bg-orange-50 rounded-3xl shadow-lg p-10 border border-orange-200">
          <h2 className="text-3xl font-bold text-green-800 text-center mb-8">Iniciar Sesión</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl text-center font-medium">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-green-800 font-semibold mb-3 text-lg">Correo electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg bg-white shadow-sm"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <p className="text-base text-green-700 mt-2 font-semibold">Solo usamos su correo para registrarlos y enviarles los partes diarios.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-lg shadow-lg hover:shadow-xl border-2 border-green-900 select-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" />
                  <span>Ingresar</span>
                </>
              )}
            </button>
          </form>
          
          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-orange-200"></div>
            <span className="px-4 text-green-500 text-sm font-medium">o</span>
            <div className="flex-1 border-t border-orange-200"></div>
          </div>
          
          {/* Botón para ingresar como usuario */}
          <button
            onClick={handleGuestLogin}
            className="w-full bg-purple-100 text-purple-700 py-4 px-6 rounded-xl font-bold hover:bg-purple-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-2 border-2 border-purple-300 select-none"
          >
            <FiUser className="w-5 h-5" /> Ingresar como usuario
          </button>
          <p className="text-center text-purple-600 text-sm font-medium">
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
          <p className="text-green-600 text-sm font-medium">
            © 2024 San Camilo. Sistema de gestión para cuidados paliativos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;