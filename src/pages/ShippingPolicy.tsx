import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Truck, Diamond } from "lucide-react";

const ShippingPolicy = () => {
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
          <Truck className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-light text-foreground mb-4">
            Políticas de Envío
          </h1>
          <p className="text-muted-foreground text-lg">
            Información sobre entregas y retiros en BRILLARTE
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2>Opciones de Entrega</h2>
          
          <h3>Retiro en Tienda</h3>
          <p>
            Puedes retirar tu pedido directamente en nuestra ubicación:
          </p>
          <ul>
            <li><strong>Dirección:</strong> Cerro Alto, Barrio Las Mercedes, Calle Primera</li>
            <li><strong>Proceso:</strong> Utiliza nuestro formulario de "Solicitar Retiro"</li>
            <li><strong>Tiempo:</strong> Te notificaremos cuándo esté listo para retirar</li>
            <li><strong>Requisitos:</strong> Código de pedido y identificación</li>
          </ul>

          <h3>Entrega a Domicilio</h3>
          <p>
            También ofrecemos servicio de entrega según disponibilidad en tu zona.
          </p>

          <h2>Tiempos de Procesamiento</h2>
          <ul>
            <li><strong>Procesamiento:</strong> 1-3 días hábiles</li>
            <li><strong>Productos personalizados:</strong> 5-7 días hábiles</li>
            <li><strong>Notificación:</strong> Te informaremos cuando esté listo</li>
          </ul>

          <h2>Rastreo de Pedidos</h2>
          <p>
            Puedes rastrear el estado de tu pedido en cualquier momento usando 
            nuestro sistema de seguimiento con tu código de pedido.
          </p>

          <h2>Responsabilidades</h2>
          <h3>Retiros</h3>
          <ul>
            <li>El cliente debe presentar el código de pedido correcto</li>
            <li>BRILLARTE no es responsable si otra persona retira usando tu código</li>
            <li>Podemos investigar casos de retiros no autorizados</li>
            <li>Recomendamos no compartir tu código de pedido</li>
          </ul>

          <h2>Contacto</h2>
          <p>
            Para dudas sobre tu envío o dificultades para llegar a nuestra ubicación:
          </p>
          <ul>
            <li><strong>Instagram:</strong> @brillarte.do.oficial</li>
            <li>Estaremos disponibles para ayudarte</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShippingPolicy;