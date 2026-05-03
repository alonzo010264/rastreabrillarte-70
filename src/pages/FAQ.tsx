import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Diamond, HelpCircle, Package, Truck, CreditCard, Shield } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      category: "Pedidos",
      icon: Package,
      questions: [
        {
          question: "¿Cómo puedo realizar un pedido?",
          answer: "Pronto tendrás disponible nuestro catálogo online donde podrás seleccionar tus productos favoritos. Mientras tanto, puedes contactarnos directamente para realizar tu pedido personalizado."
        },
        {
          question: "¿Puedo modificar mi pedido después de realizarlo?",
          answer: "Sí, puedes solicitar cambios en tu pedido mientras esté en proceso de preparación. Usa nuestro sistema de rastreo de pedidos para solicitar modificaciones o contacta nuestro equipo de soporte."
        },
        {
          question: "¿Cómo puedo rastrear mi pedido?",
          answer: "Utiliza nuestro sistema de rastreo de pedidos en la sección 'Rastrear Pedidos'. Solo necesitas tu código de pedido y podrás ver el estado actual de tu compra en tiempo real."
        }
      ]
    },
    {
      category: "Envíos",
      icon: Truck,
      questions: [
        {
          question: "¿Cuánto tiempo tarda en llegar mi pedido?",
          answer: "Los tiempos de entrega varían según tu ubicación y el tipo de producto. Generalmente, nuestros envíos tardan entre 3-7 días hábiles. Te notificaremos sobre el tiempo estimado al confirmar tu pedido."
        },
        {
          question: "¿Puedo cambiar la dirección de envío?",
          answer: "Sí, puedes solicitar un cambio de dirección mientras tu pedido no haya sido despachado. Usa el formulario de cambio de dirección en nuestro sistema de rastreo o contacta directamente a nuestro equipo."
        },
        {
          question: "¿Realizan envíos a todo el país?",
          answer: "Sí, realizamos envíos a nivel nacional. Los costos de envío varían según la distancia y el peso del pedido. Te proporcionaremos esta información antes de confirmar tu compra."
        }
      ]
    },
    {
      category: "Productos",
      icon: Diamond,
      questions: [
        {
          question: "¿Qué tipo de productos ofrecen?",
          answer: "Ofrecemos una amplia gama de accesorios de calidad incluyendo pulseras, aretes, monederos y otros productos únicos. Todos nuestros productos son seleccionados cuidadosamente para garantizar la mejor calidad."
        },
        {
          question: "¿Los productos tienen garantía?",
          answer: "Sí, todos nuestros productos cuentan con garantía de calidad. Si tienes algún problema con tu compra, contactanos y encontraremos la mejor solución para ti."
        },
        {
          question: "¿Puedo solicitar productos personalizados?",
          answer: "¡Por supuesto! Nos especializamos en crear productos únicos. Contactanos para discutir tus ideas y crear algo especial que refleje tu personalidad."
        }
      ]
    },
    {
      category: "Pagos",
      icon: CreditCard,
      questions: [
        {
          question: "¿Qué métodos de pago aceptan?",
          answer: "Aceptamos transferencia bancaria y pago contra entrega (en algunos casos). Estos son nuestros métodos de pago disponibles de momento."
        },
        {
          question: "¿Puedo pagar en cuotas?",
          answer: "Sí, ofrecemos planes de pago flexibles. Por ejemplo, puedes depositar la mitad ahora y la otra mitad después. Dependiendo del monto, podemos acordar 5 cuotas o más. Contactanos para conocer las opciones disponibles para tu pedido."
        }
      ]
    },
    {
      category: "Soporte",
      icon: Shield,
      questions: [
        {
          question: "¿Cómo puedo contactar atención al cliente?",
          answer: "Puedes contactarnos a través de múltiples canales: nuestro formulario de contacto, email, WhatsApp o redes sociales. Nuestro equipo está disponible para ayudarte en horarios de atención comercial."
        },
        {
          question: "¿Qué hago si tengo un problema con mi pedido?",
          answer: "Si tienes algún problema, no te preocupes. Contacta inmediatamente a nuestro equipo de soporte con tu código de pedido y descripción del problema. Resolveremos cualquier inconveniente rápidamente."
        },
        {
          question: "¿Puedo devolver un producto?",
          answer: "Sí, aceptamos devoluciones en caso de productos defectuosos o si no cumple con tus expectativas. Contactanos dentro de los primeros días de recibir tu pedido para iniciar el proceso."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Preguntas Frecuentes" subtitle="Encuentra respuestas a tus dudas" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={category.category} className="animate-fade-in" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
                <div className="flex items-center gap-3 mb-6">
                  <category.icon className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-light text-foreground">{category.category}</h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, questionIndex) => (
                    <AccordionItem key={questionIndex} value={`${category.category}-${questionIndex}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center animate-fade-in">
            <p className="text-muted-foreground">
              ¿No encuentras tu respuesta? Contáctanos a través de nuestros canales oficiales.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;