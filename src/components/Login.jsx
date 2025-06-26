// src/components/Login.jsx
import { useState } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FiMail, FiLogIn } from "react-icons/fi";

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
      setError("Error al registrar el correo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
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