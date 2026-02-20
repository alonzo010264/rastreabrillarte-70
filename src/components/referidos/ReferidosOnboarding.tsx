import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowRight, Sun, Moon, Users, FileText } from "lucide-react";

interface Props {
  userId: string;
  onComplete: () => void;
}

const POLITICAS_REFERIDOS = [
  "Solo se permiten referidos reales. Cuentas falsas resultaran en la perdida de puntos.",
  "Los puntos se confirman unicamente despues de que el referido realice su primera compra.",
  "BRILLARTE se reserva el derecho de rechazar referidos sospechosos.",
  "Los puntos no son transferibles ni canjeables por dinero.",
  "El abuso del sistema puede resultar en suspension permanente de la cuenta de referidos.",
  "Los datos proporcionados seran usados unicamente para el programa de referidos.",
];

const ReferidosOnboarding = ({ userId, onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [comoConocio, setComoConocio] = useState("redes_sociales");
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!terminosAceptados) {
      toast.error("Debes aceptar los terminos para continuar");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("referidos_perfiles").insert({
      user_id: userId,
      como_conocio: comoConocio,
      codigo_amigo: codigoAmigo || null,
      tema_preferido: tema,
      terminos_aceptados: true,
      terminos_aceptados_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Error al guardar. Intenta de nuevo.");
      console.error(error);
    } else {
      toast.success("Bienvenido al programa de referidos");
      onComplete();
    }
    setLoading(false);
  };

  const bgClass = tema === "oscuro" ? "bg-neutral-950 text-white" : "bg-white text-neutral-950";
  const cardClass = tema === "oscuro" ? "bg-neutral-900 border-neutral-800 text-white" : "bg-card border text-card-foreground";
  const mutedClass = tema === "oscuro" ? "text-neutral-400" : "text-muted-foreground";

  return (
    <div className={`min-h-[60vh] py-10 px-4 transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${s === step ? "w-10 bg-foreground" : s < step ? "w-6 bg-foreground/50" : "w-6 bg-muted"}`}
              style={tema === "oscuro" ? { backgroundColor: s <= step ? "#fff" : "#333" } : undefined}
            />
          ))}
        </div>

        {/* Step 1: Survey */}
        {step === 1 && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Como conociste BRILLARTE?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={comoConocio} onValueChange={setComoConocio} className="space-y-3">
                {[
                  { value: "redes_sociales", label: "Redes sociales" },
                  { value: "amigo", label: "Por un amigo" },
                  { value: "publicidad", label: "Publicidad" },
                  { value: "buscador", label: "Buscando en internet" },
                  { value: "otro", label: "Otro" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-3">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value} className="cursor-pointer text-sm">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {comoConocio === "amigo" && (
                <div className="pt-2 space-y-2">
                  <Label className={`text-xs ${mutedClass}`}>Codigo de tu amigo (opcional)</Label>
                  <Input
                    placeholder="Ej: JUAN-1234"
                    value={codigoAmigo}
                    onChange={(e) => setCodigoAmigo(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
              )}

              <Button onClick={() => setStep(2)} className="w-full mt-4">
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">Elige tu tema</CardTitle>
              <p className={`text-sm ${mutedClass}`}>Selecciona como quieres ver tu pagina de referidos.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTema("claro")}
                  className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${tema === "claro" ? "border-foreground bg-white text-black" : "border-muted bg-muted/30"}`}
                  style={tema === "oscuro" ? { borderColor: "#444", backgroundColor: "#1a1a1a", color: "#999" } : undefined}
                >
                  <Sun className="h-8 w-8" />
                  <span className="text-sm font-medium">Claro</span>
                </button>
                <button
                  onClick={() => setTema("oscuro")}
                  className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${tema === "oscuro" ? "border-white bg-neutral-900 text-white" : "border-muted bg-muted/30"}`}
                >
                  <Moon className="h-8 w-8" />
                  <span className="text-sm font-medium">Oscuro</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atras</Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continuar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Terms */}
        {step === 3 && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> Politicas del Programa
              </CardTitle>
              <p className={`text-sm ${mutedClass}`}>Lee y acepta las politicas para continuar.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-lg border p-4 space-y-3 max-h-60 overflow-y-auto text-sm ${tema === "oscuro" ? "border-neutral-700 bg-neutral-800" : "bg-muted/30"}`}>
                {POLITICAS_REFERIDOS.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium mt-0.5 ${tema === "oscuro" ? "bg-white text-black" : "bg-foreground text-background"}`}>{i + 1}</span>
                    <p className={mutedClass}>{p}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terminos"
                  checked={terminosAceptados}
                  onCheckedChange={(v) => setTerminosAceptados(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terminos" className="text-sm cursor-pointer leading-snug">
                  He leido y acepto las politicas del programa de referidos de BRILLARTE.
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Atras</Button>
                <Button onClick={handleSubmit} disabled={!terminosAceptados || loading} className="flex-1">
                  {loading ? "Guardando..." : "Acceder al programa"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReferidosOnboarding;
