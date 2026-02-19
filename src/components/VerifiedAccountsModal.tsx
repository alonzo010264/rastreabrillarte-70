import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Loader2, Search, User, Users } from 'lucide-react';
import verificadoIcon from '@/assets/verificado-icon.png';
import brillarteLogo from '@/assets/brillarte-logo-new.jpg';

const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';

interface VerifiedAccount {
  user_id: string;
  nombre_completo: string;
  avatar_url: string | null;
  verificado: boolean;
  correo: string;
  identificador: string | null;
  isOfficial: boolean;
}

interface VerifiedAccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAccount: (account: VerifiedAccount) => void;
  currentUserIsVerified?: boolean;
}

const VerifiedAccountsModal = ({ open, onOpenChange, onSelectAccount, currentUserIsVerified = false }: VerifiedAccountsModalProps) => {
  const [accounts, setAccounts] = useState<VerifiedAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<VerifiedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'verificados'>('todos');

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setFilter(currentUserIsVerified ? 'todos' : 'verificados');
      loadAccounts();
    }
  }, [open, currentUserIsVerified]);

  useEffect(() => {
    let result = accounts;

    if (filter === 'verificados') {
      result = result.filter(a => a.verificado);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.nombre_completo.toLowerCase().includes(q) ||
        (a.identificador && a.identificador.toLowerCase().includes(q))
      );
    }

    setFilteredAccounts(result);
  }, [accounts, searchQuery, filter]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      let query = supabase
        .from('profiles')
        .select('user_id, nombre_completo, avatar_url, verificado, correo, identificador')
        .order('nombre_completo');

      // Non-verified users can only see verified accounts
      if (!currentUserIsVerified) {
        query = query.eq('verificado', true);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      const formattedAccounts: VerifiedAccount[] = (data || [])
        .filter(account => account.user_id !== currentUser?.id)
        .map(account => {
          const isOfficial = account.correo === BRILLARTE_OFFICIAL_EMAIL || account.correo?.endsWith('@brillarte.lat');
          return {
            ...account,
            nombre_completo: isOfficial ? 'BRILLARTE' : account.nombre_completo,
            avatar_url: isOfficial ? brillarteLogo : account.avatar_url,
            verificado: isOfficial ? true : (account.verificado || false),
            isOfficial
          };
        });

      // BRILLARTE first, then verified, then alphabetical
      formattedAccounts.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        if (a.verificado && !b.verificado) return -1;
        if (!a.verificado && b.verificado) return 1;
        return a.nombre_completo.localeCompare(b.nombre_completo);
      });

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifiedCount = accounts.filter(a => a.verificado).length;
  const totalCount = accounts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {currentUserIsVerified ? 'Contactos' : 'Cuentas Verificadas'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o @usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter tabs for verified users */}
          {currentUserIsVerified && (
            <div className="flex gap-2">
              <Button
                variant={filter === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('todos')}
                className="gap-1"
              >
                <Users className="h-3 w-3" />
                Todos ({totalCount})
              </Button>
              <Button
                variant={filter === 'verificados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('verificados')}
                className="gap-1"
              >
                <img src={verificadoIcon} alt="" className="w-3 h-3" />
                Verificados ({verifiedCount})
              </Button>
            </div>
          )}

          {!currentUserIsVerified && (
            <p className="text-xs text-muted-foreground">
              Solo puedes enviar mensajes a cuentas verificadas ({verifiedCount})
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No se encontraron resultados' : 'No hay cuentas disponibles'}
            </p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1">
                {filteredAccounts.map((account) => (
                  <Button
                    key={account.user_id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => {
                      onSelectAccount(account);
                      onOpenChange(false);
                    }}
                  >
                    <Avatar className={account.isOfficial ? 'ring-2 ring-primary' : ''}>
                      {account.verificado || account.avatar_url ? (
                        <>
                          <AvatarImage src={account.avatar_url || undefined} />
                          <AvatarFallback className={account.isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                            {account.nombre_completo[0]?.toUpperCase()}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${account.isOfficial ? 'text-primary' : ''}`}>
                          {account.nombre_completo}
                        </span>
                        {account.verificado && (
                          <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                        )}
                      </div>
                      {account.identificador && (
                        <span className="text-xs text-muted-foreground">@{account.identificador}</span>
                      )}
                      {account.isOfficial && (
                        <span className="text-xs text-primary">Cuenta Oficial</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifiedAccountsModal;
