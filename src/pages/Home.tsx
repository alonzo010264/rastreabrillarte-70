import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import { Star, Clock, Sparkles, Zap, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";
import teamWork from "@/assets/team-work.png";

const Home = () => {
  const navigate = useNavigate();
  const offsetY = useParallax();
  const { ref: missionRef, isVisible: missionVisible } = useScrollAnimation(0.2);
  const { ref: whyUsRef, isVisible: whyUsVisible } = useScrollAnimation(0.2);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation(0.3);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Parallax */}
      <section className="relative min-h-[80vh] flex items-center px-4 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div 
          className="absolute inset-0 pointer-events-none parallax-slow"
          style={{ transform: `translateY(${offsetY * 0.3}px)` }}
        >
          <Sparkles className="absolute top-20 left-10 text-primary/20 w-16 h-16 animate-float" />
          <Sparkles className="absolute top-40 right-20 text-primary/15 w-12 h-12 animate-float" style={{ animationDelay: "1s" }} />
          <Sparkles className="absolute bottom-60 left-20 text-primary/10 w-20 h-20 animate-float" style={{ animationDelay: "2s" }} />
          <Sparkles className="absolute bottom-20 right-10 text-primary/20 w-14 h-14 animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center md:text-left space-y-8">
            <div className="animate-scale-in">
              <img 
                src={brillarteLogo} 
                alt="BRILLARTE Logo" 
                className="h-32 w-32 mx-auto md:mx-0 mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 animate-fade-in">
              BRILLARTE
            </h1>
            <p className="text-2xl md:text-3xl text-primary font-light animate-fade-in animation-delay-200">
              El Arte de Brillar
            </p>
            <p className="text-lg text-muted-foreground animate-fade-in animation-delay-300 leading-relaxed">
              Descubre accesorios únicos y de calidad excepcional. 
              Pulseras elegantes, aretes hermosos, monederos funcionales y mucho más para complementar tu estilo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in animation-delay-400">
              <Button size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Link to="/pedir">Hacer Pedido</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 hover:scale-105 transition-all">
                <Link to="/rastrear">Rastrear Pedido</Link>
              </Button>
            </div>
          </div>

          <div className="animate-fade-in animation-delay-500 relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <img 
                src={teamWork} 
                alt="Equipo BRILLARTE" 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-xl shadow-xl animate-glow hover:scale-110 transition-transform cursor-pointer">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Calidad Garantizada
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
              ¿Quiénes Somos?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Somos <strong>BRILLARTE</strong>, un emprendimiento dedicado a ofrecerte productos 
              de calidad excepcional. Nos especializamos en pulseras elegantes, aretes únicos, 
              monederos funcionales y muchos otros productos que iremos agregando para 
              complementar tu estilo personal.
            </p>
          </div>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="py-20 px-4 bg-muted/50 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{ transform: `translateY(${offsetY * 0.2}px)` }}
        >
          <div className="absolute top-10 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        <div ref={missionRef} className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className={`hover-lift cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-700 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Heart className="w-6 h-6 text-primary animate-pulse" />
                  Misión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Brindar productos de calidad excepcional que reflejen la personalidad 
                  única de nuestros clientes, ofreciendo un servicio personalizado y 
                  confiable que supere sus expectativas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`hover-lift cursor-pointer border-2 border-transparent hover:border-secondary/30 transition-all duration-700 delay-200 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Zap className="w-6 h-6 text-secondary animate-pulse" style={{ animationDelay: "0.5s" }} />
                  Visión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Convertirnos en la marca de referencia en accesorios de calidad, 
                  reconocidos por nuestra innovación, diseño único y compromiso 
                  con la satisfacción del cliente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`hover-lift cursor-pointer border-2 border-transparent hover:border-accent/30 transition-all duration-700 delay-400 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="w-6 h-6 text-accent animate-pulse" style={{ animationDelay: "1s" }} />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Calidad, honestidad, compromiso con el cliente, innovación constante 
                  y respeto por el arte de crear productos únicos que marquen la diferencia.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pedidos en Línea Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 animate-fade-in">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 animate-fade-in">
                ¿Quieres hacer pedidos en línea y que te lleguen directamente?
              </h2>
              <p className="text-lg text-muted-foreground animate-fade-in animation-delay-200">
                Descubre nuestro nuevo servicio de envíos internacionales
              </p>
            </div>
            <Button 
              size="lg" 
              className="text-lg px-8 whitespace-nowrap transition-all duration-300 hover:scale-110 hover:shadow-lg animate-scale-in animation-delay-300"
              onClick={() => navigate("/brillarte-pedidos")}
            >
              Ver Más
            </Button>
          </div>
        </div>
      </section>

      {/* Galería de Productos */}
      <ProductGallery />

      {/* Por qué elegirnos */}
      <section className="py-20 px-4 bg-muted/30">
        <div ref={whyUsRef} className="container mx-auto max-w-4xl">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            whyUsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6 gradient-text">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Descubre las razones por las que miles de clientes confían en BRILLARTE
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`flex items-start gap-4 group cursor-pointer transition-all duration-500 hover:translate-x-3 ${
              whyUsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Star className="w-6 h-6 flex-shrink-0 group-hover:animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Productos de Calidad Superior
                </h3>
                <p className="text-muted-foreground">
                  Cada pieza es cuidadosamente seleccionada y revisada para garantizar 
                  la mejor calidad y durabilidad.
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-4 group cursor-pointer transition-all duration-500 delay-200 hover:translate-x-3 ${
              whyUsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="bg-secondary/10 p-3 rounded-xl group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                <Clock className="w-6 h-6 flex-shrink-0 group-hover:animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Rastreo Completo de Pedidos
                </h3>
                <p className="text-muted-foreground">
                  Mantente informado sobre el estado de tu pedido en tiempo real 
                  con nuestro sistema avanzado de seguimiento.
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-4 group cursor-pointer transition-all duration-500 delay-300 hover:translate-x-3 ${
              whyUsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="bg-accent/10 p-3 rounded-xl group-hover:bg-accent group-hover:text-white transition-all duration-300">
                <Shield className="w-6 h-6 flex-shrink-0 group-hover:animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Garantía de Satisfacción
                </h3>
                <p className="text-muted-foreground">
                  Tu satisfacción es nuestra prioridad. Ofrecemos garantía completa 
                  en todos nuestros productos.
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-4 group cursor-pointer transition-all duration-500 delay-400 hover:translate-x-3 ${
              whyUsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Sparkles className="w-6 h-6 flex-shrink-0 group-hover:animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Diseños Únicos y Exclusivos
                </h3>
                <p className="text-muted-foreground">
                  Encuentra piezas únicas que no verás en otros lugares, 
                  diseñadas especialmente para destacar tu personalidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ transform: `translateY(${offsetY * 0.15}px)` }}
        >
          <Sparkles className="absolute top-10 left-10 w-20 h-20 opacity-20 animate-float" />
          <Sparkles className="absolute bottom-10 right-10 w-16 h-16 opacity-20 animate-float" style={{ animationDelay: "1s" }} />
        </div>
        <div ref={ctaRef} className="container mx-auto text-center max-w-3xl relative z-10">
          <h2 className={`text-4xl md:text-5xl font-light mb-6 transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            ¿Listo para Brillar?
          </h2>
          <p className={`text-xl opacity-90 mb-8 transition-all duration-1000 delay-200 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            Únete a miles de clientes satisfechos que ya han descubierto 
            la diferencia BRILLARTE.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-400 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/solicitar-retiro">Solicitar Retiro</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;