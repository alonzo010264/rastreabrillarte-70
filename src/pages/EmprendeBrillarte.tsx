import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Handshake, Star, ChevronDown } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" }
  })
};

const EmprendeBrillarte = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 border border-background/20 rounded-full" />
          <div className="absolute bottom-20 right-10 w-96 h-96 border border-background/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-background/5 rounded-full" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.img
            src={brillarteLogo}
            alt="BRILLARTE"
            className="w-28 h-28 mx-auto mb-8 rounded-full shadow-2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.h1
            className="text-5xl md:text-7xl font-light tracking-wider mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            BRILLARTE <span className="font-bold">EMPRENDE</span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl font-light opacity-80 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Tu oportunidad de crecer con nosotros
          </motion.p>
          <motion.p
            className="text-lg opacity-60 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            En BRILLARTE creemos en las personas que quieren salir adelante.
            Compra nuestros productos al por mayor, revende con ganancias reales
            y construye tu propio negocio con el respaldo de una marca que crece contigo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <Button
              size="lg"
              asChild
              className="text-lg px-10 py-6 bg-background text-foreground hover:bg-background/90 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Link to="/emprende-brillarte/aplicar" className="flex items-center gap-3">
                Aplicar Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <ChevronDown className="w-8 h-8 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* What is Brillarte Emprende */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              ¿Qué es <span className="font-bold">Brillarte Emprende</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Es nuestro programa de alianzas para personas emprendedoras que desean
              generar ingresos vendiendo productos BRILLARTE. Tú compras al por mayor
              con precios especiales, revendes con ganancia y nosotros te apoyamos en
              cada paso del camino.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Ganancias Reales",
                desc: "Compra a precios de mayoreo y establece tu margen de ganancia. Tú decides cuánto quieres ganar."
              },
              {
                icon: Handshake,
                title: "Alianza con BRILLARTE",
                desc: "No estás solo/a. Contarás con el respaldo de nuestra marca, promociones exclusivas y combos especiales."
              },
              {
                icon: Users,
                title: "Para Todo Tipo de Persona",
                desc: "No necesitas experiencia previa. Si tienes ganas de emprender y crecer, este programa es para ti."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl group"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
              >
                <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            className="text-4xl md:text-5xl font-light text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            ¿Cómo <span className="font-bold">Funciona</span>?
          </motion.h2>

          <div className="space-y-12">
            {[
              { step: "01", title: "Aplica", desc: "Llena el formulario de solicitud con tus datos. Es rápido y sencillo." },
              { step: "02", title: "Te Contactamos", desc: "Nuestro equipo revisará tu solicitud y se comunicará contigo para explicarte todos los detalles." },
              { step: "03", title: "Compra al Mayor", desc: "Accede a precios especiales de mayoreo y elige los productos que más se vendan en tu zona." },
              { step: "04", title: "Vende y Gana", desc: "Revende los productos con tu margen de ganancia. Tú decides tu precio y tu ritmo." }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-6 group"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <div className="text-5xl font-bold opacity-20 group-hover:opacity-50 transition-opacity min-w-[80px]">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-background/70 text-lg">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-light mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            Beneficios de Ser <span className="font-bold">Aliado</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "Precios especiales de mayoreo",
              "Promociones y combos exclusivos",
              "Soporte y asesoría personalizada",
              "Materiales de venta y contenido",
              "Sin inversión mínima obligatoria",
              "Flexibilidad total en tus horarios"
            ].map((benefit, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-lg text-left"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.5}
              >
                <Star className="w-5 h-5 text-foreground shrink-0" />
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-light mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            ¿Listo/a para <span className="font-bold">Emprender</span>?
          </motion.h2>
          <motion.p
            className="text-xl opacity-70 mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            Todo tipo de persona puede aplicar. Da el primer paso hoy.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
          >
            <Button
              size="lg"
              asChild
              className="text-lg px-10 py-6 bg-background text-foreground hover:bg-background/90 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Link to="/emprende-brillarte/aplicar" className="flex items-center gap-3">
                Hacer Solicitud
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EmprendeBrillarte;
