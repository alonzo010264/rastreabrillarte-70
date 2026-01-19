import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Sparkles } from "lucide-react";
import margarita from "@/assets/productos/margarita.jpg";
import aretes from "@/assets/productos/aretes-flores.webp";
import pulseras from "@/assets/productos/pulseras-mariposas.webp";
import floresCrochetRojas from "@/assets/productos/flores-crochet-rojas.png";
import bouquetCrochetColores from "@/assets/productos/bouquet-crochet-colores.png";
import aretesMargaritas from "@/assets/productos/aretes-margaritas-colores.png";
import anilloFloresAzul from "@/assets/productos/anillo-flores-azul.jpg";
import pulserasCorazones from "@/assets/productos/pulseras-corazones.jpg";
import pulserasLoveYou from "@/assets/productos/pulseras-love-you.jpg";
import floresCrochet from "@/assets/productos/flores-crochet.jfif";
const ProductGallery = () => {
  const {
    ref: titleRef,
    isVisible: titleVisible
  } = useScrollAnimation(0.2);
  const {
    ref: grid1Ref,
    isVisible: grid1Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid2Ref,
    isVisible: grid2Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid3Ref,
    isVisible: grid3Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid4Ref,
    isVisible: grid4Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid5Ref,
    isVisible: grid5Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid6Ref,
    isVisible: grid6Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid7Ref,
    isVisible: grid7Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid8Ref,
    isVisible: grid8Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid9Ref,
    isVisible: grid9Visible
  } = useScrollAnimation(0.1);
  const {
    ref: grid10Ref,
    isVisible: grid10Visible
  } = useScrollAnimation(0.1);
  const products = [{
    id: 1,
    name: "Pulsera Margarita",
    image: margarita,
    description: "Elegante pulsera de perlas con diseno floral"
  }, {
    id: 2,
    name: "Aretes de Flores",
    image: aretes,
    description: "Hermoso set de aretes con flores coloridas"
  }, {
    id: 3,
    name: "Pulseras Mariposas",
    image: pulseras,
    description: "Coleccion de pulseras tejidas con mariposas"
  }, {
    id: 4,
    name: "Flores Crochet Rojas",
    image: floresCrochetRojas,
    description: "Hermosas flores tejidas a crochet en color rojo intenso"
  }, {
    id: 5,
    name: "Bouquet Crochet Colores",
    image: bouquetCrochetColores,
    description: "Ramo de flores multicolor tejido a mano con amor"
  }, {
    id: 6,
    name: "Aretes Margaritas Colores",
    image: aretesMargaritas,
    description: "Set de aretes de margaritas en varios colores vibrantes"
  }, {
    id: 7,
    name: "Anillo Flores Azul",
    image: anilloFloresAzul,
    description: "Delicado anillo de flores en tonos azules"
  }, {
    id: 8,
    name: "Pulseras Corazones",
    image: pulserasCorazones,
    description: "Set de pulseras con corazones en colores pastel"
  }, {
    id: 9,
    name: "Pulseras Love You",
    image: pulserasLoveYou,
    description: "Pulseras personalizadas con mensajes de amor"
  }, {
    id: 10,
    name: "Flores Crochet Bouquet",
    image: floresCrochet,
    description: "Bouquet de flores tejidas a crochet artesanal"
  }];
  const gridRefs = [{
    ref: grid1Ref,
    isVisible: grid1Visible,
    animation: 'opacity-0 -translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid2Ref,
    isVisible: grid2Visible,
    animation: 'opacity-0 translate-y-10',
    animationActive: 'opacity-100 translate-y-0'
  }, {
    ref: grid3Ref,
    isVisible: grid3Visible,
    animation: 'opacity-0 translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid4Ref,
    isVisible: grid4Visible,
    animation: 'opacity-0 translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid5Ref,
    isVisible: grid5Visible,
    animation: 'opacity-0 -translate-y-10',
    animationActive: 'opacity-100 translate-y-0'
  }, {
    ref: grid6Ref,
    isVisible: grid6Visible,
    animation: 'opacity-0 -translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid7Ref,
    isVisible: grid7Visible,
    animation: 'opacity-0 translate-y-10',
    animationActive: 'opacity-100 translate-y-0'
  }, {
    ref: grid8Ref,
    isVisible: grid8Visible,
    animation: 'opacity-0 -translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid9Ref,
    isVisible: grid9Visible,
    animation: 'opacity-0 translate-x-10',
    animationActive: 'opacity-100 translate-x-0'
  }, {
    ref: grid10Ref,
    isVisible: grid10Visible,
    animation: 'opacity-0 -translate-y-10',
    animationActive: 'opacity-100 translate-y-0'
  }];
  const hoverRotations = ['group-hover:rotate-3', '', 'group-hover:-rotate-3', 'group-hover:-rotate-2', 'group-hover:rotate-2', '', 'group-hover:rotate-2', 'group-hover:-rotate-3', '', 'group-hover:rotate-3'];
  const gradientColors = ['from-primary/20', 'from-secondary/20', 'from-accent/20', 'from-muted/40', 'from-foreground/10', 'from-muted-foreground/20', 'from-border/30', 'from-muted/30', 'from-foreground/5', 'from-muted/50'];
  return <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-20 right-10 text-primary/10 w-20 h-20 animate-float" />
        <Sparkles className="absolute bottom-40 left-10 text-primary/10 w-16 h-16 animate-float" style={{
        animationDelay: "1s"
      }} />
        <Sparkles className="absolute top-1/2 right-1/4 text-primary/10 w-12 h-12 animate-float" style={{
        animationDelay: "2s"
      }} />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div ref={titleRef} className={`text-center mb-16 transition-all duration-1000 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4 gradient-text">Nuestra Galería</h2>
          <p className="text-lg text-muted-foreground">
            Descubre algunos de nuestros productos más populares
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => <div key={product.id} ref={gridRefs[index].ref} className={`transition-all duration-1000 ${index > 0 ? `delay-${index % 3 * 200}` : ''} ${gridRefs[index].isVisible ? gridRefs[index].animationActive : gridRefs[index].animation}`} style={{
          transitionDelay: `${index % 3 * 150}ms`
        }}>
              <Card className="group overflow-hidden hover-lift cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden aspect-square">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10`} />
                    <img src={product.image} alt={product.name} width="400" height="400" className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-125 ${hoverRotations[index]}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        
                        {product.name}
                      </h3>
                      <p className="text-sm opacity-90">{product.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>)}
        </div>

        <div className="text-center mt-16">
          <div className="inline-block p-1 rounded-2xl bg-primary animate-glow">
            <a href="https://www.instagram.com/brillarte.do.oficial/" target="_blank" rel="noopener noreferrer" className="block bg-background px-8 py-4 rounded-xl font-medium hover:bg-transparent hover:text-primary-foreground transition-all duration-300 group">
              <span className="flex items-center gap-2 text-lg">
                
                Contáctanos por Instagram
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
              </span>
            </a>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            ¿Te interesa alguno de nuestros productos? ¡Escríbenos!
          </p>
        </div>
      </div>
    </section>;
};
export default ProductGallery;