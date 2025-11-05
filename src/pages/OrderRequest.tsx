import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Truck, Store, Diamond, MapPin, Phone, Mail, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const orderSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  correo: z.string().email("Ingrese un correo válido"),
  telefono: z.string().min(10, "Ingrese un número de teléfono válido").optional(),
  tipo_servicio: z.enum(["retiro", "envio"], {
    required_error: "Seleccione el tipo de servicio",
  }),
  descripcion_articulo: z.string().min(10, "Describa el artículo que busca (mínimo 10 caracteres)"),
  direccion: z.string().optional(),
  referencias: z.string().optional(),
  numero_casa: z.string().optional(),
  sector: z.string().optional(),
  provincia: z.string().optional(),
}).refine((data) => {
  if (data.tipo_servicio === "envio") {
    return data.direccion && data.numero_casa && data.sector && data.provincia && data.telefono;
  }
  return true;
}, {
  message: "Para envío, complete todos los campos de dirección y teléfono",
  path: ["direccion"],
});

type OrderFormData = z.infer<typeof orderSchema>;

const OrderRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      tipo_servicio: "retiro",
    },
  });

  const watchedTipoServicio = form.watch("tipo_servicio");

  const generateOrderCode = () => {
    const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `B01-${randomNumber}`;
  };

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      // Generar código único
      let orderCode = generateOrderCode();
      
      // Verificar que el código no exista
      let { data: existingOrder } = await supabase
        .from("Pedidos")
        .select("Código de pedido")
        .eq("Código de pedido", orderCode)
        .single();
      
      // Si existe, generar uno nuevo
      while (existingOrder) {
        orderCode = generateOrderCode();
        const { data: checkExisting } = await supabase
          .from("Pedidos")
          .select("Código de pedido")
          .eq("Código de pedido", orderCode)
          .single();
        existingOrder = checkExisting;
      }

      // Guardar en pedidos_formulario
      const formData = {
        nombre: data.nombre,
        apellido: data.nombre, // usando nombre como apellido si no hay apellido separado
        correo: data.correo,
        instagram: null,
        whatsapp: data.telefono || null,
        codigo_membresia: null
      };

      const { error: formError } = await supabase
        .from("pedidos_formulario")
        .insert([formData]);

      if (formError) throw formError;

      // Crear pedido en la tabla principal
      const { error: orderError } = await supabase
        .from("Pedidos")
        .insert([{
          "Código de pedido": orderCode,
          "Cliente": data.nombre,
          "correo_cliente": data.correo,
          "Precio": 0,
          "Peso": 0,
          "Total": 0,
          "Fecha_estimada_entrega": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días por defecto
          "Estatus_id": 1, // Primer estatus
          "Notas": `Tipo de servicio: ${data.tipo_servicio}. Descripción: ${data.descripcion_articulo}${data.direccion ? `. Dirección: ${data.direccion}` : ''}`
        }]);

      if (orderError) throw orderError;

      // Enviar correo de confirmación según el tipo de servicio
      try {
        const emailBody: any = {
          nombre: data.nombre,
          correo: data.correo,
          codigo_pedido: orderCode,
          tipo_servicio: data.tipo_servicio,
          descripcion: data.descripcion_articulo
        };

        if (data.tipo_servicio === 'envio') {
          emailBody.direccion = data.direccion;
          emailBody.numero_casa = data.numero_casa;
          emailBody.sector = data.sector;
          emailBody.provincia = data.provincia;
          emailBody.referencias = data.referencias || '';
          emailBody.telefono = data.telefono;
        }

        const { error: emailError } = await supabase.functions.invoke('send-order-request-confirmation', {
          body: emailBody
        });

        if (emailError) {
          console.error("Error enviando correo:", emailError);
        }
      } catch (emailException) {
        console.error("Excepción enviando correo:", emailException);
      }

      toast({
        title: "¡Pedido enviado exitosamente!",
        description: `Tu código de pedido es: ${orderCode}. Revisa tu correo para más detalles.`,
      });

      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error al enviar el pedido",
        description: "Ocurrió un error. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-light text-foreground">Solicitar Pedido</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete el formulario para solicitar sus artículos de joyería. Elija entre retiro en tienda o envío a domicilio.
          </p>
        </div>

        {/* Información sobre servicios */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Retiro en Tienda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Gratis:</strong> Sin costo adicional</li>
                <li>• <strong>Rápido:</strong> Disponible al día siguiente</li>
                <li>• <strong>Seguro:</strong> Puede inspeccionar antes de llevar</li>
                <li>• <strong>Datos necesarios:</strong> Solo nombre, correo y descripción</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-secondary" />
                Envío a Domicilio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Conveniente:</strong> Reciba en su hogar</li>
                <li>• <strong>Pago previo:</strong> Debe depositar el precio</li>
                <li>• <strong>Seguro:</strong> Envío con protección</li>
                <li>• <strong>Información completa:</strong> Dirección y teléfono requeridos</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Diamond className="h-5 w-5 text-primary" />
              Datos del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información básica */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span>Nombre Completo</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Su nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="correo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>Correo Electrónico</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tipo de servicio */}
                <FormField
                  control={form.control}
                  name="tipo_servicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Servicio</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="retiro" id="retiro" />
                            <Label htmlFor="retiro" className="flex items-center gap-2 cursor-pointer">
                              <Store className="h-4 w-4" />
                              Retiro en Tienda
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="envio" id="envio" />
                            <Label htmlFor="envio" className="flex items-center gap-2 cursor-pointer">
                              <Truck className="h-4 w-4" />
                              Envío a Domicilio
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción del artículo */}
                <FormField
                  control={form.control}
                  name="descripcion_articulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Artículo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa detalladamente el artículo que busca (ej: anillo de oro 18k, cadena de plata, etc.)"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos adicionales para envío */}
                {watchedTipoServicio === "envio" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Información de Envío
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>Teléfono</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Número de teléfono para contacto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="direccion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Input placeholder="Calle principal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="numero_casa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Casa</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: 123, A-45" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sector"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sector</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del sector" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="provincia"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la provincia" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="referencias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referencias (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: Al lado de la casa roja, frente al parque, etc."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderRequest;