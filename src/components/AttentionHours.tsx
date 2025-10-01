

import { Clock, Instagram, MessageCircle, Phone, Truck, MapPin, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

const AttentionHours = () => {
  return (
    <div className="space-y-6">
      {/* Horarios de Atención */}
      <Card className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Clock className="text-gray-600 mr-3" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Horarios de Atención</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex flex-col space-y-1">
            <span className="font-medium text-gray-700 text-sm">Lunes a Viernes</span>
            <span className="text-gray-600 text-sm">7:00 AM - 6:00 PM</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-medium text-gray-700 text-sm">Sábados y Domingos</span>
            <span className="text-gray-600 text-sm">1:00 PM - 6:00 PM</span>
          </div>
        </div>
      </Card>

      {/* Envíos y Retiros */}
      <Card className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Truck className="text-gray-600 mr-3" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Envíos y Retiros</h3>
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p className="flex items-center">
            <Truck className="text-blue-500 mr-2" size={14} />
            <span><strong>Envíos desde $500 pesos dominicanos</strong> - El costo puede variar según la dirección</span>
          </p>
          <p className="flex items-center">
            <MapPin className="text-green-500 mr-2" size={14} />
            <span><strong>Retiro en tienda</strong> - Disponible en nuestra dirección</span>
          </p>
        </div>
      </Card>

      {/* Contacto */}
      <Card className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Phone className="text-gray-600 mr-3" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Contacto</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Instagram className="text-pink-500 mr-3" size={16} />
            <span className="text-sm text-gray-700">Instagram Oficial</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="text-green-500 mr-3" size={16} />
            <span className="text-sm text-gray-700">WhatsApp: 849-425-2220</span>
          </div>
          <div className="flex items-center">
            <Mail className="text-blue-500 mr-3" size={16} />
            <span className="text-sm text-gray-700">brillarte.oficial.ventas@gmail.com</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Puedes consultar el estatus por estos medios
          </p>
        </div>
      </Card>

      {/* Importante */}
      <Card className="bg-red-50 rounded-2xl shadow-sm p-6 border border-red-100 hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-medium text-red-700 mb-3">⚠️ Importante</h3>
        <p className="text-sm text-red-600">
          <strong>Nunca compartas</strong> tu código de pedido con otras personas por tu seguridad.
        </p>
      </Card>
    </div>
  );
};

export default AttentionHours;

