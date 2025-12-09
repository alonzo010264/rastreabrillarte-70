import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailLog {
  id: string;
  destinatario: string;
  asunto: string;
  contenido: string;
  tipo: string;
  estado: string;
  created_at: string;
}

const AdminEmails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    checkAdminStatus();
    loadEmails();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = emails.filter(email =>
        email.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmails(filtered);
    } else {
      setFilteredEmails(emails);
    }
  }, [searchTerm, emails]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .single();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      toast.error('No tienes permisos de administrador');
      navigate('/');
    }
  };

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
      setFilteredEmails(data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Error al cargar emails');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'enviado':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'pendiente':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Registro de Correos Enviados</h1>
              <p className="text-muted-foreground">Historial completo de emails enviados por el sistema</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Búsqueda de Correos</CardTitle>
              <CardDescription>
                Filtra por destinatario, asunto o tipo de correo
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar correos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((email) => (
                      <TableRow
                        key={email.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <TableCell>
                          {new Date(email.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{email.destinatario}</TableCell>
                        <TableCell>{email.asunto}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{email.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadgeColor(email.estado)}>
                            {email.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Correo</DialogTitle>
            <DialogDescription>
              Enviado a {selectedEmail?.destinatario} el{' '}
              {selectedEmail && new Date(selectedEmail.created_at).toLocaleString('es-MX')}
            </DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Asunto:</h4>
                <p>{selectedEmail.asunto}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Tipo:</h4>
                <Badge variant="outline">{selectedEmail.tipo}</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Estado:</h4>
                <Badge className={getEstadoBadgeColor(selectedEmail.estado)}>
                  {selectedEmail.estado}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Contenido:</h4>
                <div 
                  className="prose prose-sm max-w-none bg-muted p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.contenido }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminEmails;