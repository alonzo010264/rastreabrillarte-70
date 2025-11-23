import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
  };
}

const Comunidad = () => {
  const { toast } = useToast();
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

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts_comunidad')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (postsData && user) {
        const postsWithDetails = await Promise.all(
          postsData.map(async (post) => {
            // Get profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado')
              .eq('user_id', post.user_id)
              .single();

            // Get likes count
            const { count: likesCount } = await supabase
              .from('likes_comunidad')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Check if user liked
            const { data: userLike } = await supabase
              .from('likes_comunidad')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();

            // Get responses count
            const { count: respuestasCount } = await supabase
              .from('respuestas_comunidad')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              profiles: profileData || { nombre_completo: 'Usuario', avatar_url: null, verificado: false },
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

      // Notify Brillarte account
      await supabase.functions.invoke('notify-brillarte-new-post', {
        body: {
          postId: post.id,
          userName: userProfile?.nombre_completo || 'Usuario',
          contenido: newPost
        }
      });

      // Trigger AI response if it's a question
      if (newPost.includes('?')) {
        supabase.functions.invoke('community-ai-responder', {
          body: {
            postId: post.id,
            contenido: newPost
          }
        });
      }

      setNewPost('');
      toast({
        title: 'Publicación creada',
        description: newPost.includes('?') ? 'La IA responderá en unos minutos' : 'Tu publicación se ha compartido'
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
          if (resp.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado')
              .eq('user_id', resp.user_id)
              .single();

            return {
              ...resp,
              profiles: profileData || { nombre_completo: 'Usuario', avatar_url: null, verificado: false }
            };
          }
          return {
            ...resp,
            profiles: { nombre_completo: 'IA', avatar_url: null, verificado: false }
          };
        })
      );

      setRespuestas(prev => ({ ...prev, [postId]: respuestasWithProfiles }));
    } catch (error) {
      console.error('Error loading responses:', error);
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
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Usa "?" para hacer preguntas y recibir respuestas de IA
                  </p>
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
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles?.nombre_completo?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {post.profiles?.nombre_completo}
                      </span>
                      {post.profiles?.verificado && (
                        <img 
                          src="/assets/star-icon.png" 
                          alt="Verificado" 
                          className="w-4 h-4"
                        />
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
                    </div>

                    {/* Respuestas Section */}
                    {expandedPost === post.id && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
                        {respuestas[post.id]?.map((resp) => (
                          <div key={resp.id} className="flex gap-3">
                            {resp.es_ia ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                              </div>
                            ) : (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={resp.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {resp.profiles?.nombre_completo?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {resp.es_ia ? 'Asistente IA' : resp.profiles?.nombre_completo}
                                </span>
                                {resp.profiles?.verificado && !resp.es_ia && (
                                  <img 
                                    src="/assets/star-icon.png" 
                                    alt="Verificado" 
                                    className="w-3 h-3"
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(resp.created_at), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground">{resp.contenido}</p>
                            </div>
                          </div>
                        ))}

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
            ))}
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