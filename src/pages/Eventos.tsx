import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Calendar, Heart, Gift, Users, Star, Sparkles, PartyPopper, Music } from "lucide-react";
import { Link } from "react-router-dom";
import eventoBoda from "@/assets/eventos/evento-boda.jpg";
import eventoCumple from "@/assets/eventos/evento-cumple.jpg";
import eventoCorporativo from "@/assets/eventos/evento-corporativo.jpg";

const eventTypes = [
  {
    title: "Bodas & Compromisos",
    description: "Haz que el día más especial sea inolvidable con pulseras y accesorios personalizados para la novia, damas de honor y todos los invitados. Cada pieza cuenta una historia de amor.",
    icon: Heart,
    image: eventoBoda,
    features: ["Pulseras personalizadas para damas de honor", "Recuerdos únicos para invitados", "Diseños exclusivos con los colores de tu boda", "Packaging especial para la ocasión"],
  },
  {
    title: "Cumpleaños & Celebraciones",
    description: "Dale vida a cualquier fiesta con accesorios coloridos y llenos de energía. Perfectos como regalos, souvenirs o para crear momentos memorables con tus seres queridos.",
    icon: PartyPopper,
    image: eventoCumple,
    features: ["Sets de pulseras temáticas", "Colores personalizados por fiesta", "Ideales para bolsas de regalo", "Opciones para todas las edades"],
  },
  {
    title: "Eventos Corporativos",
    description: "Eleva tu marca con accesorios artesanales de alta calidad. Perfectos para conferencias, lanzamientos de productos o regalos empresariales que dejan huella.",
    icon: Users,
    image: eventoCorporativo,
    features: ["Branding personalizado", "Pedidos por volumen con descuento", "Empaque corporativo elegante", "Entrega coordinada al evento"],
  },
];

const benefits = [
  { icon: Star, title: "100% Artesanal", description: "Cada pieza hecha a mano con amor y dedicación" },
  { icon: Gift, title: "Personalización Total", description: "Colores, diseños y mensajes a tu gusto" },
  { icon: Calendar, title: "Entrega Puntual", description: "Nos comprometemos con la fecha de tu evento" },
  { icon: Music, title: "Para Todo Tipo de Evento", description: "Bodas, cumpleaños, graduaciones y más" },
];

const Eventos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Eventos" subtitle="Haz de tu evento algo inolvidable con BRILLARTE" />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Accesorios para momentos especiales
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Porque cada momento merece <span className="text-primary">brillar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            En BRILLARTE creamos pulseras, aretes y accesorios artesanales que transforman cualquier evento en una experiencia única. 
            Desde bodas íntimas hasta grandes celebraciones, nuestros productos añaden ese toque especial que tus invitados recordarán siempre.
          </p>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl space-y-16">
          {eventTypes.map((event, index) => (
            <div
              key={event.title}
              className={`flex flex-col ${index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}
            >
              <div className="md:w-1/2">
                <img
                  src={event.image}
                  alt={event.title}
                  className="rounded-2xl shadow-xl w-full h-72 object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="md:w-1/2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <event.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{event.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                <ul className="space-y-2">
                  {event.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            ¿Por qué elegir BRILLARTE para tu evento?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-card rounded-xl p-6 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">{b.title}</h4>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            ¿Listo para hacer brillar tu evento?
          </h2>
          <p className="text-muted-foreground">
            Contáctanos para una cotización personalizada. Trabajamos contigo para crear los accesorios perfectos para tu ocasión especial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Heart className="w-4 h-4" />
              Solicitar Cotización
            </Link>
            <a
              href="https://wa.me/18494252220?text=Hola!%20Me%20interesa%20pulseras%20para%20un%20evento"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-primary text-primary px-8 py-3 rounded-xl font-medium hover:bg-primary/5 transition-colors"
            >
              WhatsApp Directo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Eventos;
