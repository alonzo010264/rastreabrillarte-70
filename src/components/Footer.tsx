
import { Diamond, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <Diamond className="text-gray-400 mr-2" size={16} />
          <span className="font-light text-gray-600">BRILLARTE</span>
          <Diamond className="text-gray-400 ml-2" size={16} />
        </div>
        
        <p className="text-gray-500 mb-2 text-sm">El Arte de Brillar</p>
        <p className="text-gray-400 text-xs flex items-center justify-center">
          Hecho con <Heart className="text-red-400 mx-1" size={12} /> para nuestros clientes
        </p>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs">
            © 2024 BRILLARTE. Productos hechos a mano y convencionales.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
