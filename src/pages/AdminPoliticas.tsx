import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, FileText, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Aceptacion {
  id: string;
  user_id: string;
  tipo_politica: string;
  accion: string;
  created_at: string;
  profile?: {
    nombre_completo: string;
    correo: string;
  };
}

interface Stats {
  total_visualizaciones: number;
  total_aceptaciones: number;
  por_tipo: {
    [key: string]: { visualizado: number; aceptado: number };
  };
}

const AdminPoliticas = () => {
  const [aceptaciones, setAceptaciones] = useState<Aceptacion[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_visualizaciones: 0,
    total_aceptaciones: 0,
    por_tipo: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        navigate("/");
        return;
      }

      fetchData();
    };

    checkAdmin();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all acceptances with profile info
    const { data: aceptacionesData } = await supabase
      .from("aceptaciones_politicas")
      .select("*")
      .order("created_at", { ascending: false });

    if (aceptacionesData) {
      // Get unique user IDs
      const userIds = [...new Set(aceptacionesData.map(a => a.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nombre_completo, correo")
        .in("user_id", userIds);

      // Map profiles to acceptances
      const aceptacionesWithProfiles = aceptacionesData.map(a => ({
        ...a,
        profile: profiles?.find(p => p.user_id === a.user_id)
      }));

      setAceptaciones(aceptacionesWithProfiles);

      // Calculate stats
      const statsData: Stats = {
        total_visualizaciones: 0,
        total_aceptaciones: 0,
        por_tipo: {}
      };

      aceptacionesData.forEach(a => {
        if (!statsData.por_tipo[a.tipo_politica]) {
          statsData.por_tipo[a.tipo_politica] = { visualizado: 0, aceptado: 0 };
        }

        if (a.accion === "visualizado") {
          statsData.total_visualizaciones++;
          statsData.por_tipo[a.tipo_politica].visualizado++;
        } else if (a.accion === "aceptado") {
          statsData.total_aceptaciones++;
          statsData.por_tipo[a.tipo_politica].aceptado++;
        }
      });

      setStats(statsData);
    }

    setLoading(false);
  };

  const filteredAceptaciones = selectedType === "all" 
    ? aceptaciones 
    : aceptaciones.filter(a => a.tipo_politica === selectedType);

  const getPolicyLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      privacidad: "Privacidad",
      envio: "Envio",
      reembolso: "Reembolso",
      terminos: "Terminos"
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Gestion de Politicas" subtitle="Visualizaciones y aceptaciones" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Visualizaciones</p>
                  <p className="text-2xl font-bold">{stats.total_visualizaciones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Aceptaciones</p>
                  <p className="text-2xl font-bold">{stats.total_aceptaciones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios Unicos</p>
                  <p className="text-2xl font-bold">
                    {new Set(aceptaciones.map(a => a.user_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Aceptacion</p>
                  <p className="text-2xl font-bold">
                    {stats.total_visualizaciones > 0 
                      ? Math.round((stats.total_aceptaciones / stats.total_visualizaciones) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats by Policy Type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats.por_tipo).map(([tipo, data]) => (
            <Card key={tipo}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{getPolicyLabel(tipo)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {data.visualizado}
                  </span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {data.aceptado}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setSelectedType}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="privacidad">Privacidad</TabsTrigger>
                <TabsTrigger value="envio">Envio</TabsTrigger>
                <TabsTrigger value="reembolso">Reembolso</TabsTrigger>
                <TabsTrigger value="terminos">Terminos</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedType}>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : filteredAceptaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay registros
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Politica</TableHead>
                          <TableHead>Accion</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAceptaciones.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.profile?.nombre_completo || "Usuario"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.profile?.correo || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getPolicyLabel(a.tipo_politica)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {a.accion === "visualizado" ? (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Eye className="w-3 h-3" /> Visualizado
                                </Badge>
                              ) : (
                                <Badge className="flex items-center gap-1 w-fit bg-green-600">
                                  <CheckCircle className="w-3 h-3" /> Aceptado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(a.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPoliticas;
