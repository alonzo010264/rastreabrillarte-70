import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerChatProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerId: string;
}

const CustomerChat: React.FC<CustomerChatProps> = ({ isOpen, onClose, customerName, customerId }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'idle' | 'requesting' | 'connected'>('idle');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      initializeChat();
    }
  }, [isOpen, customerId]);

  const initializeChat = async () => {
    try {
      // Create chat request
      const { data: request, error } = await supabase
        .from('chat_requests')
        .insert({
          cliente_id: customerId,
          cliente_nombre: customerName,
          mensaje_inicial: 'Cliente solicita asistencia'
        })
        .select()
        .single();

      if (error) throw error;

      setChatSessionId(request.id);
      setChatStatus('requesting');

      setCurrentUser({
        id: customerId,
        nombre_completo: customerName
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatSessionId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: chatSessionId,
          sender_id: customerId,
          sender_type: 'cliente',
          sender_name: customerName,
          mensaje: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-lg">Chat de Soporte - BRILLARTE</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender_type === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_type === 'cliente' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{msg.mensaje}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerChat;