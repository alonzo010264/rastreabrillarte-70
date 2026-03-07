import { FaInstagram, FaFacebookF, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16 mt-12 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-20 right-20 text-primary/20 w-8 h-8 animate-float" />
        <Sparkles className="absolute bottom-20 left-20 text-primary/20 w-6 h-6 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo y descripción */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center group">
              <img 
                alt="BRILLARTE" 
                width="64" 
                height="64" 
                src="/lovable-uploads/108965a0-1419-4718-a2a0-1aa29864b805.jpg" 
                className="h-16 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" 
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              El Arte de Brillar. Productos únicos de calidad que reflejan tu personalidad. 
              Pulseras, aretes, monederos y accesorios exclusivos para hacer brillar tu estilo.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/brillarte.do/" target="_blank" rel="noopener noreferrer" className="group p-3 rounded-xl bg-white/5 hover:bg-primary/20 transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <FaInstagram size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-white/5 hover:bg-primary/20 transition-all duration-300 hover:scale-110 hover:-translate-y-1" style={{ transitionDelay: '50ms' }}>
                <FaFacebookF size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-white/5 hover:bg-primary/20 transition-all duration-300 hover:scale-110 hover:-translate-y-1" style={{ transitionDelay: '100ms' }}>
                <FaTwitter size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-primary rounded-full" />
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/", label: "Inicio", external: false },
                { to: "/nosotros", label: "Nosotros", external: false },
                { to: "/productos", label: "Tienda", external: false },
                { to: "https://pedidos.brillarte.lat/", label: "Pedir pulsera", external: true },
                { to: "/comunidad", label: "Comunidad", external: false },
                { to: "/eventos", label: "Eventos", external: false },
                { to: "/referidos", label: "Programa de Referidos", external: false },
                { to: "/emprende-brillarte", label: "Emprende Brillarte", external: false },
                { to: "/regalos", label: "Regalos Brillarte", external: false },
                { to: "/rastrear", label: "Rastrear Pedidos", external: false },
                { to: "/politicas-privacidad", label: "Politicas de Privacidad", external: false },
                { to: "/politicas-envio", label: "Politicas de Envio", external: false },
                { to: "/politicas-reembolso", label: "Politicas de Reembolso", external: false },
              ].map((link, index) => (
                <li key={link.to}>
                  {link.external ? (
                    <a 
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center gap-2 group"
                      style={{ transitionDelay: `${index * 30}ms` }}
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 rounded-full" />
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      to={link.to} 
                      className="text-gray-400 hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center gap-2 group"
                      style={{ transitionDelay: `${index * 30}ms` }}
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 rounded-full" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter y Contacto */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-primary rounded-full" />
              Suscríbete
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Recibe ofertas exclusivas y novedades
            </p>
            <NewsletterForm />
            
            <div className="space-y-3 text-sm">
              {[
                { icon: FaEnvelope, text: "brillarte.oficial.ventas@gmail.com" },
                { icon: FaPhone, text: "849-425-2220" },
                { icon: FaMapMarkerAlt, text: "Santiago de los Caballeros, RD" },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center text-gray-400 hover:text-primary transition-all duration-300 group cursor-pointer"
                >
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-gray-500 text-xs flex items-center justify-center mb-3 group">
            Hecho con 
            <FaHeart className="text-primary mx-2 group-hover:scale-125 transition-transform animate-pulse" size={12} /> 
            para nuestros clientes
          </p>
          <p className="text-gray-500 text-xs">
            © 2024 BRILLARTE. Todos los derechos reservados. Productos únicos de calidad.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;