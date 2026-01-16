import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CreditCard, ShoppingBag, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GuiaCodigosPago = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary text-primary-foreground">Guía de Compra</Badge>
            <h1 className="text-4xl font-bold mb-4">¿Cómo obtener un Código de Pago?</h1>
            <p className="text-muted-foreground text-lg">
              Los códigos de pago te permiten realizar compras en Brillarte Shop de manera rápida y segura
            </p>
          </div>

          <div className="space-y-6">
            {/* Paso 1 */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Paso 1: Contacta a nuestros agentes</CardTitle>
                    <CardDescription>Comunícate con un agente de BRILLARTE</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Puedes contactarnos a través de:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    WhatsApp: 849-425-2220
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Instagram: @brillarte.do
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Email: brillarte.oficial.ventas@gmail.com
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Paso 2 */}
            <Card className="border-l-4 border-l-secondary">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Paso 2: Realiza tu pago</CardTitle>
                    <CardDescription>Paga el monto de tu pedido</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Una vez que confirmes los productos que deseas, realiza el pago mediante:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Transferencia bancaria
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Depósito en efectivo
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Envía el comprobante de pago a nuestro agente.
                </p>
              </CardContent>
            </Card>

            {/* Paso 3 */}
            <Card className="border-l-4 border-l-muted-foreground">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Paso 3: Recibe tu código</CardTitle>
                    <CardDescription>Te enviaremos tu código único</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Una vez confirmado el pago, recibirás un código de 10 caracteres como:
                </p>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <code className="text-2xl font-mono font-bold tracking-wider">ABCD-EFGH-12</code>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Este código es único y solo puede usarse una vez.
                </p>
              </CardContent>
            </Card>

            {/* Paso 4 */}
            <Card className="border-l-4 border-l-foreground">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Paso 4: Completa tu compra</CardTitle>
                    <CardDescription>Usa tu código en Brillarte Shop</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  En Brillarte Shop, agrega los productos a tu carrito y al pagar, ingresa tu código. 
                  ¡Tu pedido se procesará automáticamente!
                </p>
                <Link to="/productos">
                  <Button className="w-full">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Ir a Brillarte Shop
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Beneficios */}
            <Card className="bg-muted border-none">
              <CardHeader>
                <CardTitle className="text-center">¿Por qué usar Códigos de Pago?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Rápido</h4>
                    <p className="text-sm text-muted-foreground">Compra sin llenar formularios de pago</p>
                  </div>
                  <div className="text-center p-4">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Seguro</h4>
                    <p className="text-sm text-muted-foreground">Códigos únicos y verificados</p>
                  </div>
                  <div className="text-center p-4">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Simple</h4>
                    <p className="text-sm text-muted-foreground">Solo ingresa tu código y listo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GuiaCodigosPago;