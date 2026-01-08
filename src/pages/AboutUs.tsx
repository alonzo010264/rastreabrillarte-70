import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Users, Target, Heart, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import teamUniforms from "@/assets/team-uniforms.png";
import teamMember from "@/assets/team-member.png";
import delivery from "@/assets/delivery.jpg";
import customerHelp from "@/assets/customer-help.jpg";
const AboutUs = () => {
  const {
    ref: ref1,
    isVisible: visible1
  } = useScrollAnimation();
  const {
    ref: ref2,
    isVisible: visible2
  } = useScrollAnimation();
  const {
    ref: ref3,
    isVisible: visible3
  } = useScrollAnimation();
  const {
    ref: ref4,
    isVisible: visible4
  } = useScrollAnimation();
  return <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Nosotros" subtitle="Conoce más sobre BRILLARTE y nuestro compromiso contigo" />
      
      <div className="container mx-auto px-4 py-16 max-w-6xl">

        {/* Nuestra Historia con Imagen */}
        <section ref={ref1} className={`mb-20 ${visible1 ? 'animate-on-scroll' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
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
            </div>
            <div className="relative group">
              <div className="overflow-hidden rounded-2xl shadow-xl hover-lift">
                <img src={teamUniforms} alt="Equipo BRILLARTE" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
          </div>
        </section>

        {/* Nuestro Compromiso con Imagen */}
        <section ref={ref2} className={`mb-20 ${visible2 ? 'animate-on-scroll' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="overflow-hidden rounded-2xl shadow-xl hover-lift">
                <img src={delivery} alt="Entregas BRILLARTE" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
            <div className="order-1 md:order-2">
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
                  <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Seleccionar cuidadosamente cada material y componente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Mantener los más altos estándares de calidad en cada producto</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Ofrecer un servicio al cliente excepcional</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Innovar constantemente en diseños y productos</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Atención al Cliente con Imagen */}
        <section ref={ref3} className={`mb-20 ${visible3 ? 'animate-on-scroll' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-light text-foreground">Atención Personalizada</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                Nuestro equipo está capacitado para brindarte la mejor atención. Contamos con 
                agentes especializados listos para resolver tus dudas y ayudarte en todo momento.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Ya sea que necesites ayuda con un pedido, información sobre productos o 
                seguimiento de envíos, estamos aquí para ti.
              </p>
            </div>
            <div className="relative group">
              <div className="overflow-hidden rounded-2xl shadow-xl hover-lift">
                <img src={customerHelp} alt="Atención al cliente BRILLARTE" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
          </div>
        </section>

        {/* Nuestros Valores */}
        <section ref={ref4} className={`${visible4 ? 'animate-on-scroll' : 'opacity-0'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-foreground mb-4">Nuestros Valores</h2>
            <p className="text-muted-foreground">Lo que nos define como empresa</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-muted/30 p-6 rounded-xl hover-lift">
              <h3 className="text-xl font-medium text-foreground mb-3">Calidad</h3>
              <p className="text-muted-foreground">
                Cada producto pasa por rigurosos controles de calidad para asegurar 
                que llegue perfecto a tus manos.
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-xl hover-lift">
              <h3 className="text-xl font-medium text-foreground mb-3">Confianza</h3>
              <p className="text-muted-foreground">
                Construimos relaciones duraderas basadas en la transparencia 
                y el cumplimiento de nuestras promesas.
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-xl hover-lift">
              <h3 className="text-xl font-medium text-foreground mb-3">Innovación</h3>
              <p className="text-muted-foreground">
                Buscamos constantemente nuevas formas de sorprender y satisfacer 
                a nuestros clientes.
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-xl hover-lift">
              <h3 className="text-xl font-medium text-foreground mb-3">Pasión</h3>
              <p className="text-muted-foreground">
                Amamos lo que hacemos y esa pasión se refleja en cada detalle 
                de nuestros productos y servicios.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>;
};
export default AboutUs;