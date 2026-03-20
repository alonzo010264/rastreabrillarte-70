import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";
import verificadoIcon from "@/assets/verificado-icon.png";
import { useAuth } from "@/contexts/AuthContext";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showVerified?: boolean;
  userId?: string;
}

export default function UserAvatar({ size = "md", showName = false, showVerified = true, userId }: UserAvatarProps) {
  const auth = useAuth();
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [otherIsAdmin, setOtherIsAdmin] = useState(false);
  const [loading, setLoading] = useState(!!userId);

  const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" };
  const badgeSizeClasses = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

  // If userId provided, load that specific profile
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const [profileRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        ]);
        setOtherProfile(profileRes.data);
        setOtherIsAdmin(!!roleRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [userId]);

  // Use auth context for current user, or fetched data for other users
  const profile = userId ? otherProfile : auth.profile;
  const isAdmin = userId ? otherIsAdmin : auth.isAdmin;
  const user = userId ? (otherProfile ? { id: userId } : null) : auth.user;
  const isLoading = userId ? loading : auth.loading;

  if (isLoading) {
    return <Avatar className={sizeClasses[size]}><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={sizeClasses[size]}><AvatarFallback className="bg-muted"><User className="h-4 w-4" /></AvatarFallback></Avatar>
        {showName && <span className="text-sm text-muted-foreground">Invitado</span>}
      </div>
    );
  }

  const VerifiedBadge = ({ className }: { className: string }) => (
    showVerified && profile?.verificado ? <img src={verificadoIcon} alt="Verificado" className={`${className} object-contain`} /> : null
  );

  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Avatar className={sizeClasses[size]}><AvatarImage src={brillarteLogo} alt="Brillarte Admin" /><AvatarFallback>BR</AvatarFallback></Avatar>
          <VerifiedBadge className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]}`} />
        </div>
        {showName && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Brillarte</span>
            {showVerified && profile?.verificado && (
              <div className="flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                <img src={verificadoIcon} alt="Verificado" className="w-4 h-4 object-contain" />
                <span className="text-xs font-medium text-blue-500">Oficial</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : null;
  const initial = profile?.nombre_completo?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={profile.nombre_completo} className="object-cover" />
          ) : null}
          <AvatarFallback className={avatarUrl ? '' : 'bg-primary text-primary-foreground font-semibold'}>{initial}</AvatarFallback>
        </Avatar>
        <VerifiedBadge className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]}`} />
      </div>
      {showName && (
        <div className="flex items-center gap-1">
          <span className="text-sm">{profile?.nombre_completo}</span>
          {showVerified && profile?.verificado && (
            <div className="flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
              <img src={verificadoIcon} alt="Verificado" className="w-4 h-4 object-contain" />
              <span className="text-xs font-medium text-blue-500">Oficial</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
