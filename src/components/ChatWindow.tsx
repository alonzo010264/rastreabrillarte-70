import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Image as ImageIcon, Gift, Tag, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import verificadoIcon from '@/assets/verificado-icon.png';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  tipo: 'text' | 'image' | 'credito' | 'cupon';
  metadata: any;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
}

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  otherUser: {
    id: string;
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
  onSendMessage: (content: string | null, imageUrl: string | null, tipo: 'text' | 'image' | 'credito' | 'cupon', metadata?: any) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  isOfficialAccount: boolean;
}

export const ChatWindow = ({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
  onUploadImage,
  isOfficialAccount
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showCuponDialog, setShowCuponDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [cuponCode, setCuponCode] = useState('');
  const [cuponDescription, setCuponDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, null, 'text');
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const imageUrl = await onUploadImage(file);
    if (imageUrl) {
      onSendMessage(null, imageUrl, 'image');
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto válido',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Actualizar saldo del usuario
      await supabase.rpc('update_user_balance', {
        p_user_id: otherUser.id,
        p_monto: amount,
        p_tipo: 'credito',
        p_concepto: creditReason || 'Crédito enviado por BRILLARTE',
        p_admin_id: currentUserId
      });

      // Enviar mensaje en el chat
      onSendMessage(
        `💰 Crédito enviado: $${amount}`,
        null,
        'credito',
        { amount, reason: creditReason }
      );

      toast({
        title: 'Crédito enviado',
        description: `Se enviaron $${amount} a ${otherUser.nombre_completo}`
      });

      setCreditAmount('');
      setCreditReason('');
      setShowCreditDialog(false);
    } catch (error: any) {
      console.error('Error sending credit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el crédito',
        variant: 'destructive'
      });
    }
  };

  const handleSendCupon = () => {
    if (!cuponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa un código de cupón',
        variant: 'destructive'
      });
      return;
    }

    onSendMessage(
      `🎁 Cupón: ${cuponCode}\n${cuponDescription}`,
      null,
      'cupon',
      { code: cuponCode, description: cuponDescription }
    );

    toast({
      title: 'Cupón enviado',
      description: `Se envió el cupón ${cuponCode}`
    });

    setCuponCode('');
    setCuponDescription('');
    setShowCuponDialog(false);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>{otherUser.nombre_completo[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{otherUser.nombre_completo}</h3>
            {otherUser.verificado && (
              <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={message.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {message.profiles?.nombre_completo?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.tipo === 'credito' ? 'border-2 border-green-500' : ''} ${
                      message.tipo === 'cupon' ? 'border-2 border-blue-500' : ''
                    }`}
                  >
                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Imagen del chat"
                        className="rounded-md max-w-full max-h-64 object-cover mb-2"
                      />
                    )}
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          {isOfficialAccount && (
            <>
              <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Gift className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Crédito</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Monto ($)</Label>
                      <Input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="Ej: 100"
                      />
                    </div>
                    <div>
                      <Label>Razón (opcional)</Label>
                      <Input
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        placeholder="Ej: Regalo por tu compra"
                      />
                    </div>
                    <Button onClick={handleSendCredit} className="w-full">
                      Enviar Crédito
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCuponDialog} onOpenChange={setShowCuponDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Tag className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Cupón</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Código del Cupón</Label>
                      <Input
                        value={cuponCode}
                        onChange={(e) => setCuponCode(e.target.value)}
                        placeholder="Ej: DESC20"
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={cuponDescription}
                        onChange={(e) => setCuponDescription(e.target.value)}
                        placeholder="Ej: 20% de descuento en tu próxima compra"
                      />
                    </div>
                    <Button onClick={handleSendCupon} className="w-full">
                      Enviar Cupón
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
