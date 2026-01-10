import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import notFoundImage from "@/assets/404-brillarte.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Navigation />
      <PageHeader 
        title="Página No Encontrada" 
        subtitle="La página que buscas no existe o ha sido movida"
      />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto text-center animate-fade-in">
          {/* Imagen 404 */}
          <div className="relative mb-8 animate-scale-in">
            <img 
              src={notFoundImage} 
              alt="Página no encontrada - BRILLARTE" 
              className="w-full max-w-2xl mx-auto h-auto object-contain drop-shadow-2xl"
            />
          </div>
          
          {/* Mensaje adicional */}
          <div className="space-y-4 animate-slide-up-fade">
            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
              ¡Pero no te preocupes, te ayudamos a encontrar lo que necesitas!
            </p>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="group min-w-[200px] border-2 hover:scale-105 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Volver Atrás
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                size="lg"
                className="group min-w-[200px] bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Ir al Inicio
              </Button>
            </div>
            
            {/* Enlaces útiles */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">También puedes visitar:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant="link" 
                  onClick={() => navigate('/productos')}
                  className="text-primary hover:text-primary/80"
                >
                  🛍️ Productos
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/contacto')}
                  className="text-primary hover:text-primary/80"
                >
                  📧 Contacto
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/rastrear-pedido')}
                  className="text-primary hover:text-primary/80"
                >
                  📦 Rastrear Pedido
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/faq')}
                  className="text-primary hover:text-primary/80"
                >
                  ❓ Preguntas Frecuentes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
