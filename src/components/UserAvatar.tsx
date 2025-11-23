import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";
import verificadoIcon from "@/assets/verificado-icon.png";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showVerified?: boolean;
  userId?: string; // Para poder mostrar avatar de otros usuarios
}

export default function UserAvatar({ size = "md", showName = false, showVerified = true, userId }: UserAvatarProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };

  const badgeSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10"
  };

  useEffect(() => {
    if (userId) {
      // Si se proporciona userId, cargar ese perfil específico
      loadUserProfile(userId);
    } else {
      // Si no, cargar el usuario actual
      checkUser();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId && user?.id) {
      // Solo suscribirse a cambios si es el usuario actual
      const channel = supabase
        .channel(`profile-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated in real-time:', payload.new);
            setProfile(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, userId]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      setProfile(profileData);

      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadUserProfile(user.id);
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
        <div className="relative">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={brillarteLogo} alt="Brillarte Admin" />
            <AvatarFallback>BR</AvatarFallback>
          </Avatar>
          {showVerified && profile?.verificado && (
            <img 
              src={verificadoIcon} 
              alt="Verificado" 
              className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} object-contain`}
            />
          )}
        </div>
        {showName && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Brillarte</span>
            {showVerified && profile?.verificado && (
              <img 
                src={verificadoIcon} 
                alt="Verificado" 
                className={`${badgeSizeClasses[size]} object-contain`}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular user with avatar
  if (profile?.avatar_url) {
    // Agregar timestamp para evitar caché del navegador
    const avatarUrlWithTimestamp = `${profile.avatar_url}?t=${new Date().getTime()}`;
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage 
              src={avatarUrlWithTimestamp} 
              alt={profile.nombre_completo}
              key={avatarUrlWithTimestamp}
              className="object-cover"
            />
            <AvatarFallback>
              {profile.nombre_completo?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {showVerified && profile?.verificado && (
            <img 
              src={verificadoIcon} 
              alt="Verificado" 
              className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} object-contain`}
            />
          )}
        </div>
        {showName && (
          <div className="flex items-center gap-1">
            <span className="text-sm">{profile.nombre_completo}</span>
            {showVerified && profile?.verificado && (
              <img 
                src={verificadoIcon} 
                alt="Verificado" 
                className={`${badgeSizeClasses[size]} object-contain`}
              />
            )}
          </div>
        )}
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
