import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Sparkles } from "lucide-react";
import margarita from "@/assets/productos/margarita.jpg";
import aretes from "@/assets/productos/aretes-flores.webp";
import pulseras from "@/assets/productos/pulseras-mariposas.webp";

const ProductGallery = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.2);
  const { ref: grid1Ref, isVisible: grid1Visible } = useScrollAnimation(0.1);
  const { ref: grid2Ref, isVisible: grid2Visible } = useScrollAnimation(0.1);
  const { ref: grid3Ref, isVisible: grid3Visible } = useScrollAnimation(0.1);
  const products = [
    {
      id: 1,
      name: "Pulsera Margarita",
      image: margarita,
      description: "Elegante pulsera de perlas con diseño floral",
    },
    {
      id: 2,
      name: "Aretes de Flores",
      image: aretes,
      description: "Hermoso set de aretes con flores coloridas",
    },
    {
      id: 3,
      name: "Pulseras Mariposas",
      image: pulseras,
      description: "Colección de pulseras tejidas con mariposas",
    },
  ];

  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-20 right-10 text-primary/10 w-20 h-20 animate-float" />
        <Sparkles className="absolute bottom-40 left-10 text-primary/10 w-16 h-16 animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4 gradient-text">
            Nuestra Galería
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubre algunos de nuestros productos más populares ✨
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div
            ref={grid1Ref}
            className={`transition-all duration-1000 ${
              grid1Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <Card className="group overflow-hidden hover-lift cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-500">
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  <img
                    src={products[0].image}
                    alt={products[0].name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-3"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {products[0].name}
                    </h3>
                    <p className="text-sm opacity-90">{products[0].description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            ref={grid2Ref}
            className={`transition-all duration-1000 delay-200 ${
              grid2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <Card className="group overflow-hidden hover-lift cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-500">
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  <img
                    src={products[1].image}
                    alt={products[1].name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {products[1].name}
                    </h3>
                    <p className="text-sm opacity-90">{products[1].description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            ref={grid3Ref}
            className={`transition-all duration-1000 delay-400 ${
              grid3Visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            <Card className="group overflow-hidden hover-lift cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-500">
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  <img
                    src={products[2].image}
                    alt={products[2].name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:-rotate-3"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {products[2].name}
                    </h3>
                    <p className="text-sm opacity-90">{products[2].description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-glow">
            <a
              href="https://www.instagram.com/brillarte.do.oficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-background px-8 py-4 rounded-xl font-medium hover:bg-transparent hover:text-white transition-all duration-300 group"
            >
              <span className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                Contáctanos por Instagram
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
              </span>
            </a>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            ¿Te interesa alguno de nuestros productos? ¡Escríbenos! 💎
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
