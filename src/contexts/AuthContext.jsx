import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuarioEmail, setUsuarioEmail] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Determinar si el usuario es anónimo
  const esUsuarioAnonimo = usuarioEmail === "usuario_anonimo";
  
  // Determinar si el usuario puede editar
  const puedeEditar = !esUsuarioAnonimo;

  useEffect(() => {
    // Leer email de localStorage
    const email = localStorage.getItem("voluntarioEmail");
    setUsuarioEmail(email);
    setCargando(false);
  }, []);

  const login = (email) => {
    setUsuarioEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("voluntarioEmail");
    setUsuarioEmail(null);
  };

  const value = {
    usuarioEmail,
    esUsuarioAnonimo,
    puedeEditar,
    cargando,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 