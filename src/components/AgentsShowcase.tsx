import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const agents = [
  {
    initial: "N",
    name: "Noah",
    role: "Atención al Cliente",
    desc: "Consultas generales, productos, envíos y dudas rápidas.",
    online: true,
  },
  {
    initial: "L",
    name: "Luis",
    role: "Soporte de Pedidos",
    desc: "Rastreo, cambios de dirección y estatus de tu pedido.",
    online: true,
  },
  {
    initial: "M",
    name: "Miranda",
    role: "Reembolsos y Verificación",
    desc: "Reclamos, reembolsos y verificación de cuentas.",
    online: true,
  },
];

const AgentsShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      <div ref={ref} className="container mx-auto max-w-5xl relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Disponibles 24/7
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4 font-display">
            Agentes <span className="font-script italic">Brillarte</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Nuestro equipo virtual está siempre disponible para acompañarte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <div
              key={agent.name}
              className={`relative group border border-foreground/10 rounded-2xl p-6 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center font-display text-2xl">
                    {agent.initial}
                  </div>
                  {agent.online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-xl text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{agent.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{agent.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                En línea ahora
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentsShowcase;
