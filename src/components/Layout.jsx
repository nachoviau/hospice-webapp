// src/components/Layout.jsx
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { FiUsers, FiCalendar, FiFileText, FiLogOut, FiCheckSquare } from "react-icons/fi";
import ReadOnlyIndicator from "./ReadOnlyIndicator";
import UpdateNotification from "./UpdateNotification";

const navItems = [
  { to: "/huespedes", label: "Húspedes", icon: <FiUsers className="inline text-2xl" /> },
  // TEMPORAL: Ocultado para presentación - Descomentar para volver a mostrar
  // { to: "/calendario", label: "Calendario", icon: <FiCalendar className="inline text-2xl" /> },
  // { to: "/tareas", label: "Tareas", icon: <FiCheckSquare className="inline text-2xl" /> },
  { to: "/partes", label: "Partes diarios", icon: <FiFileText className="inline text-2xl" /> },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("voluntarioEmail");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-[#fbead1] md:bg-[#f2e8d9] font-sans">
      {/* Indicador de modo solo lectura */}
      <ReadOnlyIndicator />
      <UpdateNotification />
      
      {/* Sidebar solo en desktop */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-[#f7ecd7] flex-col py-8 px-6 shadow-md rounded-tr-3xl rounded-br-3xl h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-[#6d4c1b] tracking-tight select-none text-center mb-4">
            San Camilo
          </h1>
          <hr className="border-[#e0d1bd]" />
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-3 rounded-xl transition-all text-base font-medium 
                  ${isActive
                    ? 'bg-[#e9decf] text-[#6d4c1b] shadow-inner'
                    : 'text-[#6d4c1b] hover:bg-[#f3e6d2]'}
                `}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#6d4c1b] hover:bg-[#f3e6d2] transition-colors mt-4"
        >
          <FiLogOut className="text-xl" /> Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-[#fbead1] md:bg-[#f2e8d9] min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Barra de navegación abajo solo en móvil */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-white border-t md:hidden z-50 h-16 shadow">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors 
                ${isActive ? 'text-amber-700' : 'text-amber-500 hover:text-amber-700'}`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        {/* Botón de logout en móvil */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium text-amber-500 hover:text-amber-700"
        >
          <FiLogOut className="text-2xl" />
          <span className="text-xs mt-1">Salir</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
