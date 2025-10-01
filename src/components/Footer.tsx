
import { Diamond, Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <Diamond className="text-white mr-2" size={20} />
              <span className="font-light text-xl text-white">BRILLARTE</span>
              <Diamond className="text-white ml-2" size={20} />
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              El Arte de Brillar. Productos únicos de calidad que reflejan tu personalidad. 
              Pulseras, aretes, monederos y accesorios exclusivos para hacer brillar tu estilo.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-white font-medium mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="text-gray-300 hover:text-white transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/rastrear" className="text-gray-300 hover:text-white transition-colors">
                  Rastrear Pedidos
                </Link>
              </li>
              <li>
                <Link to="/politicas-privacidad" className="text-gray-300 hover:text-white transition-colors">
                  Políticas de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/politicas-envio" className="text-gray-300 hover:text-white transition-colors">
                  Políticas de Envío
                </Link>
              </li>
              <li>
                <Link to="/cancel-notifications" className="text-gray-300 hover:text-white transition-colors">
                  Cancelar Notificaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-white font-medium mb-4">Contacto</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <Mail size={16} className="mr-2" />
                <span>brillarte.oficial.ventas@gmail.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone size={16} className="mr-2" />
                <span>849-425-2220</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin size={16} className="mr-2" />
                <span>Santiago de los Caballeros, República Dominicana</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-400 text-xs flex items-center justify-center mb-2">
            Hecho con <Heart className="text-red-400 mx-1" size={12} /> para nuestros clientes
          </p>
          <p className="text-gray-400 text-xs">
            © 2024 BRILLARTE. Todos los derechos reservados. Productos únicos de calidad.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
