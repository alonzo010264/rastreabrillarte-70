import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Diamond, Sparkles, Shield, Clock, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-background to-muted overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Diamond className="absolute top-20 left-10 text-muted-foreground w-16 h-16 rotate-45 opacity-20 animate-fade-in" />
          <Sparkles className="absolute top-40 right-20 text-muted-foreground w-12 h-12 rotate-12 opacity-15 animate-fade-in animation-delay-200" />
          <Diamond className="absolute bottom-60 left-20 text-muted-foreground w-20 h-20 -rotate-12 opacity-10 animate-fade-in animation-delay-300" />
          <Sparkles className="absolute bottom-20 right-10 text-muted-foreground w-14 h-14 rotate-45 opacity-20 animate-fade-in animation-delay-400" />
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="mb-8 animate-scale-in">
            <img 
              src="/assets/brillarte-logo.jpg" 
              alt="BRILLARTE Logo" 
              className="h-32 w-auto mx-auto mb-6 transition-transform duration-300 hover:scale-110"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 animate-fade-in">
            BRILLARTE
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in animation-delay-200">
            El Arte de Brillar
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-300">
            Descubre productos de calidad únicos que harán brillar tu estilo. 
            Pulseras, aretes, monederos y mucho más.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-400">
            <Button size="lg" className="text-lg px-8">
              Explorar Productos
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/rastrear">Rastrear Pedido</Link>
            </Button>
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
                  <Shield className="w-6 h-6 text-primary" />
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
                  <Sparkles className="w-6 h-6 text-primary" />
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
                  <Award className="w-6 h-6 text-primary" />
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

      {/* Por qué elegirnos */}
      <section className="py-20 px-4">
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
            <div className="flex items-start gap-4 animate-fade-in">
              <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-200">
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-300">
              <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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

            <div className="flex items-start gap-4 animate-fade-in animation-delay-400">
              <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
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
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Ver Catálogo
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Contactar
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;