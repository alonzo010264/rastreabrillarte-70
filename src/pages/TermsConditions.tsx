import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Términos y Condiciones" subtitle="Condiciones de uso de los servicios" />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* Aceptación */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Aceptación de Términos</h2>
            <p className="text-sm text-muted-foreground">
              Al utilizar nuestros servicios y realizar pedidos en BRILLARTE, 
              aceptas estos términos y condiciones en su totalidad.
            </p>
          </section>

          {/* Productos */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Productos y Servicios</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Calidad</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Todos nuestros productos pasan por control de calidad</li>
                  <li>Garantizamos la autenticidad de nuestros productos</li>
                  <li>Las imágenes son representativas, pueden existir variaciones menores</li>
                </ul>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Disponibilidad</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Los productos están sujetos a disponibilidad</li>
                  <li>Nos reservamos el derecho de actualizar precios</li>
                  <li>Te notificaremos sobre cambios que afecten tu pedido</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pedidos */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Pedidos y Pagos</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Proceso de Pedido</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Los pedidos se confirman tras verificación de pago</li>
                  <li>Recibirás un código de pedido para seguimiento</li>
                  <li>Los tiempos de entrega son estimados</li>
                </ul>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Responsabilidades del Cliente</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Proporcionar información correcta y completa</li>
                  <li>Mantener confidencial el código de pedido</li>
                  <li>Verificar productos al momento del retiro</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Retiros */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Retiros y Entregas</h2>
            
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2 text-foreground">Retiro en Tienda</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Ubicación: Cerro Alto, Barrio Las Mercedes, Calle Primera</li>
                <li>Presentar código de pedido válido</li>
                <li>No somos responsables por retiros no autorizados con códigos compartidos</li>
                <li>Podemos investigar casos sospechosos</li>
              </ul>
            </div>
          </section>

          {/* Garantías */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Garantías</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Garantía de satisfacción en productos sin daños</li>
              <li>Reclamos deben realizarse al momento del retiro</li>
              <li>Productos personalizados no admiten cambios</li>
            </ul>
          </section>

          {/* Limitación */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Limitación de Responsabilidad</h2>
            <p className="text-sm text-muted-foreground">
              BRILLARTE no será responsable por daños indirectos, incidentales 
              o consecuentes derivados del uso de nuestros productos o servicios.
            </p>
          </section>

          {/* Privacidad */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Privacidad</h2>
            <p className="text-sm text-muted-foreground">
              Tu información personal se maneja según nuestras Políticas de Privacidad.
            </p>
          </section>

          {/* Modificaciones */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Modificaciones</h2>
            <p className="text-sm text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos. 
              Los cambios serán efectivos al publicarse en nuestro sitio web.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-foreground/5 border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Contacto</h2>
            <p className="text-sm text-muted-foreground">
              Para preguntas sobre estos términos, contáctanos a través 
              de nuestros canales oficiales.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsConditions;