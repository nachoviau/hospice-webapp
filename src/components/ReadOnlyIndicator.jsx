import { useAuth } from "../contexts/AuthContext";
import { FiEye } from "react-icons/fi";

const ReadOnlyIndicator = () => {
  const { esUsuarioAnonimo } = useAuth();

  if (!esUsuarioAnonimo) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <FiEye className="w-4 h-4" />
      <span className="text-sm font-semibold">Modo solo lectura</span>
    </div>
  );
};

export default ReadOnlyIndicator; 