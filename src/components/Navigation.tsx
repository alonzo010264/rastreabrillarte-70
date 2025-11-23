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
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={brillarteLogo} 
              alt="BRILLARTE Logo" 
              className="h-10 w-10 object-contain transition-transform group-hover:scale-110 duration-300"
            />
            <span className="font-light text-xl text-foreground">BRILLARTE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isExternal = item.href.startsWith('http');
              return isExternal ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {/* Cart and Favorites - Only on products page */}
            {isProductsPage && (
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
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
              </div>
            )}
            
            {/* Notifications and User Account */}
            <div className="ml-2 border-l pl-2 flex items-center gap-1">
              <NotificationBell />
              {isAdmin ? (
                <AdminMenu />
              ) : (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/perfil">
                    <UserAvatar size="sm" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu and actions */}
          <div className="md:hidden flex items-center gap-2">
            {isProductsPage && (
              <>
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
              </>
            )}
            <NotificationBell />
            {isAdmin ? (
              <AdminMenu />
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/perfil">
                  <UserAvatar size="sm" />
                </Link>
              </Button>
            )}
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
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const isExternal = item.href.startsWith('http');
                return isExternal ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(item.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
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