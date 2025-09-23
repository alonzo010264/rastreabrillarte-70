import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Diamond, HelpCircle } from "lucide-react";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <HelpCircle className="w-20 h-20 text-primary mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Estamos preparando las respuestas a tus dudas más comunes
          </p>
          <div className="bg-muted/50 rounded-lg p-8 border border-border">
            <Diamond className="w-12 h-12 text-primary mx-auto mb-4 rotate-45" />
            <h2 className="text-2xl font-light text-foreground mb-4">
              Próximamente
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              En esta sección encontrarás respuestas detalladas sobre nuestros productos, 
              procesos de envío, políticas de devolución, cuidado de productos y mucho más. 
              Mientras tanto, puedes contactarnos directamente para cualquier consulta.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;