import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteProduct {
  id: string;
  producto_id: string;
  producto: {
    id: string;
    nombre: string;
    precio: number;
    precio_mayoreo: number | null;
    imagenes: string[] | null;
    stock: number;
    categoria: string | null;
    colores: string[] | null;
  };
}

const Favoritos = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let currentUserId: string | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Debes iniciar sesión para ver tus favoritos");
        navigate("/login");
        setLoading(false);
        return;
      }

      currentUserId = user.id;
      await loadFavorites(user.id);
      setLoading(false);

      // Suscribirse a cambios en tiempo real de favoritos del usuario
      channel = supabase
        .channel(`favorites-page-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favoritos',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            if (currentUserId) {
              loadFavorites(currentUserId);
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          id,
          producto_id,
          producto:productos (
            id,
            nombre,
            precio,
            precio_mayoreo,
            imagenes,
            stock,
            categoria,
            colores
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(data as any || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Error al cargar favoritos');
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success("Eliminado de favoritos");
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Error al eliminar de favoritos');
    }
  };

  const addToCart = async (product: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { error } = await supabase
        .from('carrito')
        .insert([{
          user_id: user.id,
          producto_id: product.id,
          cantidad: 1
        }]);

      if (error) throw error;
      toast.success("Producto agregado al carrito");
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-12 px-4">
          <p className="text-center">Cargando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl font-bold">Mis Favoritos</h1>
          </div>

          {favorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No tienes favoritos aún</h2>
                <p className="text-muted-foreground mb-6">
                  Explora nuestros productos y guarda tus favoritos
                </p>
                <Button onClick={() => navigate("/productos")}>
                  Ver Productos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => (
                <Card key={favorite.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {favorite.producto.imagenes?.[0] && (
                      <div className="relative aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={favorite.producto.imagenes[0]}
                          alt={favorite.producto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{favorite.producto.nombre}</h3>
                      {favorite.producto.categoria && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {favorite.producto.categoria}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-primary">
                          ${favorite.producto.precio.toFixed(2)}
                        </span>
                        {favorite.producto.precio_mayoreo && (
                          <span className="text-sm text-muted-foreground">
                            Mayoreo: ${favorite.producto.precio_mayoreo.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {favorite.producto.colores && favorite.producto.colores.length > 0 && (
                        <div className="flex gap-1 mb-3">
                          {favorite.producto.colores.slice(0, 5).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border-2 border-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => addToCart(favorite.producto)}
                          disabled={favorite.producto.stock === 0}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFavorite(favorite.id)}
                        >
                          <Heart className="w-4 h-4 fill-primary text-primary" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Favoritos;