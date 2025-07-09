
import { Star, Instagram, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProductShowcase = () => {
  const products = [
    {
      id: 1,
      name: "Pulseras de Goma",
      description: "Pulseras coloridas tejidas a mano en diferentes diseños y colores. Perfectas para cualquier ocasión.",
      image: "/lovable-uploads/cfb24990-8be6-471f-8950-88ea2b74c9f2.png",
      isBestSeller: true,
      badge: "MÁS VENDIDO"
    },
    {
      id: 2,
      name: "Aretes de Cristal",
      description: "Elegantes aretes con cristales brillantes de alta calidad. Disponibles en diferentes tamaños.",
      image: "/lovable-uploads/a9f6c750-6751-40ff-a9c5-42d3b56ca2c5.png",
      isBestSeller: false
    },
    {
      id: 3,
      name: "Bocina Bluetooth",
      description: "Bocina portátil con luces LED multicolor. Sonido de alta calidad y conectividad Bluetooth.",
      image: "/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png",
      isBestSeller: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-gray-800 mb-3">Nuestros Productos</h2>
        <p className="text-gray-500">Descubre nuestra colección de productos únicos</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden group"
          >
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.isBestSeller && (
                <div className="absolute top-3 left-3">
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {product.badge}
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white rounded-full p-2 shadow-lg">
                  <Eye className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Solo para visualizar</span>
                <Button 
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1 rounded-lg transition-all duration-300"
                >
                  <Instagram className="w-3 h-3 mr-1" />
                  Pedir por IG
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 text-center border border-pink-100">
        <Instagram className="w-8 h-8 text-pink-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">¿Te gustó algún producto?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Contáctanos a través de nuestro Instagram oficial para realizar tu pedido
        </p>
        <Button className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-xl transition-all duration-300">
          <Instagram className="w-4 h-4 mr-2" />
          Ir a Instagram
        </Button>
      </div>
    </div>
  );
};

export default ProductShowcase;
