import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaPinterest } from "react-icons/fa";
import { Link } from "react-router-dom";
import brillarteLogoWhite from "@/assets/brillarte-logo-white.png";

const Footer = () => {
  const enlacesRapidos = [
    { to: "/", label: "Inicio" },
    { to: "/productos", label: "Colecciones" },
    { to: "/productos", label: "Tienda" },
    { to: "/rastrear", label: "Rastrear tu pedido" },
    { to: "/nosotros", label: "Sobre nosotros" },
    { to: "/contacto", label: "Contacto" },
    { to: "/faq", label: "Preguntas frecuentes" },
  ];

  const colecciones = [
    { to: "/productos?cat=clasica", label: "Clásica" },
    { to: "/productos?cat=premium", label: "Premium" },
    { to: "/productos?cat=black-silver", label: "Black & Silver" },
    { to: "/productos?cat=signature", label: "Signature" },
    { to: "/productos?cat=ediciones", label: "Ediciones limitadas" },
    { to: "/productos", label: "Todos los productos" },
  ];

  const ayuda = [
    { to: "/politicas-envio", label: "Envíos y entregas" },
    { to: "/politicas-reembolso", label: "Cambios y devoluciones" },
    { to: "/terminos-condiciones", label: "Términos y condiciones" },
    { to: "/politicas-privacidad", label: "Política de privacidad" },
    { to: "/guia-codigos-pago", label: "Métodos de pago" },
  ];

  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img src={brillarteLogoWhite} alt="Brillarte" className="h-14 w-auto object-contain" />
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              Diseñamos pulseras que expresan quién eres. Estilo, calidad y propósito en cada detalle.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaInstagram, href: "https://www.instagram.com/brillarte.do/" },
                { icon: FaFacebookF, href: "#" },
                { icon: FaTiktok, href: "#" },
                { icon: FaYoutube, href: "#" },
                { icon: FaPinterest, href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-white hover:text-neutral-900 hover:border-white transition-all"
                >
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-[11px] tracking-[0.3em] text-white mb-6">ENLACES RÁPIDOS</h3>
            <ul className="space-y-3 text-sm">
              {enlacesRapidos.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-neutral-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colecciones */}
          <div>
            <h3 className="text-[11px] tracking-[0.3em] text-white mb-6">COLECCIONES</h3>
            <ul className="space-y-3 text-sm">
              {colecciones.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-neutral-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-[11px] tracking-[0.3em] text-white mb-6">AYUDA</h3>
            <ul className="space-y-3 text-sm">
              {ayuda.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-neutral-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Brillarte. Todos los derechos reservados.</p>
          <p className="text-xs text-neutral-500 tracking-widest">VISA · MASTERCARD · PAYPAL</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
