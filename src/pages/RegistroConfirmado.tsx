import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Mail } from "lucide-react";

const RegistroConfirmado = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white border-2 border-black rounded-2xl p-12 text-center">
          <CheckCircle className="mx-auto mb-6 text-black" size={80} />
          
          <h1 className="text-4xl font-bold text-black mb-4">¡Gracias por Registrarte!</h1>
          
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
            <Mail className="mx-auto mb-3 text-black" size={40} />
            <p className="text-lg text-gray-800 font-medium mb-2">
              Revisa tu correo electrónico
            </p>
            <p className="text-gray-600">
              Te hemos enviado tus datos de acceso a tu cuenta de BRILLARTE
            </p>
          </div>

          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-700">
              <strong className="text-black">Código de Membresía:</strong> Un código único comenzando con B-
            </p>
            <p className="text-sm text-gray-700">
              <strong className="text-black">Contraseña Temporal:</strong> Una contraseña generada automáticamente
            </p>
            <p className="text-sm text-gray-600 mt-4">
              Por favor, guarda estos datos en un lugar seguro. Los necesitarás para acceder a tu cuenta.
            </p>
          </div>

          <Button 
            onClick={() => navigate('/login')}
            className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-6 text-lg font-medium"
          >
            Ir a Iniciar Sesión
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default RegistroConfirmado;