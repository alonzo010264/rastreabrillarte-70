import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export default function UserAvatar({ size = "md", showName = false }: UserAvatarProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };

  useEffect(() => {
    checkUser();

    // Suscribirse a cambios en tiempo real del perfil
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Si es el perfil del usuario actual, actualizar
          if (payload.new.user_id === user?.id) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setProfile(profileData);

        // Check if admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!roleData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={sizeClasses[size]}>
          <AvatarFallback className="bg-muted">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm text-muted-foreground">Invitado</span>}
      </div>
    );
  }

  // Admin user - show Brillarte logo
  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={brillarteLogo} alt="Brillarte Admin" />
          <AvatarFallback>BR</AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm font-medium">Brillarte</span>}
      </div>
    );
  }

  // Regular user with avatar
  if (profile?.avatar_url) {
    // Agregar timestamp para evitar caché del navegador
    const avatarUrlWithTimestamp = `${profile.avatar_url}?t=${new Date().getTime()}`;
    
    return (
      <div className="flex items-center gap-2">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage 
            src={avatarUrlWithTimestamp} 
            alt={profile.nombre_completo}
            key={avatarUrlWithTimestamp} 
          />
          <AvatarFallback>
            {profile.nombre_completo?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm">{profile.nombre_completo}</span>}
      </div>
    );
  }

  // Regular user without avatar - show initial
  const initial = profile?.nombre_completo?.charAt(0).toUpperCase() || 'U';
  
  return (
    <div className="flex items-center gap-2">
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      {showName && <span className="text-sm">{profile?.nombre_completo}</span>}
    </div>
  );
}
