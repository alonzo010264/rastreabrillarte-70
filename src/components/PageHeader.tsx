import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backPath?: string;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  showHomeButton = true,
  backPath 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl py-8 px-4 border-b border-border/50 animate-fade-in">
      <div className="container mx-auto">
        {/* Navigation buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Regresar</span>
              </Button>
            )}
          </div>
          
          {showHomeButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>
          )}
        </div>

        {/* Logo and title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4 animate-scale-in">
            <img 
              src={brillarteLogo} 
              alt="BRILLARTE Logo" 
              width="80" 
              height="80" 
              className="h-20 w-auto transition-transform duration-300 hover:scale-110" 
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 animate-slide-up-fade">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg font-light animate-fade-in animation-delay-200">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
