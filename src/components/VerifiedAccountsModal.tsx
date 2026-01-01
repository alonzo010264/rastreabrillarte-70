import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Loader2 } from 'lucide-react';
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
}

const VerifiedAccountsModal = ({ open, onOpenChange, onSelectAccount }: VerifiedAccountsModalProps) => {
  const [accounts, setAccounts] = useState<VerifiedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadVerifiedAccounts();
    }
  }, [open]);

  const loadVerifiedAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, avatar_url, verificado, correo, identificador')
        .eq('verificado', true)
        .order('nombre_completo');

      if (error) throw error;

      const formattedAccounts: VerifiedAccount[] = (data || []).map(account => {
        const isOfficial = account.correo === BRILLARTE_OFFICIAL_EMAIL || account.correo?.endsWith('@brillarte.lat');
        return {
          ...account,
          nombre_completo: isOfficial ? 'BRILLARTE' : account.nombre_completo,
          avatar_url: isOfficial ? brillarteLogo : account.avatar_url,
          isOfficial
        };
      });

      // Ordenar para que BRILLARTE aparezca primero
      formattedAccounts.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        return a.nombre_completo.localeCompare(b.nombre_completo);
      });

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error loading verified accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Cuentas Verificadas
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay cuentas verificadas disponibles
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
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
                    <AvatarImage src={account.avatar_url || undefined} />
                    <AvatarFallback className={account.isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                      {account.nombre_completo[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${account.isOfficial ? 'text-primary' : ''}`}>
                        {account.nombre_completo}
                      </span>
                      <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
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
      </DialogContent>
    </Dialog>
  );
};

export default VerifiedAccountsModal;
