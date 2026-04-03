import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FlyingItem } from "@/components/FlyingItem";
import { OfferCountdown } from "@/components/OfferCountdown";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaPercent,
  FaSpinner,
  FaSearch,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

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
  tallas: string[] | null;
  es_preventa: boolean | null;
  monto_minimo_preventa: number | null;
}

type SortOption = "featured" | "price_asc" | "price_desc" | "newest" | "name";

export const ProductShowcase = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<Array<{
    id: string;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    type: "cart" | "favorite";
  }>>([]);

  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchProducts();
    if (user) loadFavorites(user.id);
  }, [user]);

  useEffect(() => {
    const ch = supabase
      .channel("productos-showcase")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => fetchProducts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`favs-showcase-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "favoritos", filter: `user_id=eq.${user.id}` }, (p) => {
        if (p.eventType === "INSERT") {
          setFavorites((prev) => new Set(prev).add((p.new as any).producto_id));
        } else if (p.eventType === "DELETE") {
          setFavorites((prev) => { const s = new Set(prev); s.delete((p.old as any).producto_id); return s; });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) {
      setProducts(data as Product[]);
      const indices: Record<string, number> = {};
      data.forEach((p) => (indices[p.id] = 0));
      setCurrentImageIndex(indices);
      const max = Math.max(...data.map((p) => p.precio), 500);
      setMaxPrice(Math.ceil(max / 10) * 10);
      setPriceRange([0, Math.ceil(max / 10) * 10]);
    }
    setLoading(false);
  };

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase.from("favoritos").select("producto_id").eq("user_id", userId);
    if (data) setFavorites(new Set(data.map((f) => f.producto_id)));
  };

  // Derived data
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const materials = useMemo(() => {
    const mats = new Set<string>();
    products.forEach((p) => {
      if (p.colores) p.colores.forEach((c) => mats.add(c));
    });
    return Array.from(mats).sort();
  }, [products]);

  const isOfferActive = useCallback((p: Product) => {
    if (!p.en_oferta) return false;
    const now = new Date();
    if (p.oferta_inicio && now < new Date(p.oferta_inicio)) return false;
    if (p.oferta_fin && now > new Date(p.oferta_fin)) return false;
    return true;
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.categoria === selectedCategory);
    }

    if (selectedMaterials.size > 0) {
      result = result.filter((p) =>
        p.colores?.some((c) => selectedMaterials.has(c))
      );
    }

    result = result.filter((p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]);

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.precio - b.precio);
        break;
      case "price_desc":
        result.sort((a, b) => b.precio - a.precio);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.fecha_lanzamiento || b.id).getTime() - new Date(a.fecha_lanzamiento || a.id).getTime());
        break;
      case "name":
        result.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      default:
        result.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    }
    return result;
  }, [products, searchQuery, selectedCategory, selectedMaterials, priceRange, sortBy]);

  const nextImage = (id: string, len: number) =>
    setCurrentImageIndex((p) => ({ ...p, [id]: ((p[id] || 0) + 1) % len }));
  const prevImage = (id: string, len: number) =>
    setCurrentImageIndex((p) => ({ ...p, [id]: ((p[id] || 0) - 1 + len) % len }));

  const triggerFly = (el: HTMLElement, type: "cart" | "favorite") => {
    const r = el.getBoundingClientRect();
    const t = document.querySelector(type === "cart" ? "[data-cart-icon]" : "[data-favorites-icon]");
    if (!t) return;
    const tr = t.getBoundingClientRect();
    setFlyingItems((p) => [...p, { id: Date.now().toString(), startPos: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, endPos: { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 }, type }]);
  };

  const toggleFavorite = async (productId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) { toast.error("Debes iniciar sesion para guardar favoritos"); return; }
    try {
      if (favorites.has(productId)) {
        await supabase.from("favoritos").delete().eq("user_id", user.id).eq("producto_id", productId);
        setFavorites((p) => { const s = new Set(p); s.delete(productId); return s; });
        toast.success("Eliminado de favoritos");
      } else {
        const { error } = await supabase.from("favoritos").insert({ user_id: user.id, producto_id: productId });
        if (error) throw error;
        setFavorites((p) => new Set(p).add(productId));
        triggerFly(e.currentTarget, "favorite");
        toast.success("Agregado a favoritos");
      }
    } catch (err: any) {
      if (err?.code === "23505") { setFavorites((p) => new Set(p).add(productId)); }
      else toast.error("Error al actualizar favoritos");
    }
  };

  const addToCart = async (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) { toast.error("Debes iniciar sesion para agregar al carrito"); return; }
    try {
      const { data: existing } = await supabase.from("carrito").select("id, cantidad").eq("user_id", user.id).eq("producto_id", product.id).is("color", null).is("talla", null).maybeSingle();
      if (existing) {
        await supabase.from("carrito").update({ cantidad: existing.cantidad + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("carrito").insert({ user_id: user.id, producto_id: product.id, cantidad: 1 });
      }
      triggerFly(e.currentTarget, "cart");
      toast.success(`${product.nombre} agregado al carrito`);
    } catch { toast.error("Error al agregar al carrito"); }
  };

  const toggleMaterial = (m: string) => {
    setSelectedMaterials((prev) => {
      const s = new Set(prev);
      s.has(m) ? s.delete(m) : s.add(m);
      return s;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedMaterials(new Set());
    setPriceRange([0, maxPrice]);
    setSortBy("featured");
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedMaterials.size > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice;

  // --- Sidebar content ---
  const SidebarContent = () => (
    <div className="space-y-8">
      {/* Collections */}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-4">
          Collections
        </h3>
        <div className="border-t border-border mb-4" />
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`block w-full text-left text-sm py-1.5 transition-colors ${!selectedCategory ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            Todos los accesorios
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`block w-full text-left text-sm py-1.5 transition-colors ${selectedCategory === cat ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter by */}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-4">
          Filter By
        </h3>
        <div className="border-t border-border mb-4" />

        {/* Material */}
        {materials.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground mb-3">
              Material
            </h4>
            <div className="space-y-2.5">
              {materials.slice(0, 8).map((m) => (
                <label key={m} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={selectedMaterials.has(m)}
                    onCheckedChange={() => toggleMaterial(m)}
                    className="border-muted-foreground/40 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground mb-3">
            Price Range
          </h4>
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            max={maxPrice}
            min={0}
            step={5}
            className="mb-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-muted/50 p-5 rounded-sm">
        <h4 className="text-sm font-semibold text-foreground mb-2">Necesitas ayuda?</h4>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Nuestro equipo puede ayudarte a definir materiales, colores y estilo para tu pedido.
        </p>
        <Link
          to="/pedir"
          className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          PEDIR UN ACCESORIO
        </Link>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <FaTimes className="w-3 h-3 mr-2" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {flyingItems.map((item) =>
        createPortal(
          <FlyingItem key={item.id} startPosition={item.startPos} endPosition={item.endPos} type={item.type} onComplete={() => setFlyingItems((p) => p.filter((i) => i.id !== item.id))} />,
          document.body
        )
      )}

      <div className="min-h-screen bg-background">
        {/* Search bar area */}
        <div className="border-b border-border/50 py-4">
          <div className="container mx-auto px-4">
            <div className="relative max-w-lg mx-auto md:mx-0">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR ACCESORIO"
                className="pl-11 h-12 border-border/50 bg-muted/30 rounded-full text-sm tracking-wider placeholder:text-muted-foreground/60 placeholder:tracking-[0.15em] placeholder:uppercase focus-visible:ring-foreground/20"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex gap-10 lg:gap-14">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <SidebarContent />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-light text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    The Collection
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm italic">
                    {filteredProducts.length} accesorio{filteredProducts.length !== 1 ? "s" : ""} Brillarte disponible{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mobile filter button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <FaSlidersH className="w-3.5 h-3.5 mr-2" />
                        Filtros
                        {hasActiveFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-foreground" />}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <div className="pt-6">
                        <SidebarContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[200px] border-0 bg-transparent text-xs tracking-[0.15em] uppercase font-semibold text-foreground h-auto py-1 focus:ring-0">
                      <span className="mr-1">SORT BY:</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Destacados</SelectItem>
                      <SelectItem value="newest">Recientes</SelectItem>
                      <SelectItem value="price_asc">Precio: menor</SelectItem>
                      <SelectItem value="price_desc">Precio: mayor</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <FaSpinner className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg mb-4">No se encontraron accesorios</p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                      >
                        <ProductCard
                          product={product}
                          imageIndex={currentImageIndex[product.id] || 0}
                          isFavorite={favorites.has(product.id)}
                          isOfferActive={isOfferActive(product)}
                          onNextImage={() => nextImage(product.id, product.imagenes?.length || 1)}
                          onPrevImage={() => prevImage(product.id, product.imagenes?.length || 1)}
                          onToggleFavorite={(e) => toggleFavorite(product.id, e)}
                          onAddToCart={(e) => addToCart(product, e)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Product Card Component ---
interface ProductCardProps {
  product: Product;
  imageIndex: number;
  isFavorite: boolean;
  isOfferActive: boolean;
  onNextImage: () => void;
  onPrevImage: () => void;
  onToggleFavorite: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function ProductCard({ product, imageIndex, isFavorite, isOfferActive: offerActive, onNextImage, onPrevImage, onToggleFavorite, onAddToCart }: ProductCardProps) {
  const hasImages = product.imagenes && product.imagenes.length > 0;
  const hasMultipleImages = hasImages && product.imagenes.length > 1;
  const hasDiscount = product.precio_original && product.precio < product.precio_original;

  return (
    <div className="group">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/30 mb-4">
        {hasImages ? (
          <img
            src={product.imagenes[imageIndex]}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sin imagen
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.disponible === false && (
            <span className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-semibold px-3 py-1.5">
              Proximamente
            </span>
          )}
          {offerActive && product.porcentaje_descuento && (
            <span className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-semibold px-3 py-1.5">
              {product.porcentaje_descuento}% OFF
            </span>
          )}
          {product.stock !== null && product.stock <= 3 && product.stock > 0 && product.disponible !== false && (
            <span className="bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-semibold px-3 py-1.5">
              Limited Edition
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background"
        >
          {isFavorite ? (
            <FaHeart className="w-4 h-4 text-foreground" />
          ) : (
            <FaRegHeart className="w-4 h-4 text-foreground" />
          )}
        </button>

        {/* Image navigation */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.imagenes.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === imageIndex ? "w-4 bg-background" : "w-1.5 bg-background/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <Button
            onClick={onAddToCart}
            disabled={product.stock === 0 || product.disponible === false}
            className="w-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background border border-border/50 text-xs tracking-[0.1em] uppercase font-medium h-10"
          >
            <FaShoppingCart className="w-3.5 h-3.5 mr-2" />
            {product.disponible === false ? "Proximamente" : product.stock === 0 ? "Agotado" : "Agregar al carrito"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-1">
        {product.categoria && (
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
            {product.categoria}
          </p>
        )}
        <h3 className="text-sm font-medium text-foreground">
          {product.nombre}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {(hasDiscount || offerActive) ? (
            <>
              <span className="text-sm font-medium text-foreground">${product.precio.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground line-through">${(product.precio_original || 0).toFixed(0)}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-foreground">${product.precio.toFixed(0)}</span>
          )}
        </div>

        {/* Preventa badge */}
        {product.es_preventa && (
          <div className="pt-1">
            <span className="inline-block text-[10px] tracking-[0.1em] uppercase font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-sm">
              Preventa · Mín. ${product.monto_minimo_preventa || 500}
            </span>
          </div>
        )}

        {/* Shipping companies */}
        <div className="flex items-center justify-center gap-1.5 pt-1.5">
          <span className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/70">Envíos con</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Vimenpaq</span>
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Domex</span>
          </div>
        </div>

        {/* Offer countdown */}
        {offerActive && product.oferta_fin && (
          <div className="pt-1">
            <OfferCountdown endDate={product.oferta_fin} offerCode={product.codigo_oferta || ""} />
          </div>
        )}
      </div>
    </div>
  );
}
