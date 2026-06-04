import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Link } from "react-router-dom";
import { ArrowRight, Gem, Droplet, Shield, Gift, Truck, Lock, RefreshCw, Headphones } from "lucide-react";
import heroBracelet from "@/assets/hero-aretes-flores.png";
import whyUsBracelets from "@/assets/why-us-bracelets.jpg";
import newsletterBox from "@/assets/pulseras-mariposa.png";
import pulseraClasica from "@/assets/productos/pulseras-corazones.jpg";
import pulseraPremium from "@/assets/productos/pulseras-brillantes-elegantes.png";
import pulseraBlack from "@/assets/productos/pulsera-turquesa.jpg";
import pulseraSignature from "@/assets/productos/pulsera-girasol-dorada.png";

const Home = () => {
  const features = [
    { icon: Gem, title: "MATERIALES PREMIUM", desc: "Seleccionamos solo lo mejor para piezas que duran." },
    { icon: Droplet, title: "DISEÑOS EXCLUSIVOS", desc: "Cada pulsera es única, como tú." },
    { icon: Shield, title: "RESISTENTES AL AGUA", desc: "Diseñadas para tu día a día, sin límites." },
    { icon: Gift, title: "PRESENTACIÓN PERFECTA", desc: "Cada pedido llega en un empaque que impresiona." },
  ];

  const colecciones = [
    { img: pulseraClasica, title: "CLÁSICA", to: "/productos" },
    { img: pulseraPremium, title: "PREMIUM", to: "/productos" },
    { img: pulseraBlack, title: "BLACK & SILVER", to: "/productos" },
    { img: pulseraSignature, title: "SIGNATURE", to: "/productos" },
  ];

  const trust = [
    { icon: Gift, title: "ENVÍOS GRATIS", desc: "En compras mayores a $999" },
    { icon: Lock, title: "PAGA SEGURO", desc: "Tarjetas, PayPal, OXXO y más" },
    { icon: Shield, title: "COMPRA CON CONFIANZA", desc: "Garantía de satisfacción total" },
  ];

  const utilities = [
    { icon: Truck, title: "ENVÍOS RÁPIDOS", desc: "2 a 5 días hábiles" },
    { icon: RefreshCw, title: "RASTREA TU PEDIDO", desc: "En todo momento" },
    { icon: Lock, title: "PAGOS 100% SEGUROS", desc: "Tu información protegida" },
    { icon: Gift, title: "CAMBIOS FÁCILES", desc: "Hasta 30 días" },
    { icon: Headphones, title: "ATENCIÓN AL CLIENTE", desc: "Estamos para ayudarte" },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navigation />

      {/* HERO */}
      <section className="relative bg-white overflow-hidden">
        <div className="container mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-neutral-900">
              BRILLA<br />CON ARTE
            </h1>
            <div className="text-neutral-600 text-base leading-relaxed max-w-md space-y-1">
              <p>Pulseras que cuentan historias.</p>
              <p>Diseñadas para destacar.</p>
              <p>Hechas para durar.</p>
            </div>
            <Link
              to="/productos"
              className="inline-flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 text-[11px] tracking-[0.3em] font-medium hover:bg-neutral-800 transition-colors"
            >
              DESCUBRIR COLECCIONES
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="grid grid-cols-3 gap-6 pt-8 max-w-md">
              <div className="space-y-1">
                <p className="text-[11px] tracking-[0.2em] text-neutral-900 font-semibold">+10K</p>
                <p className="text-[10px] tracking-[0.15em] text-neutral-500">CLIENTES FELICES</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] tracking-[0.2em] text-neutral-900 font-semibold">CALIDAD</p>
                <p className="text-[10px] tracking-[0.15em] text-neutral-500">PREMIUM</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] tracking-[0.2em] text-neutral-900 font-semibold">GARANTÍA</p>
                <p className="text-[10px] tracking-[0.15em] text-neutral-500">DE POR VIDA</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroBracelet}
              alt="Pulsera Brillarte"
              width={1280}
              height={1024}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <section className="bg-neutral-950 text-white py-16">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {features.map((f, i) => (
            <div key={i} className="text-center space-y-3">
              <f.icon className="w-7 h-7 mx-auto text-white" strokeWidth={1.2} />
              <h3 className="text-[11px] tracking-[0.25em] font-medium">{f.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-[180px] mx-auto">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-5xl md:text-6xl leading-tight mb-12">
              ¿POR QUÉ<br />ELEGIRNOS?
            </h2>
            <div className="space-y-8">
              {[
                { title: "EXCELENTE CALIDAD", desc: "Usamos piedras naturales y acero inoxidable de la más alta calidad." },
                { title: "DISEÑOS CON PROPÓSITO", desc: "Más que accesorios, símbolos de fuerza, confianza y estilo." },
                { title: "ATENCIÓN PERSONALIZADA", desc: "Estamos aquí para ayudarte antes, durante y después de tu compra." },
                { title: "MILES DE CLIENTES SATISFECHOS", desc: "Únete a nuestra comunidad que no para de crecer." },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center flex-shrink-0">
                    <Gem className="w-4 h-4 text-neutral-700" strokeWidth={1.3} />
                  </div>
                  <div>
                    <h4 className="text-sm tracking-[0.15em] font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-neutral-600 leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-neutral-950 p-2">
            <img src={whyUsBracelets} alt="Pulseras premium" loading="lazy" width={1024} height={1024} className="w-full h-auto" />
            <div className="absolute inset-0 flex items-end p-10">
              <div className="text-white max-w-xs">
                <p className="font-display text-2xl leading-snug mb-3 italic">
                  "No es solo una pulsera,<br />es una parte de ti."
                </p>
                <p className="text-xs tracking-[0.2em] text-neutral-300">— BRILLARTE</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-lg">★★★★★ <span className="text-sm align-middle ml-2">4.9/5</span></p>
                  <p className="text-xs text-neutral-400 mt-1">Basado en +2,500 reseñas verificadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLECCIONES DESTACADAS */}
      <section className="bg-white py-24 border-t border-neutral-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl mb-3">COLECCIONES DESTACADAS</h2>
            <p className="text-sm text-neutral-500">Encuentra la pulsera que va contigo.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {colecciones.map((c, i) => (
              <Link key={i} to={c.to} className="group block">
                <div className="aspect-square bg-neutral-100 overflow-hidden mb-4">
                  <img src={c.img} alt={c.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="text-center text-[11px] tracking-[0.3em] font-medium mb-2">{c.title}</h3>
                <p className="text-center text-xs text-neutral-500 group-hover:text-neutral-900 transition-colors">
                  Descubre más →
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              to="/productos"
              className="inline-flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 text-[11px] tracking-[0.3em] font-medium hover:bg-neutral-800 transition-colors"
            >
              VER TODAS LAS COLECCIONES
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="bg-neutral-950 text-white py-12">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {trust.map((t, i) => (
            <div key={i} className="flex items-center justify-center gap-4 py-3 md:py-0">
              <t.icon className="w-6 h-6" strokeWidth={1.2} />
              <div>
                <p className="text-[11px] tracking-[0.25em] font-semibold">{t.title}</p>
                <p className="text-xs text-neutral-400">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src={newsletterBox} alt="Caja Brillarte" loading="lazy" width={1024} height={800} className="w-full h-auto" />
          </div>
          <div className="space-y-6 max-w-md">
            <h2 className="font-display text-4xl md:text-5xl">ÚNETE A BRILLARTE</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Recibe ofertas exclusivas, lanzamientos y mucho más.
            </p>
            <div className="newsletter-editorial">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      {/* UTILITIES STRIP */}
      <section className="bg-white border-t border-neutral-200 py-8">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-6">
          {utilities.map((u, i) => (
            <div key={i} className="flex items-center gap-3">
              <u.icon className="w-6 h-6 text-neutral-700" strokeWidth={1.2} />
              <div>
                <p className="text-[10px] tracking-[0.25em] font-semibold text-neutral-900">{u.title}</p>
                <p className="text-[11px] text-neutral-500">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
