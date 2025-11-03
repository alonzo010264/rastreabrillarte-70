import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import { Star, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";
import teamWork from "@/assets/team-work.png";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center px-4 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-20 left-10 text-primary/20 w-16 h-16 animate-pulse" style={{ animationDelay: "0s" }} />
          <Sparkles className="absolute top-40 right-20 text-primary/15 w-12 h-12 animate-pulse" style={{ animationDelay: "1s" }} />
          <Sparkles className="absolute bottom-60 left-20 text-primary/10 w-20 h-20 animate-pulse" style={{ animationDelay: "2s" }} />
          <Sparkles className="absolute bottom-20 right-10 text-primary/20 w-14 h-14 animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
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
              El Arte de Brillar ✨
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

          <div className="animate-fade-in animation-delay-500 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img 
                src={teamWork} 
                alt="Equipo BRILLARTE" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg animate-pulse">
              <p className="text-sm font-medium">Calidad Garantizada ⭐</p>
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
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-primary" />
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

            <Card className="animate-fade-in animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-primary" />
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

            <Card className="animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-primary" />
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
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Descubre las razones por las que miles de clientes confían en BRILLARTE
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4 animate-fade-in transition-all duration-300 hover:translate-x-2">
              <Star className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-200 transition-all duration-300 hover:translate-x-2">
              <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-300 transition-all duration-300 hover:translate-x-2">
              <Star className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-400 transition-all duration-300 hover:translate-x-2">
              <Star className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-light mb-6 animate-fade-in">
            ¿Listo para Brillar?
          </h2>
          <p className="text-lg opacity-90 mb-8 animate-fade-in animation-delay-200">
            Únete a miles de clientes satisfechos que ya han descubierto 
            la diferencia BRILLARTE.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-300">
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