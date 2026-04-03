import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import margarita from "@/assets/productos/margarita.jpg";
import aretes from "@/assets/productos/aretes-flores.webp";
import pulseras from "@/assets/productos/pulseras-mariposas.webp";
import floresCrochetRojas from "@/assets/productos/flores-crochet-rojas-optimized.webp";
import bouquetCrochetColores from "@/assets/productos/bouquet-crochet-optimized.webp";
import aretesMargaritas from "@/assets/productos/aretes-margaritas-optimized.webp";
import anilloFloresAzul from "@/assets/productos/anillo-flores-azul.jpg";
import pulserasCorazones from "@/assets/productos/pulseras-corazones.jpg";
import pulserasLoveYou from "@/assets/productos/pulseras-love-you.jpg";
import floresCrochet from "@/assets/productos/flores-crochet.jfif";
import pulserasCristal from "@/assets/productos/pulseras-cristal-colores.png";
import pulserasBrillantes from "@/assets/productos/pulseras-brillantes-elegantes.png";
import pulseraGirasol from "@/assets/productos/pulsera-girasol-dorada.png";
import pulseraMacrame from "@/assets/productos/pulsera-macrame-girasoles.png";
import pulserasTrebol from "@/assets/productos/pulseras-trebol-tejidas.png";
import pulserasPareja from "@/assets/productos/pulseras-pareja-amistad.png";
import pulserasIniciales from "@/assets/productos/pulseras-iniciales-personalizadas.png";
import pulserasCorazonesColores from "@/assets/productos/pulseras-corazones-colores.png";

const products = [
  { id: 1, name: "Pulsera Margarita", image: margarita, description: "Elegante pulsera de perlas con diseño floral", color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: 2, name: "Aretes de Flores", image: aretes, description: "Hermoso set de aretes con flores coloridas", color: "bg-pink-100 dark:bg-pink-900/30" },
  { id: 3, name: "Pulseras Mariposas", image: pulseras, description: "Colección de pulseras tejidas con mariposas", color: "bg-blue-100 dark:bg-blue-900/30" },
  { id: 4, name: "Flores Crochet Rojas", image: floresCrochetRojas, description: "Flores tejidas a crochet en rojo intenso", color: "bg-red-100 dark:bg-red-900/30" },
  { id: 5, name: "Bouquet Crochet", image: bouquetCrochetColores, description: "Ramo de flores multicolor tejido a mano", color: "bg-green-100 dark:bg-green-900/30" },
  { id: 6, name: "Aretes Margaritas", image: aretesMargaritas, description: "Aretes de margaritas en colores vibrantes", color: "bg-orange-100 dark:bg-orange-900/30" },
  { id: 7, name: "Anillo Flores Azul", image: anilloFloresAzul, description: "Delicado anillo de flores en tonos azules", color: "bg-sky-100 dark:bg-sky-900/30" },
  { id: 8, name: "Pulseras Corazones", image: pulserasCorazones, description: "Pulseras con corazones en colores pastel", color: "bg-rose-100 dark:bg-rose-900/30" },
  { id: 9, name: "Pulseras Love You", image: pulserasLoveYou, description: "Pulseras personalizadas con mensajes de amor", color: "bg-purple-100 dark:bg-purple-900/30" },
  { id: 10, name: "Flores Crochet Bouquet", image: floresCrochet, description: "Bouquet artesanal de flores tejidas", color: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: 11, name: "Pulseras Cristal", image: pulserasCristal, description: "Set de pulseras de cristal multicolor", color: "bg-violet-100 dark:bg-violet-900/30" },
  { id: 12, name: "Pulseras Brillantes", image: pulserasBrillantes, description: "Pulseras elegantes de esferas brillantes", color: "bg-amber-100 dark:bg-amber-900/30" },
  { id: 13, name: "Pulsera Girasol", image: pulseraGirasol, description: "Cristales dorados con detalle de girasol", color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: 14, name: "Pulsera Macramé", image: pulseraMacrame, description: "Macramé con girasoles y perlas", color: "bg-lime-100 dark:bg-lime-900/30" },
  { id: 15, name: "Pulseras Trébol", image: pulserasTrebol, description: "Pulseras tejidas con dije de trébol", color: "bg-teal-100 dark:bg-teal-900/30" },
  { id: 16, name: "Pulseras Pareja", image: pulserasPareja, description: "Pulseras con corazón magnético", color: "bg-red-100 dark:bg-red-900/30" },
  { id: 17, name: "Pulseras Iniciales", image: pulserasIniciales, description: "Tejidas con inicial personalizada", color: "bg-pink-100 dark:bg-pink-900/30" },
  { id: 18, name: "Pulseras Arcoíris", image: pulserasCorazonesColores, description: "Corazones en todos los colores", color: "bg-indigo-100 dark:bg-indigo-900/30" },
];

// Pre-defined scattered positions/rotations for post-it effect
const postItStyles = [
  { rotate: "-3deg", x: "0%", y: "0px" },
  { rotate: "2deg", x: "0%", y: "8px" },
  { rotate: "-1deg", x: "0%", y: "-4px" },
  { rotate: "4deg", x: "0%", y: "12px" },
  { rotate: "-2deg", x: "0%", y: "0px" },
  { rotate: "1deg", x: "0%", y: "-8px" },
  { rotate: "3deg", x: "0%", y: "6px" },
  { rotate: "-4deg", x: "0%", y: "-2px" },
  { rotate: "2deg", x: "0%", y: "10px" },
  { rotate: "-3deg", x: "0%", y: "-6px" },
  { rotate: "1deg", x: "0%", y: "4px" },
  { rotate: "-2deg", x: "0%", y: "14px" },
  { rotate: "3deg", x: "0%", y: "-10px" },
  { rotate: "-1deg", x: "0%", y: "2px" },
  { rotate: "4deg", x: "0%", y: "-4px" },
  { rotate: "-3deg", x: "0%", y: "8px" },
  { rotate: "2deg", x: "0%", y: "-12px" },
  { rotate: "-2deg", x: "0%", y: "6px" },
];

const tapePositions = [
  "left-1/2 -translate-x-1/2 -top-3",
  "right-4 -top-2 rotate-12",
  "left-4 -top-2 -rotate-12",
  "left-1/2 -translate-x-1/2 -top-3 rotate-3",
  "right-6 -top-3 rotate-6",
  "left-6 -top-2 -rotate-6",
];

const ProductGallery = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.2);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Decorative sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-20 right-10 text-primary/10 w-20 h-20 animate-float" />
        <Sparkles className="absolute bottom-40 left-10 text-primary/10 w-16 h-16 animate-float" style={{ animationDelay: "1s" }} />
        <Sparkles className="absolute top-1/2 right-1/4 text-primary/10 w-12 h-12 animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-1000 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4 gradient-text">
            Nuestra Galería
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubre algunos de nuestros productos más populares
          </p>
        </div>

        {/* Post-it grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {products.map((product, index) => {
            const style = postItStyles[index % postItStyles.length];
            const tape = tapePositions[index % tapePositions.length];
            const isHovered = hoveredId === product.id;
            const delay = index * 80;

            return (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${delay}ms`,
                  animationFillMode: "both",
                }}
              >
                <div
                  className={`relative cursor-pointer transition-all duration-500 ease-out ${product.color} rounded-sm p-2 pb-4`}
                  style={{
                    transform: isHovered
                      ? "rotate(0deg) scale(1.08) translateY(-12px)"
                      : `rotate(${style.rotate}) translateY(${style.y})`,
                    boxShadow: isHovered
                      ? "0 20px 40px -8px rgba(0,0,0,0.25), 0 8px 16px -4px rgba(0,0,0,0.15)"
                      : "2px 4px 12px -2px rgba(0,0,0,0.1), 1px 2px 4px rgba(0,0,0,0.06)",
                    zIndex: isHovered ? 20 : 1,
                  }}
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Tape effect */}
                  <div className={`absolute ${tape} z-10`}>
                    <div
                      className="w-10 h-4 md:w-12 md:h-5 rounded-sm opacity-60"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,225,150,0.9) 0%, rgba(240,210,130,0.7) 100%)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>

                  {/* Image */}
                  <div className="relative overflow-hidden rounded-sm aspect-square mb-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      width="300"
                      height="300"
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
                    />
                  </div>

                  {/* Text */}
                  <div className="px-1">
                    <h3
                      className="text-xs md:text-sm font-semibold text-foreground leading-tight mb-0.5 truncate"
                      style={{ fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs text-muted-foreground leading-snug transition-all duration-300 overflow-hidden ${isHovered ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      {product.description}
                    </p>
                  </div>

                  {/* Pin dot */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary/80 shadow-md hidden" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-block p-1 rounded-2xl bg-primary animate-glow">
            <a
              href="https://www.instagram.com/brillarte.do.oficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-background px-8 py-4 rounded-xl font-medium hover:bg-transparent hover:text-primary-foreground transition-all duration-300 group"
            >
              <span className="flex items-center gap-2 text-lg">
                Contáctanos por Instagram
              </span>
            </a>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            ¿Te interesa alguno de nuestros productos? ¡Escríbenos!
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
