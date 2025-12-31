import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Sparkles, Trash2, Mail, AtSign, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import verificadoIcon from '@/assets/verificado-icon.png';
import brillarteLogo from '@/assets/brillarte-logo-new.jpg';
import CreditRequestModal from '@/components/CreditRequestModal';
import MentionInput, { RenderMentions } from '@/components/MentionInput';

interface Post {
  id: string;
  contenido: string;
  created_at: string;
  es_pregunta: boolean;
  respondido_por_ia: boolean;
  user_id: string;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
    correo: string;
    identificador?: string;
    isOfficial?: boolean;
  };
  likes_count?: number;
  user_liked?: boolean;
  respuestas_count?: number;
}

interface Respuesta {
  id: string;
  contenido: string;
  created_at: string;
  es_ia: boolean;
  user_id: string | null;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
    correo: string;
    identificador?: string;
    isOfficial?: boolean;
  };
  likes_count?: number;
  user_liked?: boolean;
}

const Comunidad = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<{ [key: string]: Respuesta[] }>({});
  const [newRespuesta, setNewRespuesta] = useState<{ [key: string]: string }>({});
  const lastLoadRef = useRef<number>(0);

  useEffect(() => {
    checkUser();
    loadPosts();
    const cleanup = subscribeToChanges();
    return cleanup;
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setUserProfile(profile);
    }
  };

  // Avatar oficial de BRILLARTE - detectar por correo o rol admin
  const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';
  const BRILLARTE_ADMIN_EMAILS = ['oficial@brillarte.lat', 'admin@brillarte.lat', 'brillarte@gmail.com'];

  const isOfficialBrillarteAccount = (email: string) => {
    return BRILLARTE_ADMIN_EMAILS.includes(email?.toLowerCase()) || email?.endsWith('@brillarte.lat');
  };

  const loadPosts = useCallback(async () => {
    // Debounce para evitar múltiples recargas
    const now = Date.now();
    if (now - lastLoadRef.current < 500) return;
    lastLoadRef.current = now;

    try {
      const { data: postsData, error } = await supabase
        .from('posts_comunidad')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (postsData) {
        const postsWithDetails = await Promise.all(
          postsData.map(async (post) => {
            // Get profile data including identificador
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado, correo, identificador')
              .eq('user_id', post.user_id)
              .single();

            // Si es cuenta oficial, usar datos de BRILLARTE con logo importado
            const isOfficial = isOfficialBrillarteAccount(profileData?.correo || '');
            let finalProfile;
            if (isOfficial) {
              finalProfile = { 
                nombre_completo: 'BRILLARTE', 
                avatar_url: brillarteLogo, 
                verificado: true, 
                correo: profileData?.correo || BRILLARTE_OFFICIAL_EMAIL,
                identificador: 'brillarte.do',
                isOfficial: true
              };
            } else if (profileData) {
              finalProfile = { 
                ...profileData, 
                isOfficial: false 
              };
            } else {
              finalProfile = { 
                nombre_completo: 'Usuario', 
                avatar_url: null, 
                verificado: false, 
                correo: '', 
                identificador: '',
                isOfficial: false 
              };
            }

            // Get likes count
            const { count: likesCount } = await supabase
              .from('likes_comunidad')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Check if user liked (only if user is logged in)
            let userLike = null;
            if (user) {
              const { data } = await supabase
                .from('likes_comunidad')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();
              userLike = data;
            }

            // Get responses count
            const { count: respuestasCount } = await supabase
              .from('respuestas_comunidad')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              profiles: finalProfile,
              likes_count: likesCount || 0,
              user_liked: !!userLike,
              respuestas_count: respuestasCount || 0
            };
          })
        );

        setPosts(postsWithDetails);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las publicaciones',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [user, toast]);

  // Actualizar likes en tiempo real sin recargar todo
  const updatePostLikes = useCallback(async (postId: string) => {
    const { count: likesCount } = await supabase
      .from('likes_comunidad')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    let userLike = null;
    if (user) {
      const { data } = await supabase
        .from('likes_comunidad')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      userLike = data;
    }

    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes_count: likesCount || 0, user_liked: !!userLike }
        : p
    ));
  }, [user]);

  // Actualizar contador de respuestas en tiempo real
  const updatePostRespuestasCount = useCallback(async (postId: string) => {
    const { count: respuestasCount } = await supabase
      .from('respuestas_comunidad')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, respuestas_count: respuestasCount || 0 }
        : p
    ));
  }, []);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('comunidad-realtime-' + Date.now())
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts_comunidad' },
        (payload) => {
          // Cargar el nuevo post con perfil
          loadPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts_comunidad' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes_comunidad' },
        (payload: any) => {
          // Actualizar solo el post afectado
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (postId) {
            updatePostLikes(postId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'respuestas_comunidad' },
        (payload) => {
          const postId = payload.new.post_id;
          // Actualizar contador
          updatePostRespuestasCount(postId);
          // Si está expandido, cargar la nueva respuesta
          if (expandedPost === postId) {
            loadRespuestas(postId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes_respuestas_comunidad' },
        (payload: any) => {
          const respuestaId = payload.new?.respuesta_id || payload.old?.respuesta_id;
          if (respuestaId && expandedPost) {
            // Actualizar likes de respuesta en tiempo real
            updateRespuestaLikes(respuestaId, expandedPost);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Actualizar likes de respuesta en tiempo real
  const updateRespuestaLikes = useCallback(async (respuestaId: string, postId: string) => {
    const { count: likesCount } = await supabase
      .from('likes_respuestas_comunidad')
      .select('*', { count: 'exact', head: true })
      .eq('respuesta_id', respuestaId);

    let userLike = null;
    if (user) {
      const { data } = await supabase
        .from('likes_respuestas_comunidad')
        .select('id')
        .eq('respuesta_id', respuestaId)
        .eq('user_id', user.id)
        .single();
      userLike = data;
    }

    setRespuestas(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(r => 
        r.id === respuestaId 
          ? { ...r, likes_count: likesCount || 0, user_liked: !!userLike }
          : r
      )
    }));
  }, [user]);

  // Navegar a chat con usuario por identificador
  const handleMentionClick = async (identificador: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('identificador', identificador)
        .single();

      if (profile) {
        navigate(`/mensajes?userId=${profile.user_id}`);
      }
    } catch (error) {
      console.error('Error finding user:', error);
    }
  };

  // Navegar al perfil del usuario al hacer clic en nombre
  const handleNameClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Siempre navegar al perfil público, excepto si es el propio usuario
    if (user?.id === userId) {
      navigate('/perfil');
    } else {
      navigate(`/perfil-publico/${userId}`);
    }
  };

  // Navegar a mensajes
  const handleMessageClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas iniciar sesión para enviar mensajes',
        variant: 'destructive'
      });
      return;
    }
    navigate(`/mensajes?userId=${userId}`);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      const { data: post, error } = await supabase
        .from('posts_comunidad')
        .insert({
          user_id: user.id,
          contenido: newPost,
          es_pregunta: newPost.includes('?')
        })
        .select()
        .single();

      if (error) throw error;

      // Notificar menciones
      if (newPost.includes('@')) {
        supabase.functions.invoke('notify-mention', {
          body: {
            contenido: newPost,
            autorId: user.id,
            autorNombre: userProfile?.nombre_completo || 'Usuario',
            postId: post.id,
            tipo: 'post'
          }
        });
      }

      // Notify Brillarte account (skip if it's the official account posting)
      await supabase.functions.invoke('notify-brillarte-new-post', {
        body: {
          postId: post.id,
          userName: userProfile?.nombre_completo || 'Usuario',
          contenido: newPost,
          userEmail: userProfile?.correo
        }
      });

      // Trigger AI response for all posts (skip for official account)
      if (userProfile?.correo !== 'oficial@brillarte.lat') {
        supabase.functions.invoke('community-ai-responder', {
          body: {
            postId: post.id,
            contenido: newPost,
            userEmail: userProfile?.correo
          }
        });
      }

      setNewPost('');
      toast({
        title: 'Publicación creada',
        description: 'Tu publicación se ha compartido'
      });

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la publicación',
        variant: 'destructive'
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      
      // Optimistic update
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_liked: !p.user_liked,
              likes_count: (p.likes_count || 0) + (p.user_liked ? -1 : 1)
            }
          : p
      ));
      
      if (post?.user_liked) {
        await supabase
          .from('likes_comunidad')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes_comunidad')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      // Revert on error
      loadPosts();
    }
  };

  const loadRespuestas = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('respuestas_comunidad')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profile data for each response
      const respuestasWithProfiles = await Promise.all(
        (data || []).map(async (resp) => {
          let profileData = null;
          
          if (resp.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado, correo, identificador')
              .eq('user_id', resp.user_id)
              .single();
            
            // Si es cuenta oficial, usar datos de BRILLARTE con logo importado
            const isOfficial = isOfficialBrillarteAccount(data?.correo || '');
            profileData = isOfficial 
              ? { 
                  nombre_completo: 'BRILLARTE', 
                  avatar_url: brillarteLogo, 
                  verificado: true, 
                  correo: data?.correo || BRILLARTE_OFFICIAL_EMAIL,
                  identificador: 'brillarte.do',
                  isOfficial: true
                }
              : { ...data, isOfficial: false };
          }

          // Get likes count for response
          const { count: likesCount } = await supabase
            .from('likes_respuestas_comunidad')
            .select('*', { count: 'exact', head: true })
            .eq('respuesta_id', resp.id);

          // Check if user liked (only if user is logged in)
          let userLike = null;
          if (user && resp.user_id) {
            const { data } = await supabase
              .from('likes_respuestas_comunidad')
              .select('id')
              .eq('respuesta_id', resp.id)
              .eq('user_id', user.id)
              .single();
            userLike = data;
          }

          return {
            ...resp,
            profiles: profileData || { 
              nombre_completo: resp.es_ia ? 'Asistente IA' : 'Usuario', 
              avatar_url: null, 
              verificado: false, 
              correo: '',
              identificador: ''
            },
            likes_count: likesCount || 0,
            user_liked: !!userLike
          };
        })
      );

      setRespuestas(prev => ({ ...prev, [postId]: respuestasWithProfiles }));
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const handleLikeRespuesta = async (respuestaId: string, postId: string) => {
    if (!user) return;

    try {
      const respuesta = respuestas[postId]?.find(r => r.id === respuestaId);
      
      // Optimistic update
      setRespuestas(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(r => 
          r.id === respuestaId 
            ? { 
                ...r, 
                user_liked: !r.user_liked,
                likes_count: (r.likes_count || 0) + (r.user_liked ? -1 : 1)
              }
            : r
        )
      }));
      
      if (respuesta?.user_liked) {
        await supabase
          .from('likes_respuestas_comunidad')
          .delete()
          .eq('respuesta_id', respuestaId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes_respuestas_comunidad')
          .insert({
            respuesta_id: respuestaId,
            user_id: user.id
          });
      }
    } catch (error: any) {
      console.error('Error toggling like on response:', error);
      loadRespuestas(postId);
    }
  };

  const handleToggleRespuestas = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      loadRespuestas(postId);
    }
  };

  const handleCreateRespuesta = async (postId: string) => {
    if (!newRespuesta[postId]?.trim() || !user) return;

    const contenido = newRespuesta[postId];

    try {
      const { data: respuesta, error } = await supabase
        .from('respuestas_comunidad')
        .insert({
          post_id: postId,
          user_id: user.id,
          contenido: contenido,
          es_ia: false
        })
        .select()
        .single();

      if (error) throw error;

      // Notificar menciones
      if (contenido.includes('@')) {
        supabase.functions.invoke('notify-mention', {
          body: {
            contenido: contenido,
            autorId: user.id,
            autorNombre: userProfile?.nombre_completo || 'Usuario',
            postId: postId,
            tipo: 'respuesta'
          }
        });
      }

      setNewRespuesta(prev => ({ ...prev, [postId]: '' }));
      toast({
        title: 'Respuesta enviada',
        description: 'Tu respuesta se ha publicado'
      });
    } catch (error: any) {
      console.error('Error creating response:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la respuesta',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts_comunidad')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Publicación eliminada',
        description: 'Tu publicación se ha eliminado correctamente'
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la publicación',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-center">Cargando...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Comunidad BRILLARTE</h1>
            <p className="text-muted-foreground mb-8">
              Inicia sesión para participar en la comunidad
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-16 px-4 bg-background">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Comunidad BRILLARTE</h1>
            <p className="text-muted-foreground mb-4">
              Comparte experiencias, haz preguntas y conecta con otros. Usa @usuario para mencionar.
            </p>
          </div>

          {/* Create Post Card */}
          <Card className="p-6">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback>
                  {userProfile?.nombre_completo?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <MentionInput
                  value={newPost}
                  onChange={setNewPost}
                  placeholder="¿Qué quieres compartir? Usa @ para mencionar usuarios"
                  minHeight="min-h-24"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AtSign className="w-3 h-3" />
                    Escribe @ para mencionar usuarios
                  </span>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!newPost.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Posts List */}
          <div className="space-y-4">
          {posts.map((post) => {
            const isOfficialAccount = isOfficialBrillarteAccount(post.profiles?.correo || '');
            const isOwnPost = user?.id === post.user_id;
            
            return (
              <Card 
                key={post.id} 
                id={`post-${post.id}`}
                className={`p-6 ${isOfficialAccount ? 'border-2 border-primary/20 bg-primary/5' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="relative group">
                    <Avatar 
                      className={`cursor-pointer hover:opacity-80 transition ${isOfficialAccount ? 'ring-2 ring-primary' : ''}`}
                      onClick={(e) => handleNameClick(e, post.user_id)}
                    >
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback className={isOfficialAccount ? 'bg-primary text-primary-foreground' : ''}>
                        {post.profiles?.nombre_completo?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Boton de mensaje al hover en avatar */}
                    {user && user.id !== post.user_id && (
                      <button
                        onClick={(e) => handleMessageClick(e, post.user_id)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                        title="Enviar mensaje"
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={(e) => handleNameClick(e, post.user_id)}
                        className="hover:underline"
                        title="Ver perfil"
                      >
                        <span className={`font-semibold ${isOfficialAccount ? 'text-primary' : ''}`}>
                          {post.profiles?.nombre_completo}
                        </span>
                      </button>
                      {post.profiles?.identificador && (
                        <span className="text-xs text-muted-foreground">
                          @{post.profiles.identificador}
                        </span>
                      )}
                      {(post.profiles?.verificado || isOfficialAccount) && (
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                          <img 
                            src={verificadoIcon} 
                            alt="Verificado" 
                            className="w-4 h-4"
                          />
                          <span className="text-xs font-medium text-primary">
                            {isOfficialAccount ? 'Oficial' : 'Verificado'}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                      {post.es_pregunta && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Pregunta
                        </span>
                      )}
                      {isOwnPost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">
                      <RenderMentions 
                        text={post.contenido} 
                        onMentionClick={handleMentionClick}
                      />
                    </p>
                    
                    <div className="flex gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`transition-all ${post.user_liked ? 'text-red-500' : ''}`}
                      >
                        <Heart className={`w-4 h-4 mr-1 transition-transform ${post.user_liked ? 'fill-current scale-110' : ''}`} />
                        {post.likes_count || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRespuestas(post.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.respuestas_count || 0}
                      </Button>
                      {user && user.id !== post.user_id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleNameClick(e, post.user_id)}
                          >
                            <User className="w-4 h-4 mr-1" />
                            Perfil
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMessageClick(e, post.user_id)}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Mensaje
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Respuestas Section */}
                    {expandedPost === post.id && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
                        {respuestas[post.id]?.map((resp) => {
                          const isRespOfficialAccount = isOfficialBrillarteAccount(resp.profiles?.correo || '');
                          
                          return (
                            <div key={resp.id} className="flex gap-3">
                              {resp.es_ia ? (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                              ) : (
                                <div className="relative group">
                                  <Avatar 
                                    className={`w-8 h-8 cursor-pointer hover:opacity-80 transition flex-shrink-0 ${isRespOfficialAccount ? 'ring-2 ring-primary' : ''}`}
                                    onClick={(e) => resp.user_id && handleNameClick(e, resp.user_id)}
                                  >
                                    <AvatarImage src={resp.profiles?.avatar_url || undefined} />
                                    <AvatarFallback className={`text-xs ${isRespOfficialAccount ? 'bg-primary text-primary-foreground' : ''}`}>
                                      {resp.profiles?.nombre_completo?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  {/* Boton de mensaje al hover */}
                                  {user && user.id !== resp.user_id && resp.user_id && (
                                    <button
                                      onClick={(e) => handleMessageClick(e, resp.user_id!)}
                                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                                      title="Enviar mensaje"
                                    >
                                      <Mail className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!resp.es_ia ? (
                                    <button 
                                      onClick={(e) => resp.user_id && handleNameClick(e, resp.user_id)}
                                      className="hover:underline"
                                      title="Ver perfil"
                                    >
                                      <span className={`text-sm font-semibold ${isRespOfficialAccount ? 'text-primary' : ''}`}>
                                        {resp.profiles?.nombre_completo}
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="text-sm font-semibold">Asistente IA</span>
                                  )}
                                  {resp.profiles?.identificador && !resp.es_ia && (
                                    <span className="text-xs text-muted-foreground">
                                      @{resp.profiles.identificador}
                                    </span>
                                  )}
                                  {(resp.profiles?.verificado || isRespOfficialAccount) && !resp.es_ia && (
                                    <div className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-full">
                                      <img 
                                        src={verificadoIcon} 
                                        alt="Verificado" 
                                        className="w-3 h-3"
                                      />
                                      <span className="text-xs font-medium text-primary">
                                        {isRespOfficialAccount ? 'Oficial' : 'Verificado'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(resp.created_at), { 
                                      addSuffix: true, 
                                      locale: es 
                                    })}
                                  </span>
                                 </div>
                                 <p className="text-sm text-foreground">
                                   <RenderMentions 
                                     text={resp.contenido} 
                                     onMentionClick={handleMentionClick}
                                   />
                                 </p>
                                 {!resp.es_ia && (
                                   <div className="flex items-center gap-2 mt-2">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleLikeRespuesta(resp.id, post.id)}
                                       className={`transition-all ${resp.user_liked ? 'text-red-500' : ''}`}
                                       disabled={!user}
                                     >
                                       <Heart className={`w-3 h-3 mr-1 transition-transform ${resp.user_liked ? 'fill-current scale-110' : ''}`} />
                                       {resp.likes_count || 0}
                                     </Button>
                                   </div>
                                 )}
                               </div>
                             </div>
                           );
                         })}

                        {/* New Response Input */}
                        <div className="flex gap-3 pt-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={userProfile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {userProfile?.nombre_completo?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <MentionInput
                              value={newRespuesta[post.id] || ''}
                              onChange={(value) => setNewRespuesta(prev => ({ 
                                ...prev, 
                                [post.id]: value 
                              }))}
                              placeholder="Escribe una respuesta... usa @ para mencionar"
                              minHeight="min-h-16"
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleCreateRespuesta(post.id)}
                              disabled={!newRespuesta[post.id]?.trim()}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          </div>

          {posts.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no hay publicaciones. ¡Sé el primero en compartir!
              </p>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Comunidad;
