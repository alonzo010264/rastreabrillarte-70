import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, Search, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "@/components/ShoppingCart";
import UserAvatar from "@/components/UserAvatar";
import NotificationBell from "@/components/NotificationBell";
import { AdminMenu } from "@/components/AdminMenu";
import { useRealtimeCart } from "@/hooks/useRealtimeCart";
import { useRealtimeFavorites } from "@/hooks/useRealtimeFavorites";
import { Badge } from "@/components/ui/badge";
import SafeBoundary from "@/components/SafeBoundary";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();
  const cartCount = useRealtimeCart();
  const favoritesCount = useRealtimeFavorites();

  const navigationItems = [
    { name: "INICIO", href: "/" },
    { name: "COLECCIONES", href: "/productos" },
    { name: "TIENDA", href: "/productos" },
    { name: "RASTREAR TU PEDIDO", href: "/rastrear" },
    { name: "SOBRE NOSOTROS", href: "/nosotros" },
    { name: "CONTACTO", href: "/contacto" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isProductsPage = location.pathname === '/productos';

  return (
    <header className="bg-white text-neutral-900 sticky top-0 z-50 border-b border-neutral-200">
      {/* Top info bar */}
      <div className="hidden md:block bg-white border-b border-neutral-200 text-[11px] tracking-[0.2em] text-neutral-700">
        <div className="container mx-auto px-4 grid grid-cols-3">
          <div className="py-2 border-r border-neutral-200 text-center">ENVÍOS A TODO EL PAÍS</div>
          <div className="py-2 border-r border-neutral-200 text-center">PAGOS 100% SEGUROS</div>
          <div className="py-2 text-center">CAMBIOS Y DEVOLUCIONES FÁCILES</div>
        </div>
      </div>

      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-3xl tracking-tight italic">B</span>
            <span className="font-display text-2xl tracking-[0.25em] text-neutral-900">BRILLARTE</span>
          </Link>

          {/* Center nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-[11px] tracking-[0.25em] font-medium transition-colors hover:text-neutral-900 relative py-2",
                  isActive(item.href) ? "text-neutral-900" : "text-neutral-600"
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-neutral-900" />
                )}
              </Link>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-neutral-800 hover:bg-neutral-100" asChild>
              <Link to="/productos" aria-label="Buscar"><Search className="h-5 w-5" /></Link>
            </Button>

            <SafeBoundary><NotificationBell /></SafeBoundary>

            <SafeBoundary>
              {isAdmin ? <AdminMenu /> : (
                <Button variant="ghost" size="icon" className="text-neutral-800 hover:bg-neutral-100" asChild>
                  <Link to="/perfil" aria-label="Perfil"><User className="h-5 w-5" /></Link>
                </Button>
              )}
            </SafeBoundary>

            {isProductsPage && (
              <>
                <SafeBoundary>
                  <Button variant="ghost" size="icon" className="relative text-neutral-800 hover:bg-neutral-100" asChild data-favorites-icon>
                    <Link to="/favoritos" aria-label="Favoritos">
                      <Heart className="h-5 w-5" />
                      {favoritesCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-neutral-900 text-white">{favoritesCount}</Badge>
                      )}
                    </Link>
                  </Button>
                </SafeBoundary>
                <SafeBoundary>
                  <div className="relative" data-cart-icon>
                    <ShoppingCart />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-neutral-900 text-white pointer-events-none">{cartCount}</Badge>
                    )}
                  </div>
                </SafeBoundary>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-neutral-800 hover:bg-neutral-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-neutral-200 animate-slide-up-fade">
            <div className="flex flex-col">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "py-3 text-[12px] tracking-[0.25em] font-medium border-b border-neutral-100",
                    isActive(item.href) ? "text-neutral-900" : "text-neutral-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;
