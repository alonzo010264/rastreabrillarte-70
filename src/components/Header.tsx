
import { Diamond } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white py-12 px-4 border-b border-gray-100">
      <div className="container mx-auto text-center">
        <div className="flex items-center justify-center mb-6 animate-scale-in">
          <img 
            src="/lovable-uploads/9fddbd33-95e9-4a29-af18-6d93693beabb.png" 
            alt="BRILLARTE Logo" 
            className="h-16 w-auto transition-transform duration-300 hover:scale-110"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-3 animate-fade-in">
          Brillarte
        </h1>
        <p className="text-gray-500 text-lg font-light animate-fade-in animation-delay-200">
          Seguimiento de Pedidos
        </p>
      </div>
    </header>
  );
};

export default Header;
