import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Diamond, MessageSquare } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <MessageSquare className="w-20 h-20 text-primary mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Contacto
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Estamos preparando múltiples formas de comunicación contigo
          </p>
          <div className="bg-muted/50 rounded-lg p-8 border border-border">
            <Diamond className="w-12 h-12 text-primary mx-auto mb-4 rotate-45" />
            <h2 className="text-2xl font-light text-foreground mb-4">
              Próximamente
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pronto podrás contactarnos a través de múltiples canales: 
              formulario de contacto, WhatsApp, email, y redes sociales. 
              También tendremos un chat en vivo para atención inmediata.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;