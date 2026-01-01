import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, ShieldCheck, User } from 'lucide-react';
import verificadoIcon from '@/assets/verificado-icon.png';
import brillarteLogo from '@/assets/brillarte-logo-new.jpg';

const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';

export interface AccountResult {
  user_id: string;
  nombre_completo: string;
  avatar_url: string | null;
  verificado: boolean;
  identificador: string | null;
  isOfficial: boolean;
  displayName: string; // Lo que se muestra según verificación
}

interface SearchAccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAccount: (account: AccountResult) => void;
}

const SearchAccountsModal = ({ open, onOpenChange, onSelectAccount }: SearchAccountsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setAccounts([]);
      setHasSearched(false);
    }
  }, [open]);

  const searchAccounts = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Buscar por identificador (username)
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, avatar_url, verificado, correo, identificador')
        .or(`identificador.ilike.%${searchQuery.trim()}%,nombre_completo.ilike.%${searchQuery.trim()}%`)
        .limit(20);

      if (error) throw error;

      // Obtener el usuario actual para excluirlo
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const formattedAccounts: AccountResult[] = (data || [])
        .filter(account => account.user_id !== currentUser?.id) // Excluir usuario actual
        .map(account => {
          const isOfficial = account.correo === BRILLARTE_OFFICIAL_EMAIL || account.correo?.endsWith('@brillarte.lat');
          const isVerified = isOfficial || account.verificado;
          
          // Si está verificado, mostrar nombre completo. Si no, solo el @username
          let displayName: string;
          if (isOfficial) {
            displayName = 'BRILLARTE';
          } else if (isVerified) {
            displayName = account.nombre_completo;
          } else {
            displayName = account.identificador ? `@${account.identificador}` : 'Usuario';
          }
          
          return {
            user_id: account.user_id,
            nombre_completo: account.nombre_completo,
            avatar_url: isOfficial ? brillarteLogo : account.avatar_url,
            verificado: isVerified,
            identificador: account.identificador,
            isOfficial,
            displayName
          };
        });

      // Ordenar: verificados primero
      formattedAccounts.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        if (a.verificado && !b.verificado) return -1;
        if (!a.verificado && b.verificado) return 1;
        return 0;
      });

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error searching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAccounts();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Cuentas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buscador */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por @usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={searchAccounts} disabled={loading || !searchQuery.trim()} size="icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Nota de seguridad */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Por seguridad, solo se muestra el @usuario en cuentas no verificadas
          </p>

          {/* Resultados */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasSearched && accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron cuentas
            </p>
          ) : accounts.length > 0 ? (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {accounts.map((account) => (
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
                      {/* No mostrar avatar para cuentas no verificadas */}
                      {account.verificado ? (
                        <>
                          <AvatarImage src={account.avatar_url || undefined} />
                          <AvatarFallback className={account.isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                            {account.displayName[0]?.toUpperCase()}
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
                          {account.displayName}
                        </span>
                        {account.verificado && (
                          <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                        )}
                      </div>
                      {account.identificador && account.verificado && !account.isOfficial && (
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
          ) : !hasSearched ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Escribe un @usuario para buscar
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchAccountsModal;
