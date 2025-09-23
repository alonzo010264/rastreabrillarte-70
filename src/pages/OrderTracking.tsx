
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import AttentionHours from "@/components/AttentionHours";
import OrderTracker from "@/components/OrderTracker";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { Diamond } from "lucide-react";

const OrderTracking = () => {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Navigation />
      
      {/* Decorative diamonds */}
      <div className="absolute inset-0 pointer-events-none">
        <Diamond className="absolute top-20 left-10 text-gray-200 w-16 h-16 rotate-45 opacity-30" />
        <Diamond className="absolute top-40 right-20 text-gray-200 w-12 h-12 rotate-12 opacity-20" />
        <Diamond className="absolute bottom-60 left-20 text-gray-200 w-20 h-20 -rotate-12 opacity-25" />
        <Diamond className="absolute bottom-20 right-10 text-gray-200 w-14 h-14 rotate-45 opacity-30" />
        <Diamond className="absolute top-60 left-1/2 text-gray-200 w-10 h-10 rotate-45 opacity-15" />
        <Diamond className="absolute bottom-40 right-1/3 text-gray-200 w-8 h-8 rotate-12 opacity-20" />
      </div>
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <div className="animate-fade-in space-y-12">
          {/* Rastreador de pedidos */}
          <section>
            <OrderTracker />
          </section>

          {/* Formulario de contacto */}
          <section className="max-w-2xl mx-auto">
            <ContactForm />
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
