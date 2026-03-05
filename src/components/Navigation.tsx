import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";
import { ShoppingCart } from "@/components/ShoppingCart";
import UserAvatar from "@/components/UserAvatar";
import NotificationBell from "@/components/NotificationBell";
import { AdminMenu } from "@/components/AdminMenu";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeCart } from "@/hooks/useRealtimeCart";
import { useRealtimeFavorites } from "@/hooks/useRealtimeFavorites";
import { Badge } from "@/components/ui/badge";
import SafeBoundary from "@/components/SafeBoundary";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const cartCount = useRealtimeCart();
  const favoritesCount = useRealtimeFavorites();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(roleData?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  };

  const navigationItems = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Pedir", href: "/pedir" },
    { name: "Rastrear Pedidos", href: "/rastrear" },
    { name: "Promociones", href: "/promociones" },
    { name: "Preguntas Frecuentes", href: "/faq" },
    { name: "Contacto", href: "/contacto" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isProductsPage = location.pathname === '/productos';

  return (
    <nav className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={brillarteLogo} 
              alt="BRILLARTE Logo" 
              className="h-10 w-10 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
            />
            <span className="font-light text-xl text-foreground transition-colors duration-300 group-hover:text-primary">BRILLARTE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item, index) => {
              const isExternal = item.href.startsWith('http');
              return isExternal ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary text-muted-foreground hover:scale-105 link-underline"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105 relative overflow-hidden",
                    isActive(item.href)
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            
            {/* Cart and Favorites - Only on products page */}
            {isProductsPage && (
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <SafeBoundary>
                  <div className="relative" data-cart-icon>
                    <ShoppingCart />
                    {cartCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
                        variant="destructive"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </div>
                </SafeBoundary>
                <SafeBoundary>
                  <Button variant="ghost" size="icon" asChild className="relative" data-favorites-icon>
                    <Link to="/favoritos">
                      <Heart className="h-5 w-5" />
                      {favoritesCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
                          variant="destructive"
                        >
                          {favoritesCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                </SafeBoundary>
              </div>
            )}
            
            {/* Notifications and User Account */}
            <div className="ml-2 border-l pl-2 flex items-center gap-1">
              <SafeBoundary>
                <NotificationBell />
              </SafeBoundary>
              <SafeBoundary>
                {isAdmin ? <AdminMenu /> : (
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/perfil">
                      <UserAvatar size="sm" />
                    </Link>
                  </Button>
                )}
              </SafeBoundary>
            </div>
          </div>

          {/* Mobile menu and actions */}
          <div className="md:hidden flex items-center gap-2">
            {isProductsPage && (
              <>
                <SafeBoundary>
                  <div className="relative" data-cart-icon>
                    <ShoppingCart />
                    {cartCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
                        variant="destructive"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </div>
                </SafeBoundary>
                <SafeBoundary>
                  <Button variant="ghost" size="icon" asChild className="relative" data-favorites-icon>
                    <Link to="/favoritos">
                      <Heart className="h-5 w-5" />
                      {favoritesCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
                          variant="destructive"
                        >
                          {favoritesCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                </SafeBoundary>
              </>
            )}
            <SafeBoundary>
              <NotificationBell />
            </SafeBoundary>
            <SafeBoundary>
              {isAdmin ? (
                <AdminMenu />
              ) : (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/perfil">
                    <UserAvatar size="sm" />
                  </Link>
                </Button>
              )}
            </SafeBoundary>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up-fade glass">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item, index) => {
                const isExternal = item.href.startsWith('http');
                return isExternal ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary text-muted-foreground hover:translate-x-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:translate-x-2",
                      isActive(item.href)
                        ? "bg-primary/15 text-primary border-l-2 border-primary"
                        : "text-muted-foreground"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;