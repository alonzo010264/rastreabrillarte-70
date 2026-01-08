import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import { Star, Clock, Sparkles, Zap, Shield, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";
import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";
import teamWork from "@/assets/team-work-optimized.webp";

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
      <section className="relative min-h-[90vh] flex items-center px-4 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        {/* Animated background elements */}
        <div 
          className="absolute inset-0 pointer-events-none parallax-slow"
          style={{ transform: `translateY(${offsetY * 0.3}px)` }}
        >
          <Sparkles className="absolute top-20 left-10 text-primary/30 w-16 h-16 animate-float" />
          <Sparkles className="absolute top-40 right-20 text-primary/20 w-12 h-12 animate-float animation-delay-300" />
          <Sparkles className="absolute bottom-60 left-20 text-primary/15 w-20 h-20 animate-float animation-delay-600" />
          <Sparkles className="absolute bottom-20 right-10 text-primary/25 w-14 h-14 animate-float animation-delay-400" />
          <Sparkles className="absolute top-1/2 left-1/3 text-secondary/15 w-10 h-10 animate-float animation-delay-500" />
          
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-morph" />
        </div>
        
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center md:text-left space-y-8">
            <div className="animate-blur-in">
              <img 
                src={brillarteLogo} 
                alt="BRILLARTE Logo" 
                width="128"
                height="128"
                className="h-36 w-36 mx-auto md:mx-0 mb-6 transition-all duration-500 hover:scale-110 hover:rotate-6 drop-shadow-2xl"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 animate-blur-in animation-delay-200">
              <span className="gradient-text-animated">BRILLARTE</span>
            </h1>
            <p className="text-2xl md:text-3xl text-primary font-light animate-slide-up-fade animation-delay-300">
              El Arte de Brillar ✨
            </p>
            <p className="text-lg text-muted-foreground animate-slide-up-fade animation-delay-400 leading-relaxed max-w-lg">
              Descubre accesorios únicos y de calidad excepcional. 
              Pulseras elegantes, aretes hermosos, monederos funcionales y mucho más para complementar tu estilo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-slide-up-fade animation-delay-500">
              <Button 
                size="lg" 
                className="text-lg px-8 shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-500 hover:scale-105 hover:-translate-y-1 btn-shine group"
              >
                <Link to="/pedir" className="flex items-center gap-2">
                  Hacer Pedido
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-lg px-8 hover:scale-105 hover:-translate-y-1 transition-all duration-500 hover:bg-primary/10 hover:border-primary"
              >
                <Link to="/rastrear">Rastrear Pedido</Link>
              </Button>
            </div>
          </div>

          <div className="animate-blur-in animation-delay-600 relative group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-700 card-3d">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
              <img 
                src={teamWork} 
                alt="Equipo BRILLARTE"
                width="800"
                height="533"
                fetchPriority="high"
                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-2xl shadow-xl animate-pulse-glow hover:scale-110 transition-all duration-500 cursor-pointer group/badge">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 group-hover/badge:rotate-12 transition-transform" />
                Calidad Garantizada
              </p>
            </div>
            {/* Floating elements around image */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-secondary/20 rounded-full blur-xl animate-float animation-delay-400" />
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-slide-up-fade" style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }} />
          </div>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-6xl font-light text-foreground mb-8">
              ¿Quiénes <span className="gradient-text-animated">Somos</span>?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Somos <strong className="text-primary">BRILLARTE</strong>, un emprendimiento dedicado a ofrecerte productos 
              de calidad excepcional. Nos especializamos en pulseras elegantes, aretes únicos, 
              monederos funcionales y muchos otros productos que iremos agregando para 
              complementar tu estilo personal.
            </p>
          </div>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-50"
          style={{ transform: `translateY(${offsetY * 0.2}px)` }}
        >
          <div className="absolute top-10 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-morph" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-morph animation-delay-500" />
        </div>
        <div ref={missionRef} className="container mx-auto max-w-6xl relative z-10">
          <h2 className={`text-4xl md:text-5xl font-light text-center mb-16 transition-all duration-1000 ${
            missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Nuestra <span className="gradient-text">Esencia</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className={`card-interactive border-2 border-transparent hover:border-primary/30 bg-card/80 backdrop-blur-sm transition-all duration-700 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-primary animate-scale-pulse" />
                </div>
                <CardTitle className="text-2xl">Misión</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Brindar productos de calidad excepcional que reflejen la personalidad 
                  única de nuestros clientes, ofreciendo un servicio personalizado y 
                  confiable que supere sus expectativas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`card-interactive border-2 border-transparent hover:border-secondary/30 bg-card/80 backdrop-blur-sm transition-all duration-700 animation-delay-200 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '200ms' }}>
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-secondary animate-scale-pulse animation-delay-300" />
                </div>
                <CardTitle className="text-2xl">Visión</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Convertirnos en la marca de referencia en accesorios de calidad, 
                  reconocidos por nuestra innovación, diseño único y compromiso 
                  con la satisfacción del cliente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`card-interactive border-2 border-transparent hover:border-accent/30 bg-card/80 backdrop-blur-sm transition-all duration-700 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '400ms' }}>
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-accent-foreground animate-scale-pulse animation-delay-500" />
                </div>
                <CardTitle className="text-2xl">Valores</CardTitle>
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
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-background to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-float animation-delay-500" />
        </div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 animate-blur-in">
                ¿Quieres hacer pedidos en línea y que te lleguen <span className="gradient-text">directamente</span>?
              </h2>
              <p className="text-lg text-muted-foreground animate-blur-in animation-delay-200">
                Descubre nuestro nuevo servicio de envíos internacionales
              </p>
            </div>
            <Button 
              size="lg" 
              className="text-lg px-8 whitespace-nowrap transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-primary/25 animate-slide-up-fade animation-delay-400 btn-shine group"
              onClick={() => navigate("/brillarte-pedidos")}
            >
              Ver Más
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Galería de Productos */}
      <ProductGallery />

      {/* Por qué elegirnos */}
      <section className="py-24 px-4 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div ref={whyUsRef} className="container mx-auto max-w-4xl relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            whyUsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-4xl md:text-6xl font-light text-foreground mb-6">
              ¿Por Qué <span className="gradient-text-animated">Elegirnos</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
              Descubre las razones por las que miles de clientes confían en BRILLARTE
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Star,
                color: "primary",
                title: "Productos de Calidad Superior",
                description: "Cada pieza es cuidadosamente seleccionada y revisada para garantizar la mejor calidad y durabilidad.",
                delay: 0
              },
              {
                icon: Clock,
                color: "secondary",
                title: "Rastreo Completo de Pedidos",
                description: "Mantente informado sobre el estado de tu pedido en tiempo real con nuestro sistema avanzado de seguimiento.",
                delay: 100
              },
              {
                icon: Shield,
                color: "accent",
                title: "Garantía de Satisfacción",
                description: "Tu satisfacción es nuestra prioridad. Ofrecemos garantía completa en todos nuestros productos.",
                delay: 200
              },
              {
                icon: Sparkles,
                color: "primary",
                title: "Diseños Únicos y Exclusivos",
                description: "Encuentra piezas únicas que no verás en otros lugares, diseñadas especialmente para destacar tu personalidad.",
                delay: 300
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-${item.color}/30 cursor-pointer transition-all duration-500 hover:translate-x-2 hover:shadow-xl ${
                  whyUsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
                style={{ transitionDelay: `${item.delay}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${item.color}/10 group-hover:bg-${item.color} transition-all duration-500 group-hover:scale-110`}>
                    <item.icon className={`w-6 h-6 text-${item.color} group-hover:text-white transition-colors`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ transform: `translateY(${offsetY * 0.15}px)` }}
        >
          <Sparkles className="absolute top-10 left-10 w-20 h-20 opacity-20 animate-float" />
          <Sparkles className="absolute top-20 right-1/4 w-16 h-16 opacity-15 animate-float animation-delay-300" />
          <Sparkles className="absolute bottom-10 right-10 w-16 h-16 opacity-20 animate-float animation-delay-500" />
          <Sparkles className="absolute bottom-20 left-1/4 w-12 h-12 opacity-15 animate-float animation-delay-700" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        </div>
        <div ref={ctaRef} className="container mx-auto text-center max-w-3xl relative z-10">
          <h2 className={`text-4xl md:text-6xl font-light mb-6 transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            ¿Listo para <span className="font-medium">Brillar</span>? ✨
          </h2>
          <p className={`text-xl opacity-90 mb-10 transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`} style={{ transitionDelay: '200ms' }}>
            Únete a miles de clientes satisfechos que ya han descubierto 
            la diferencia BRILLARTE.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`} style={{ transitionDelay: '400ms' }}>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 hover:scale-105 hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-xl btn-shine" 
              asChild
            >
              <Link to="/solicitar-retiro">Solicitar Retiro</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary hover:scale-105 hover:-translate-y-1 transition-all duration-500" 
              asChild
            >
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