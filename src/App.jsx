import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Huespedes from "./pages/Huespedes";
import Calendario from "./pages/Calendario";
import Tareas from "./pages/Tareas";
import Partes from "./pages/Partes";
import DetalleHuesped from "./pages/DetalleHuesped";

function App() {
  const [usuarioEmail, setUsuarioEmail] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Leer email de localStorage
    const email = localStorage.getItem("voluntarioEmail");
    setUsuarioEmail(email);
    setCargando(false);
  }, []);

  if (cargando) return <p>Cargando...</p>;

  if (!usuarioEmail) {
    return <Login onLogin={(email) => setUsuarioEmail(email)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/huespedes" replace />} />
        <Route path="huespedes" element={<Huespedes />} />
        <Route path="huespedes/:id" element={<DetalleHuesped />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="tareas" element={<Tareas />} />
        <Route path="partes" element={<Partes />} />
        <Route path="*" element={<Navigate to="/huespedes" replace />} />
      </Route>
    </Routes>
  );
}

export default App;