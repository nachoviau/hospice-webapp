import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Huespedes from "./pages/Huespedes";
import Calendario from "./pages/Calendario";
import Tareas from "./pages/Tareas";
import Partes from "./pages/Partes";
import DetalleHuesped from "./pages/DetalleHuesped";
import HistorialHuespedes from "./pages/HistorialHuespedes";

function AppContent() {
  const { usuarioEmail, cargando, login } = useAuth();

  if (cargando) return <p className="text-amber-700 text-center mt-8">Preparando el sistema...</p>;

  if (!usuarioEmail) {
    return <Login onLogin={login} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/huespedes" replace />} />
        <Route path="huespedes" element={<Huespedes />} />
        <Route path="huespedes/:id" element={<DetalleHuesped />} />
        <Route path="huespedes/historial" element={<HistorialHuespedes />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="tareas" element={<Tareas />} />
        <Route path="partes" element={<Partes />} />
        <Route path="*" element={<Navigate to="/huespedes" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;