import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";

interface CartItem {
  id: string;
  producto_id: string;
  cantidad: number;
  color?: string;
  talla?: string;
  producto: {
    nombre: string;
    precio: number;
    imagenes?: string[];
    stock: number;
  };
}

interface WhatsAppCheckoutButtonProps {
  cartItems: CartItem[];
  total: number;
  onSuccess?: () => void;
}

export const WhatsAppCheckoutButton = ({ cartItems, total, onSuccess }: WhatsAppCheckoutButtonProps) => {
  const handleWhatsAppCheckout = () => {
    const phoneNumber = "8494252220";
    
    let message = "Hola BRILLARTE! Quiero realizar el siguiente pedido:\n\n";
    
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.producto.nombre}\n`;
      message += `   - Cantidad: ${item.cantidad}\n`;
      message += `   - Precio: RD$${item.producto.precio.toFixed(2)}\n`;
      if (item.color) message += `   - Color: ${item.color}\n`;
      if (item.talla) message += `   - Talla: ${item.talla}\n`;
      message += `   - Subtotal: RD$${(item.producto.precio * item.cantidad).toFixed(2)}\n\n`;
    });
    
    message += `-------------------\n`;
    message += `TOTAL: RD$${total.toFixed(2)}\n\n`;
    message += `Por favor confirmen disponibilidad y forma de pago.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Button
      onClick={handleWhatsAppCheckout}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold flex items-center justify-center gap-3"
      disabled={cartItems.length === 0}
    >
      <FaWhatsapp className="h-6 w-6" />
      Pedir por WhatsApp
    </Button>
  );
};
