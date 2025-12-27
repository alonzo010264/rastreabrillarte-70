import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import verificadoIcon from '@/assets/verificado-icon.png';

interface UserSuggestion {
  user_id: string;
  nombre_completo: string;
  identificador: string;
  avatar_url: string | null;
  verificado: boolean;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MentionInput = ({ 
  value, 
  onChange, 
  placeholder = "Escribe algo...",
  className = "",
  minHeight = "min-h-24"
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Buscar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (mentionSearch.length > 0) {
      searchUsers(mentionSearch);
    } else {
      setSuggestions([]);
    }
  }, [mentionSearch]);

  const searchUsers = async (search: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, identificador, avatar_url, verificado')
        .or(`identificador.ilike.%${search}%,nombre_completo.ilike.%${search}%`)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    // Detectar si estamos escribiendo una mención
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Solo mostrar sugerencias si no hay espacio después del @
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionStartIndex(lastAtIndex);
        setMentionSearch(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionSearch('');
    setMentionStartIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      selectUser(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectUser = useCallback((user: UserSuggestion) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const afterMention = value.substring(cursorPos);
    
    const newValue = `${beforeMention}@${user.identificador} ${afterMention}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionSearch('');
    setMentionStartIndex(-1);
    
    // Enfocar el textarea después de seleccionar
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + user.identificador.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionStartIndex, onChange]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${minHeight} resize-none ${className}`}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
        >
          <ScrollArea className="max-h-48">
            {suggestions.map((user, index) => (
              <button
                key={user.user_id}
                onClick={() => selectUser(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {user.nombre_completo?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm truncate">
                      {user.nombre_completo}
                    </span>
                    {user.verificado && (
                      <img 
                        src={verificadoIcon} 
                        alt="Verificado" 
                        className="w-3.5 h-3.5 flex-shrink-0"
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    @{user.identificador}
                  </span>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// Función utilitaria para extraer menciones de un texto
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@([a-z0-9.]+)/gi;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(m => m.substring(1).toLowerCase()) : [];
};

// Componente para renderizar texto con menciones resaltadas
export const RenderMentions = ({ text, onMentionClick }: { 
  text: string; 
  onMentionClick?: (identificador: string) => void;
}) => {
  const parts = text.split(/(@[a-z0-9.]+)/gi);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const identificador = part.substring(1);
          return (
            <button
              key={index}
              onClick={() => onMentionClick?.(identificador)}
              className="text-primary font-medium hover:underline"
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default MentionInput;
