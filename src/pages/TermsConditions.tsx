import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, Diamond } from "lucide-react";

const TermsConditions = () => {
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
          <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-light text-foreground mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-muted-foreground text-lg">
            Condiciones de uso de los servicios de BRILLARTE
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2>Aceptación de Términos</h2>
          <p>
            Al utilizar nuestros servicios y realizar pedidos en BRILLARTE, 
            aceptas estos términos y condiciones en su totalidad.
          </p>

          <h2>Productos y Servicios</h2>
          <h3>Calidad</h3>
          <ul>
            <li>Todos nuestros productos pasan por control de calidad</li>
            <li>Garantizamos la autenticidad de nuestros productos</li>
            <li>Las imágenes son representativas, pueden existir variaciones menores</li>
          </ul>

          <h3>Disponibilidad</h3>
          <ul>
            <li>Los productos están sujetos a disponibilidad</li>
            <li>Nos reservamos el derecho de actualizar precios</li>
            <li>Te notificaremos sobre cambios que afecten tu pedido</li>
          </ul>

          <h2>Pedidos y Pagos</h2>
          <h3>Proceso de Pedido</h3>
          <ul>
            <li>Los pedidos se confirman tras verificación de pago</li>
            <li>Recibirás un código de pedido para seguimiento</li>
            <li>Los tiempos de entrega son estimados</li>
          </ul>

          <h3>Responsabilidades del Cliente</h3>
          <ul>
            <li>Proporcionar información correcta y completa</li>
            <li>Mantener confidencial el código de pedido</li>
            <li>Verificar productos al momento del retiro</li>
          </ul>

          <h2>Retiros y Entregas</h2>
          <h3>Retiro en Tienda</h3>
          <ul>
            <li>Ubicación: Cerro Alto, Barrio Las Mercedes, Calle Primera</li>
            <li>Presentar código de pedido válido</li>
            <li>No somos responsables por retiros no autorizados con códigos compartidos</li>
            <li>Podemos investigar casos sospechosos</li>
          </ul>

          <h2>Garantías</h2>
          <ul>
            <li>Garantía de satisfacción en productos sin daños</li>
            <li>Reclamos deben realizarse al momento del retiro</li>
            <li>Productos personalizados no admiten cambios</li>
          </ul>

          <h2>Limitación de Responsabilidad</h2>
          <p>
            BRILLARTE no será responsable por daños indirectos, incidentales 
            o consecuentes derivados del uso de nuestros productos o servicios.
          </p>

          <h2>Privacidad</h2>
          <p>
            Tu información personal se maneja según nuestras Políticas de Privacidad.
          </p>

          <h2>Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos. 
            Los cambios serán efectivos al publicarse en nuestro sitio web.
          </p>

          <h2>Contacto</h2>
          <p>
            Para preguntas sobre estos términos, contacta con nosotros a través 
            de nuestros canales oficiales.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsConditions;