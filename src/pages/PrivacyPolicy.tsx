import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Shield, Diamond } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Diamond className="absolute top-20 left-10 text-muted-foreground w-16 h-16 rotate-45 opacity-10" />
        <Diamond className="absolute top-40 right-20 text-muted-foreground w-12 h-12 rotate-12 opacity-8" />
        <Diamond className="absolute bottom-60 left-20 text-muted-foreground w-20 h-20 -rotate-12 opacity-10" />
      </div>

      <main className="container mx-auto px-4 py-16 max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-light text-foreground mb-4">
            Políticas de Privacidad
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu privacidad es importante para BRILLARTE
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2>Información que Recopilamos</h2>
          <p>
            En BRILLARTE recopilamos únicamente la información necesaria para procesar 
            tus pedidos y brindarte el mejor servicio posible.
          </p>

          <h3>Datos Personales</h3>
          <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Dirección de entrega</li>
            <li>Número de teléfono (opcional)</li>
          </ul>

          <h2>Uso de la Información</h2>
          <p>Utilizamos tu información para:</p>
          <ul>
            <li>Procesar y entregar tus pedidos</li>
            <li>Enviarte actualizaciones sobre el estado de tu pedido</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Comunicarnos contigo sobre promociones (con tu consentimiento)</li>
          </ul>

          <h2>Protección de Datos</h2>
          <p>
            Implementamos medidas de seguridad para proteger tu información personal 
            contra acceso no autorizado, alteración, divulgación o destrucción.
          </p>

          <h2>Compartir Información</h2>
          <p>
            No vendemos, intercambiamos ni transferimos tu información personal a 
            terceros sin tu consentimiento, excepto cuando sea necesario para 
            completar tu pedido o cumplir con la ley.
          </p>

          <h2>Contacto</h2>
          <p>
            Si tienes preguntas sobre nuestras políticas de privacidad, 
            puedes contactarnos a través de nuestros canales oficiales.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;