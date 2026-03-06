import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";

const TOTAL_STEPS = 8;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
};

const EmprendeBrillarteAplicar = () => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    donde_conocio: "",
    donde_conocio_otro: "",
    por_que_interesa: "",
    experiencia_venta: "",
    cantidad_productos: "",
    frecuencia_pedidos: "",
    mencionar_brillarte: "",
    recibir_promos: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const next = () => { setDirection(1); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const prev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return form.nombre.trim().length > 1 && form.correo.includes("@");
      case 1: return form.donde_conocio !== "" && (form.donde_conocio !== "otro" || form.donde_conocio_otro.trim().length > 0);
      case 2: return form.por_que_interesa.trim().length > 5;
      case 3: return form.experiencia_venta !== "";
      case 4: return form.cantidad_productos !== "";
      case 5: return form.frecuencia_pedidos !== "";
      case 6: return form.mencionar_brillarte !== "";
      case 7: return form.recibir_promos !== "";
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!canContinue()) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-emprende-application", {
        body: { ...form }
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error al enviar", description: "Intenta de nuevo más tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-foreground text-background flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-background text-foreground flex items-center justify-center mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Check className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-light mb-4">Solicitud Enviada</h1>
          <p className="text-xl opacity-70 mb-4">
            Gracias por tu interes en Brillarte Emprende, {form.nombre.split(" ")[0]}.
          </p>
          <p className="opacity-50 mb-8">
            Nuestro equipo revisará tu solicitud y te contactará pronto al correo <strong>{form.correo}</strong> para explicarte con detalles todo sobre el programa.
          </p>
          <Button asChild className="bg-background text-foreground hover:bg-background/90 rounded-full px-8">
            <Link to="/">Volver al Inicio</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-foreground text-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/emprende-brillarte" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </Link>
        <img src={brillarteLogo} alt="BRILLARTE" className="w-10 h-10 rounded-full" />
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-2">
        <div className="h-1 bg-background/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-background rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-sm opacity-40 mt-2 text-right">
          {step + 1} de {TOTAL_STEPS}
        </p>
      </div>

      {/* Form Steps */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">Cuéntanos sobre ti</h2>
                  <p className="opacity-50">Tu información básica de contacto</p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-background/70 mb-2 block">Nombre completo</Label>
                      <Input
                        value={form.nombre}
                        onChange={e => update("nombre", e.target.value)}
                        placeholder="Tu nombre completo"
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-background/70 mb-2 block">Correo electrónico</Label>
                      <Input
                        type="email"
                        value={form.correo}
                        onChange={e => update("correo", e.target.value)}
                        placeholder="tu@correo.com"
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-background/70 mb-2 block">Teléfono (opcional)</Label>
                      <Input
                        value={form.telefono}
                        onChange={e => update("telefono", e.target.value)}
                        placeholder="809-000-0000"
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Dónde nos conociste?</h2>
                  <p className="opacity-50">Selecciona una opción</p>
                  <RadioGroup value={form.donde_conocio} onValueChange={v => update("donde_conocio", v)} className="space-y-3">
                    {["Instagram", "Facebook", "WhatsApp", "Un amigo/familiar", "otro"].map(opt => (
                      <Label
                        key={opt}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.donde_conocio === opt ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt} className="border-background/50 text-background" />
                        <span className="capitalize">{opt === "otro" ? "Otro" : opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                  {form.donde_conocio === "otro" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <Input
                        value={form.donde_conocio_otro}
                        onChange={e => update("donde_conocio_otro", e.target.value)}
                        placeholder="Especifica dónde..."
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Por qué te interesa vender nuestros productos?</h2>
                  <p className="opacity-50">Cuéntanos tus motivaciones</p>
                  <Textarea
                    value={form.por_que_interesa}
                    onChange={e => update("por_que_interesa", e.target.value)}
                    placeholder="Quiero emprender porque..."
                    rows={5}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/30 resize-none"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Has vendido productos antes?</h2>
                  <p className="opacity-50">No es necesario tener experiencia</p>
                  <RadioGroup value={form.experiencia_venta} onValueChange={v => update("experiencia_venta", v)} className="space-y-3">
                    {[{ v: "si", l: "Sí" }, { v: "no", l: "No" }].map(opt => (
                      <Label
                        key={opt.v}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.experiencia_venta === opt.v ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.v} className="border-background/50 text-background" />
                        <span>{opt.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Cuántos productos te gustaría comprar por pedido?</h2>
                  <p className="opacity-50">Cantidad aproximada</p>
                  <RadioGroup value={form.cantidad_productos} onValueChange={v => update("cantidad_productos", v)} className="space-y-3">
                    {["5 a 10", "10 a 20", "20 o más"].map(opt => (
                      <Label
                        key={opt}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.cantidad_productos === opt ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt} className="border-background/50 text-background" />
                        <span>{opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Cada cuánto tiempo harías pedidos?</h2>
                  <p className="opacity-50">Tu frecuencia estimada</p>
                  <RadioGroup value={form.frecuencia_pedidos} onValueChange={v => update("frecuencia_pedidos", v)} className="space-y-3">
                    {["Semanal", "Cada 15 días", "Mensual"].map(opt => (
                      <Label
                        key={opt}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.frecuencia_pedidos === opt ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt} className="border-background/50 text-background" />
                        <span>{opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Mencionarías que los productos son de Brillarte al vender?</h2>
                  <p className="opacity-50">Esto nos ayuda a crecer juntos</p>
                  <RadioGroup value={form.mencionar_brillarte} onValueChange={v => update("mencionar_brillarte", v)} className="space-y-3">
                    {[{ v: "si", l: "Sí" }, { v: "no", l: "No" }].map(opt => (
                      <Label
                        key={opt.v}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.mencionar_brillarte === opt.v ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.v} className="border-background/50 text-background" />
                        <span>{opt.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-light">¿Te gustaría recibir promociones o combos especiales para revendedores?</h2>
                  <p className="opacity-50">Última pregunta</p>
                  <RadioGroup value={form.recibir_promos} onValueChange={v => update("recibir_promos", v)} className="space-y-3">
                    {[{ v: "si", l: "Sí" }].map(opt => (
                      <Label
                        key={opt.v}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          form.recibir_promos === opt.v ? "border-background bg-background/10" : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.v} className="border-background/50 text-background" />
                        <span>{opt.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 0}
          className="text-background/60 hover:text-background hover:bg-background/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Anterior
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={next}
            disabled={!canContinue()}
            className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 disabled:opacity-30"
          >
            Siguiente
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canContinue() || loading}
            className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 disabled:opacity-30"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            Enviar Solicitud
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmprendeBrillarteAplicar;
