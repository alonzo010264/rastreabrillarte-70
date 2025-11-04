import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_mayoreo: number | null;
  cantidad_mayoreo: number | null;
  colores: string[];
  imagenes: string[];
  categoria: string;
}

export const ProductShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('productos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'productos' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
  };

  return (
    <div className="py-16 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 ${isVisible ? 'animate-on-scroll' : 'opacity-0'}`}>
          <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4">Nuestros Productos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra colección de accesorios únicos hechos a mano
          </p>
        </div>

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
                    src={product.imagenes[0]}
                    alt={product.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div>
                    <p className="text-2xl font-bold">
                      ${product.precio.toFixed(2)}
                    </p>
                    {product.precio_mayoreo && product.cantidad_mayoreo && (
                      <p className="text-sm text-muted-foreground">
                        ${product.precio_mayoreo.toFixed(2)} por {product.cantidad_mayoreo} unidades
                      </p>
                    )}
                  </div>

                  {product.colores && product.colores.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Colores disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colores.map((color, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
  );
};
