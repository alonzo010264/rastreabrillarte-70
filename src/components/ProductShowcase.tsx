import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ShoppingBag, ChevronLeft, ChevronRight, Heart, ShoppingCart, Star, Rocket, Percent, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FlyingItem } from "@/components/FlyingItem";
import { OfferCountdown } from "@/components/OfferCountdown";
import { createPortal } from "react-dom";

interface EmpresaEnvio {
  id: string;
  nombre: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_original: number | null;
  precio_mayoreo: number | null;
  cantidad_mayoreo: number | null;
  colores: string[];
  imagenes: string[];
  categoria: string;
  stock: number;
  destacado: boolean | null;
  disponible: boolean | null;
  fecha_lanzamiento: string | null;
  en_oferta: boolean | null;
  porcentaje_descuento: number | null;
  oferta_inicio: string | null;
  oferta_fin: string | null;
  codigo_oferta: string | null;
}

export const ProductShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [empresasEnvio, setEmpresasEnvio] = useState<EmpresaEnvio[]>([]);
  const { ref, isVisible } = useScrollAnimation();
  const [currentImageIndex, setCurrentImageIndex] = useState<{[key: string]: number}>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [flyingItems, setFlyingItems] = useState<Array<{
    id: string;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    type: 'cart' | 'favorite';
  }>>([]);

  useEffect(() => {
    checkUser();
    loadEmpresasEnvio();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadFavorites(user.id);
    }
    fetchProducts();
  };

  const loadEmpresasEnvio = async () => {
    const { data, error } = await supabase
      .from('empresas_envio')
      .select('id, nombre, logo_url')
      .eq('activo', true);
    
    if (!error && data) {
      setEmpresasEnvio(data);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select('producto_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(new Set(data?.map(f => f.producto_id) || []));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    const productosChannel = supabase
      .channel('productos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'productos' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productosChannel);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const favoritosChannel = supabase
      .channel(`favoritos-showcase-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'favoritos', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newFav = payload.new as { producto_id: string };
            setFavorites(prev => new Set(prev).add(newFav.producto_id));
          } else if (payload.eventType === 'DELETE') {
            const oldFav = payload.old as { producto_id: string };
            setFavorites(prev => {
              const newSet = new Set(prev);
              newSet.delete(oldFav.producto_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(favoritosChannel);
    };
  }, [user]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
      const indices: {[key: string]: number} = {};
      data.forEach(product => {
        indices[product.id] = 0;
      });
      setCurrentImageIndex(indices);
    }
  };

  const nextImage = (productId: string, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % imagesLength
    }));
  };

  const prevImage = (productId: string, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + imagesLength) % imagesLength
    }));
  };

  const triggerFlyAnimation = (buttonElement: HTMLElement, type: 'cart' | 'favorite') => {
    try {
      const buttonRect = buttonElement.getBoundingClientRect();
      const targetElement = document.querySelector(
        type === 'cart' ? '[data-cart-icon]' : '[data-favorites-icon]'
      );
      
      if (!targetElement) {
        return;
      }
      
      const targetRect = targetElement.getBoundingClientRect();
      
      const flyingItem = {
        id: Date.now().toString(),
        startPos: {
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top + buttonRect.height / 2
        },
        endPos: {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2
        },
        type
      };
      
      setFlyingItems(prev => [...prev, flyingItem]);
    } catch (error) {
      console.log('Animation skipped:', error);
    }
  };

  const removeFlyingItem = (id: string) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleFavorite = async (productId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      toast.error('Debes iniciar sesion para guardar favoritos');
      return;
    }

    try {
      if (favorites.has(productId)) {
        await supabase
          .from('favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('producto_id', productId);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success('Eliminado de favoritos');
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert({ user_id: user.id, producto_id: productId });
        
        if (error) throw error;
        
        setFavorites(prev => new Set(prev).add(productId));
        triggerFlyAnimation(event.currentTarget, 'favorite');
        toast.success('Agregado a favoritos');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      if (error?.code === '23505') {
        toast.success('Agregado a favoritos');
        setFavorites(prev => new Set(prev).add(productId));
      } else {
        toast.error('Error al actualizar favoritos');
      }
    }
  };

  const addToCart = async (product: Product, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      toast.error('Debes iniciar sesion para agregar al carrito');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('carrito')
        .select('id, cantidad')
        .eq('user_id', user.id)
        .eq('producto_id', product.id)
        .is('color', null)
        .is('talla', null)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('carrito')
          .update({ cantidad: existing.cantidad + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('carrito')
          .insert({
            user_id: user.id,
            producto_id: product.id,
            cantidad: 1
          });
      }
      
      triggerFlyAnimation(event.currentTarget, 'cart');
      toast.success(`${product.nombre} agregado al carrito`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  const isOfferActive = (product: Product) => {
    if (!product.en_oferta) return false;
    const now = new Date();
    const start = product.oferta_inicio ? new Date(product.oferta_inicio) : null;
    const end = product.oferta_fin ? new Date(product.oferta_fin) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const hasDiscount = (product: Product) => {
    return product.precio_original && product.precio < product.precio_original;
  };

  return (
    <>
      {flyingItems.map(item => 
        createPortal(
          <FlyingItem
            key={item.id}
            startPosition={item.startPos}
            endPosition={item.endPos}
            type={item.type}
            onComplete={() => removeFlyingItem(item.id)}
          />,
          document.body
        )
      )}
      <div className="py-16 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 ${isVisible ? 'animate-on-scroll' : 'opacity-0'}`}>
          <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4">Nuestros Productos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra coleccion de accesorios unicos hechos a mano
          </p>
        </div>

        {/* Empresas de envio disponibles */}
        {empresasEnvio.length > 0 && (
          <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-primary" />
              <span className="font-medium">Enviamos con:</span>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              {empresasEnvio.map((empresa) => (
                <div key={empresa.id} className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg shadow-sm">
                  {empresa.logo_url && (
                    <img 
                      src={empresa.logo_url} 
                      alt={empresa.nombre} 
                      className="h-6 w-auto object-contain"
                    />
                  )}
                  <span className="text-sm font-medium">{empresa.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className={`hover-lift overflow-hidden ${isVisible ? 'animate-zoom' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {product.imagenes && product.imagenes.length > 0 && (
                <div className="relative h-64 overflow-hidden group">
                  <img
                    src={product.imagenes[currentImageIndex[product.id] || 0]}
                    alt={`${product.nombre} - Imagen ${(currentImageIndex[product.id] || 0) + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Badges de estado */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.destacado && (
                      <Badge className="bg-amber-500 text-white">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Destacado
                      </Badge>
                    )}
                    {isOfferActive(product) && (
                      <Badge className="bg-pink-500 text-white">
                        <Percent className="w-3 h-3 mr-1" />
                        {product.porcentaje_descuento}% OFF
                      </Badge>
                    )}
                    {hasDiscount(product) && !isOfferActive(product) && (
                      <Badge variant="destructive">
                        Rebaja
                      </Badge>
                    )}
                  </div>
                  
                  {product.imagenes.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage(product.id, product.imagenes.length);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage(product.id, product.imagenes.length);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {product.imagenes.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full transition-all ${
                              idx === (currentImageIndex[product.id] || 0)
                                ? 'bg-white w-3'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{product.nombre}</CardTitle>
                  {product.categoria && (
                    <Badge variant="secondary">{product.categoria}</Badge>
                  )}
                </div>
                {product.descripcion && (
                  <CardDescription>{product.descripcion}</CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Badge de disponibilidad */}
                  {product.disponible === false ? (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      <Rocket className="w-3 h-3 mr-1" />
                      Proximamente
                    </Badge>
                  ) : product.stock === 0 ? (
                    <Badge variant="destructive">
                      Agotado
                    </Badge>
                  ) : null}

                  {/* Cronometro de oferta */}
                  {isOfferActive(product) && product.oferta_fin && (
                    <OfferCountdown 
                      endDate={product.oferta_fin} 
                      offerCode={product.codigo_oferta || ''} 
                    />
                  )}
                  
                  {/* Precios */}
                  <div>
                    {(hasDiscount(product) || isOfferActive(product)) ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                          ${product.precio.toFixed(2)}
                        </p>
                        <p className="text-lg line-through text-muted-foreground">
                          ${(product.precio_original || product.precio_mayoreo || 0).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">
                        ${product.precio.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {product.colores && product.colores.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Colores disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colores.map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empresas de envio en el producto */}
                  {empresasEnvio.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="w-3 h-3" />
                      <span>Envio disponible</span>
                      <div className="flex gap-1">
                        {empresasEnvio.slice(0, 2).map((empresa) => (
                          empresa.logo_url && (
                            <img 
                              key={empresa.id}
                              src={empresa.logo_url} 
                              alt={empresa.nombre} 
                              className="h-4 w-auto object-contain"
                            />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      variant={favorites.has(product.id) ? "default" : "outline"}
                      size="default"
                      className="flex-1 min-h-[44px]"
                    >
                      <Heart className={`w-4 h-4 mr-1 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                      {favorites.has(product.id) ? 'Favorito' : 'Me gusta'}
                    </Button>
                    <Button
                      onClick={(e) => addToCart(product, e)}
                      disabled={product.stock === 0 || product.disponible === false}
                      size="default"
                      className="flex-1 min-h-[44px]"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {product.disponible === false ? 'Proximamente' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay productos disponibles en este momento
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};