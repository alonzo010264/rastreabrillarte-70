import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Diamond, Users, Target, Heart } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16 animate-fade-in">
          <Diamond className="w-16 h-16 text-primary mx-auto mb-6 rotate-45" />
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Nosotros
          </h1>
          <p className="text-lg text-muted-foreground">
            Conoce más sobre BRILLARTE y nuestro compromiso contigo
          </p>
        </div>

        <div className="space-y-16">
          <section className="animate-fade-in animation-delay-200">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-light text-foreground">Nuestra Historia</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              BRILLARTE nació de la pasión por crear y ofrecer productos únicos que reflejen 
              la personalidad de cada persona. Comenzamos como un pequeño emprendimiento con 
              el sueño de hacer brillar a nuestros clientes a través de accesorios de calidad.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Hoy en día, seguimos comprometidos con esa visión original: ofrecer productos 
              excepcionales que no solo complementen tu estilo, sino que también cuenten tu historia única.
            </p>
          </section>

          <section className="animate-fade-in animation-delay-300">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-light text-foreground">Nuestro Compromiso</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              En BRILLARTE, cada producto es más que un simple accesorio. Es una expresión 
              de arte, calidad y dedicación. Nos comprometemos a:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Diamond className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Seleccionar cuidadosamente cada material y componente</span>
              </li>
              <li className="flex items-start gap-2">
                <Diamond className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Mantener los más altos estándares de calidad en cada producto</span>
              </li>
              <li className="flex items-start gap-2">
                <Diamond className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Ofrecer un servicio al cliente excepcional</span>
              </li>
              <li className="flex items-start gap-2">
                <Diamond className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Innovar constantemente en diseños y productos</span>
              </li>
            </ul>
          </section>

          <section className="animate-fade-in animation-delay-400">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-light text-foreground">Nuestros Valores</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">Calidad</h3>
                <p className="text-muted-foreground">
                  Cada producto pasa por rigurosos controles de calidad para asegurar 
                  que llegue perfecto a tus manos.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">Confianza</h3>
                <p className="text-muted-foreground">
                  Construimos relaciones duraderas basadas en la transparencia 
                  y el cumplimiento de nuestras promesas.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">Innovación</h3>
                <p className="text-muted-foreground">
                  Buscamos constantemente nuevas formas de sorprender y satisfacer 
                  a nuestros clientes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-3">Pasión</h3>
                <p className="text-muted-foreground">
                  Amamos lo que hacemos y esa pasión se refleja en cada detalle 
                  de nuestros productos y servicios.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;