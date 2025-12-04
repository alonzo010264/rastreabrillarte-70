import { Diamond, Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import brillarteLogoFooter from "@/assets/brillarte-logo-footer-optimized.webp";
const Footer = () => {
  return <footer className="bg-black text-white py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img src={brillarteLogoFooter} alt="BRILLARTE" width="64" height="64" className="h-16 w-auto" />
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">El Arte de Brillar. Productos únicos de calidad que reflejan tu personalidad. Pulseras, aretes, monederos y accesorios exclusivos para hacer brillar tu estilo.</p>
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
                <Link to="/comunidad" className="text-gray-300 hover:text-white transition-colors">
                  Comunidad
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
            </ul>
          </div>

          {/* Newsletter y Contacto */}
          <div>
            <h3 className="text-white font-medium mb-4">Suscríbete</h3>
            <p className="text-gray-300 text-sm mb-3">
              Recibe ofertas exclusivas y novedades
            </p>
            <form onSubmit={async e => {
            e.preventDefault();
            const form = e.currentTarget;
            const email = (form.elements.namedItem('newsletter-email') as HTMLInputElement).value;
            try {
              const {
                supabase
              } = await import("@/integrations/supabase/client");
              await supabase.functions.invoke('send-newsletter-subscription', {
                body: {
                  correo: email
                }
              });
              const {
                useToast
              } = await import("@/hooks/use-toast");
              const {
                toast
              } = useToast();
              toast({
                title: "¡Suscrito exitosamente!",
                description: "Revisa tu correo para confirmar."
              });
              form.reset();
            } catch (error) {
              console.error('Error:', error);
            }
          }} className="space-y-2 mb-4">
              <input type="email" name="newsletter-email" placeholder="tu@email.com" required className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-white/40" />
              <button type="submit" className="w-full px-3 py-2 bg-white text-black rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                Suscribirse
              </button>
            </form>
            
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
                <span>Santiago de los Caballeros, RD</span>
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
    </footer>;
};
export default Footer;