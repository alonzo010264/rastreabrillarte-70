import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Sparkles, Star, ArrowRight, Package } from "lucide-react";
import { useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const categorias = [
  { icon: Heart, nombre: "Amor", desc: "Pulseras y accesorios perfectos para expresar cariño a esa persona especial." },
  { icon: Star, nombre: "Amistad", desc: "Detalles únicos para celebrar esa conexión que brilla con fuerza." },
  { icon: Sparkles, nombre: "Cumpleaños", desc: "Sorprende con piezas que se conviertan en el regalo favorito." },
  { icon: Gift, nombre: "Ocasiones Especiales", desc: "Graduaciones, aniversarios y momentos que merecen brillar." },
  { icon: Package, nombre: "Combos de Regalo", desc: "Sets curados listos para regalar, con empaque especial incluido." },
  { icon: Heart, nombre: "Personalización", desc: "Agrega iniciales, colores o mensajes para un toque único." },
];

const razones = [
  { num: "01", titulo: "Hechos con Amor", desc: "Cada pieza es elaborada con dedicación y materiales de calidad que duran." },
  { num: "02", titulo: "Para Todo Estilo", desc: "Desde lo clásico hasta lo trendy, tenemos accesorios para cada personalidad." },
  { num: "03", titulo: "Empaque de Regalo", desc: "Presentación especial lista para entregar. Solo abre y regala." },
  { num: "04", titulo: "Precios Accesibles", desc: "Regalos que impresionan sin afectar tu presupuesto." },
];

const BrillarteRegalos = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      {/* Hero con parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 bg-foreground text-background overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-background/10 rounded-full"
              style={{
                width: 80 + i * 60,
                height: 80 + i * 60,
                top: `${15 + i * 12}%`,
                left: `${10 + (i % 3) * 30}%`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 mx-auto mb-8 rounded-full bg-background/10 flex items-center justify-center"
          >
            <Gift className="w-10 h-10" />
          </motion.div>

          <motion.p
            className="text-sm tracking-[0.4em] uppercase opacity-50 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Brillarte presenta
          </motion.p>

          <motion.h1
            className="text-5xl md:text-8xl font-extralight tracking-tight mb-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            REGALOS
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl font-light opacity-70 mb-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            Accesorios que hacen brillar a quien los recibe
          </motion.p>

          <motion.p
            className="text-base opacity-40 max-w-xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            Descubre nuestra colección de pulseras, aretes y accesorios
            pensados para convertirse en el regalo perfecto para cualquier
            ocasión.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              asChild
              className="text-lg px-10 py-6 bg-background text-foreground hover:bg-background/90 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Link to="/productos" className="flex items-center gap-3">
                Ver Colección
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.3 }}
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

      {/* Categorías */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Categorías</p>
            <h2 className="text-4xl md:text-6xl font-extralight">
              Encuentra el Regalo <span className="font-semibold">Ideal</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categorias.map((cat, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group p-8 rounded-3xl border border-border bg-card hover:border-foreground/30 transition-all duration-500 hover:shadow-2xl cursor-pointer"
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                >
                  <cat.icon className="w-7 h-7" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 group-hover:tracking-wide transition-all duration-300">{cat.nombre}</h3>
                <p className="text-muted-foreground leading-relaxed">{cat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Por qué regalar Brillarte */}
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
            <p className="text-sm tracking-[0.3em] uppercase opacity-40 mb-4">La diferencia</p>
            <h2 className="text-4xl md:text-6xl font-extralight">
              ¿Por qué Regalar <span className="font-semibold">Brillarte</span>?
            </h2>
          </motion.div>

          <div className="space-y-16">
            {razones.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-8 group"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <motion.span
                  className="text-6xl md:text-7xl font-bold opacity-10 group-hover:opacity-30 transition-opacity duration-700 min-w-[100px] select-none"
                  whileHover={{ scale: 1.1 }}
                >
                  {r.num}
                </motion.span>
                <div>
                  <h3 className="text-2xl md:text-3xl font-semibold mb-3 group-hover:tracking-wide transition-all duration-300">{r.titulo}</h3>
                  <p className="text-background/60 text-lg leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner interactivo */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="relative p-12 md:p-20 rounded-3xl border border-border overflow-hidden group hover:border-foreground/20 transition-all duration-700"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-foreground/[0.06] group-hover:from-foreground/[0.04] group-hover:to-foreground/[0.08] transition-all duration-700" />
            
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-8"
              >
                <Gift className="w-16 h-16 text-foreground/60" />
              </motion.div>
              <h3 className="text-3xl md:text-5xl font-extralight mb-4">
                Cada accesorio cuenta una <span className="font-semibold">historia</span>
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Nuestros productos están diseñados para que quien los use se sienta especial.
                Regalar Brillarte es regalar confianza, estilo y amor.
              </p>
              <Button
                size="lg"
                asChild
                className="text-lg px-10 py-6 rounded-full hover:scale-105 transition-all duration-300"
              >
                <Link to="/productos" className="flex items-center gap-3">
                  Explorar Accesorios
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA final */}
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
            Haz que <span className="font-semibold">Brillen</span>
          </motion.h2>
          <motion.p
            className="text-xl opacity-60 mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            Encuentra el regalo perfecto en nuestra tienda.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
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
              <Link to="/productos" className="flex items-center gap-3">
                Ver Productos
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="text-lg px-10 py-6 border-background/30 text-background hover:bg-background/10 rounded-full transition-all duration-300"
            >
              <Link to="/contacto">Contactar</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrillarteRegalos;
