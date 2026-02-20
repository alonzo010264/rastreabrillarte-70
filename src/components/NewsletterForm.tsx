import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isSubmitted) return;
    
    if (!email.trim()) {
      toast.error("Por favor ingresa tu correo electronico");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save subscriber to database
      const { error: dbError } = await supabase
        .from('suscriptores_newsletter')
        .insert({ correo: email.trim() });

      if (dbError && dbError.code !== '23505') {
        throw dbError;
      }

      // If already exists (23505), reactivate
      if (dbError?.code === '23505') {
        await supabase
          .from('suscriptores_newsletter')
          .update({ activo: true })
          .eq('correo', email.trim());
      }

      // Send welcome email
      const { error } = await supabase.functions.invoke('send-newsletter-subscription', {
        body: { correo: email }
      });

      if (error) throw error;

      toast.success("Suscrito exitosamente", {
        description: "Revisa tu correo para confirmar."
      });
      
      setIsSubmitted(true);
      setEmail("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al suscribirse. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com" 
        required 
        disabled={isSubmitting || isSubmitted}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 disabled:opacity-50" 
      />
      <button 
        type="submit" 
        disabled={isSubmitting || isSubmitted}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] btn-shine disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitted ? "Suscrito" : isSubmitting ? "Suscribiendo..." : "Suscribirse"}
      </button>
    </form>
  );
};

export default NewsletterForm;
