import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Handshake, Star, ChevronDown, Zap, Shield, Clock } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";
import { useRef, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" as const }
  })
};

const EmprendeBrillarte = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);


  const cards = [
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
  ];

  const steps = [
    { step: "01", title: "Aplica", desc: "Llena el formulario de solicitud con tus datos. Es rápido y sencillo.", icon: Zap },
    { step: "02", title: "Te Contactamos", desc: "Nuestro equipo revisará tu solicitud y se comunicará contigo para explicarte todos los detalles.", icon: Shield },
    { step: "03", title: "Compra al Mayor", desc: "Accede a precios especiales de mayoreo y elige los productos que más se vendan en tu zona.", icon: TrendingUp },
    { step: "04", title: "Vende y Gana", desc: "Revende los productos con tu margen de ganancia. Tú decides tu precio y tu ritmo.", icon: Clock }
  ];

  const benefits = [
    "Precios especiales de mayoreo",
    "Promociones y combos exclusivos",
    "Soporte y asesoría personalizada",
    "Materiales de venta y contenido",
    "Sin inversión mínima obligatoria",
    "Flexibilidad total en tus horarios"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      {/* Hero con parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 bg-foreground text-background overflow-hidden">
        {/* Animated floating circles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-background/10 rounded-full"
              style={{
                width: 60 + i * 80,
                height: 60 + i * 80,
                top: `${10 + (i * 11) % 80}%`,
                left: `${5 + (i * 17) % 85}%`,
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.03, 0.12, 0.03],
                rotate: [0, 180],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.7,
              }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto max-w-4xl text-center relative z-10">
            Programa de alianzas
          </motion.p>

          <motion.h1
            className="text-5xl md:text-8xl font-extralight tracking-tight mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
          >
            BRILLARTE <span className="font-bold">EMPRENDE</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl font-light opacity-70 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Tu oportunidad de crecer con nosotros
          </motion.p>

          <motion.p
            className="text-base opacity-40 max-w-2xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
          >
            En BRILLARTE creemos en las personas que quieren salir adelante.
            Compra nuestros productos al por mayor, revende con ganancias reales
            y construye tu propio negocio con el respaldo de una marca que crece contigo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
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

          {/* Stats ticker */}
          <motion.div
            className="mt-16 flex justify-center gap-12 flex-wrap"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="text-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.p
                  className="text-3xl md:text-4xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 + i * 0.2 }}
                >
                  {s.num}
                </motion.p>
                <p className="text-sm opacity-50 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.8 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 mx-auto border-2 border-background/30 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1.5 h-1.5 bg-background/50 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* What is Brillarte Emprende */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">El programa</p>
            <h2 className="text-4xl md:text-6xl font-extralight mb-6">
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
            {cards.map((item, i) => (
              <motion.div
                key={i}
                className="relative p-8 rounded-3xl border border-border bg-card transition-all duration-500 hover:shadow-2xl cursor-pointer overflow-hidden group"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                onHoverStart={() => setHoveredCard(i)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ y: -8 }}
              >
                <motion.div
                  className="absolute inset-0 bg-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === i ? 0.03 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="relative z-10">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <item.icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:tracking-wide transition-all duration-300">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <p className="text-sm tracking-[0.3em] uppercase opacity-40 mb-4">Proceso</p>
            <h2 className="text-4xl md:text-6xl font-extralight">
              ¿Cómo <span className="font-bold">Funciona</span>?
            </h2>
          </motion.div>

          <div className="space-y-12">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-6 md:gap-8 group p-6 rounded-2xl hover:bg-background/5 transition-all duration-500"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                whileHover={{ x: 10 }}
              >
                <motion.div
                  className="flex-shrink-0 w-16 h-16 rounded-2xl bg-background/10 flex items-center justify-center group-hover:bg-background/20 transition-all duration-500"
                  whileHover={{ scale: 1.1 }}
                >
                  <item.icon className="w-7 h-7" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm opacity-30 font-mono">{item.step}</span>
                    <h3 className="text-2xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-background/60 text-lg">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            className="mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Ventajas</p>
            <h2 className="text-4xl md:text-6xl font-extralight">
              Beneficios de Ser <span className="font-bold">Aliado</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-6 rounded-2xl border border-border hover:border-foreground/20 transition-all duration-500 text-left group cursor-pointer"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.3}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                >
                  <Star className="w-5 h-5" />
                </motion.div>
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h2
            className="text-4xl md:text-6xl font-extralight mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            ¿Listo/a para <span className="font-bold">Emprender</span>?
          </motion.h2>
          <motion.p
            className="text-xl opacity-60 mb-12"
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
