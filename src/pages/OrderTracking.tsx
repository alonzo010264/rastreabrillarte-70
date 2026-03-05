
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import AttentionHours from "@/components/AttentionHours";
import OrderTracker from "@/components/OrderTracker";
import Footer from "@/components/Footer";

const OrderTracking = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />
      
      <Header title="Rastreo de Pedidos" subtitle="Consulta el estado de tu pedido" />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <div className="animate-fade-in space-y-12">
          {/* Rastreador de pedidos */}
          <section>
            <OrderTracker />
          </section>

          {/* Horarios de atención */}
          <section>
            <AttentionHours />
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderTracking;
