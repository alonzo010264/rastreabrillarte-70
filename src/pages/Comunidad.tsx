import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Sparkles, Trash2, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import verificadoIcon from '@/assets/verificado-icon.png';
import brillarteLogo from '@/assets/brillarte-logo-new.jpg';

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

  useEffect(() => {
    checkUser();
    loadPosts();
    subscribeToChanges();
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

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts_comunidad')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (postsData) {
        const postsWithDetails = await Promise.all(
          postsData.map(async (post) => {
            // Get profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado, correo')
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
                isOfficial: true
              };
            } else if (profileData) {
              finalProfile = { 
                ...profileData, 
                isOfficial: false 
              };
            } else {
              finalProfile = { nombre_completo: 'Usuario', avatar_url: null, verificado: false, correo: '', isOfficial: false };
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
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('comunidad-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts_comunidad' },
        () => loadPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes_comunidad' },
        () => loadPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes_respuestas_comunidad' },
        (payload) => {
          if (expandedPost) {
            loadRespuestas(expandedPost);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'respuestas_comunidad' },
        (payload) => {
          if (expandedPost) {
            loadRespuestas(expandedPost);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
              .select('nombre_completo, avatar_url, verificado, correo')
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
            profiles: profileData || { nombre_completo: resp.es_ia ? 'Asistente IA' : 'Usuario', avatar_url: null, verificado: false, correo: '' },
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
      toast({
        title: 'Error',
        description: 'No se pudo dar like a la respuesta',
        variant: 'destructive'
      });
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

    try {
      const { error } = await supabase
        .from('respuestas_comunidad')
        .insert({
          post_id: postId,
          user_id: user.id,
          contenido: newRespuesta[postId],
          es_ia: false
        });

      if (error) throw error;

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
            <p className="text-muted-foreground">
              Comparte experiencias, haz preguntas y conecta con otros
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
                <Textarea
                  placeholder="¿Qué quieres compartir?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-24 resize-none"
                />
                <div className="flex justify-end">
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
              <Card key={post.id} className={`p-6 ${isOfficialAccount ? 'border-2 border-primary/20 bg-primary/5' : ''}`}>
                <div className="flex gap-4">
                  <Link to={`/perfil-publico/${post.user_id}`}>
                    <Avatar className={`cursor-pointer hover:opacity-80 transition ${isOfficialAccount ? 'ring-2 ring-primary' : ''}`}>
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback className={isOfficialAccount ? 'bg-primary text-primary-foreground' : ''}>
                        {post.profiles?.nombre_completo?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/perfil-publico/${post.user_id}`} className="hover:underline">
                        <span className={`font-semibold ${isOfficialAccount ? 'text-primary' : ''}`}>
                          {post.profiles?.nombre_completo}
                        </span>
                      </Link>
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
                    <p className="text-foreground whitespace-pre-wrap">{post.contenido}</p>
                    
                    <div className="flex gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={post.user_liked ? 'text-red-500' : ''}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/mensajes?userId=${post.user_id}`)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Mensaje
                        </Button>
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
                                <Link to={`/perfil-publico/${resp.user_id}`}>
                                  <Avatar className={`w-8 h-8 cursor-pointer hover:opacity-80 transition flex-shrink-0 ${isRespOfficialAccount ? 'ring-2 ring-primary' : ''}`}>
                                    <AvatarImage src={resp.profiles?.avatar_url || undefined} />
                                    <AvatarFallback className={`text-xs ${isRespOfficialAccount ? 'bg-primary text-primary-foreground' : ''}`}>
                                      {resp.profiles?.nombre_completo?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                              )}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!resp.es_ia ? (
                                    <Link to={`/perfil-publico/${resp.user_id}`} className="hover:underline">
                                      <span className={`text-sm font-semibold ${isRespOfficialAccount ? 'text-primary' : ''}`}>
                                        {resp.profiles?.nombre_completo}
                                      </span>
                                    </Link>
                                  ) : (
                                    <span className="text-sm font-semibold">Asistente IA</span>
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
                                 <p className="text-sm text-foreground">{resp.contenido}</p>
                                 {!resp.es_ia && (
                                   <div className="flex items-center gap-2 mt-2">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleLikeRespuesta(resp.id, post.id)}
                                       className={resp.user_liked ? 'text-red-500' : ''}
                                       disabled={!user}
                                     >
                                       <Heart className={`w-3 h-3 mr-1 ${resp.user_liked ? 'fill-current' : ''}`} />
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
                            <Textarea
                              placeholder="Escribe una respuesta..."
                              value={newRespuesta[post.id] || ''}
                              onChange={(e) => setNewRespuesta(prev => ({ 
                                ...prev, 
                                [post.id]: e.target.value 
                              }))}
                              className="min-h-16 resize-none text-sm"
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