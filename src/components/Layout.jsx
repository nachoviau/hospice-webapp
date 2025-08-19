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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 font-sans">
      {/* Indicador de modo solo lectura */}
      <ReadOnlyIndicator />
      <UpdateNotification />
      
      {/* Sidebar solo en desktop */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-green-700 flex-col py-8 px-6 shadow-xl rounded-tr-3xl rounded-br-3xl h-screen border-r-4 border-green-900">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-white tracking-tight select-none text-center mb-4 drop-shadow-lg">
            San Camilo
          </h1>
          <hr className="border-green-400" />
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
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'text-green-100 hover:bg-green-600 hover:text-white'}
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-green-100 hover:bg-green-600 hover:text-white transition-all duration-200 mt-4 border border-green-400"
        >
          <FiLogOut className="text-xl" /> Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-2 md:p-6 bg-gradient-to-br from-slate-100 via-stone-50 to-gray-100 min-h-screen pb-16 md:pb-0">
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
              className={`flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-all duration-200 
                ${isActive ? 'text-purple-700 bg-purple-50 scale-110 font-semibold' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'}`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        {/* Botón de logout en móvil */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200"
        >
          <FiLogOut className="text-2xl" />
          <span className="text-xs mt-1">Salir</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
