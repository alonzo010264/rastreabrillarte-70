import { Card, CardContent } from "@/components/ui/card";
import margarita from "@/assets/productos/margarita.jpg";
import aretes from "@/assets/productos/aretes-flores.webp";
import pulseras from "@/assets/productos/pulseras-mariposas.webp";

const ProductGallery = () => {
  const products = [
    {
      id: 1,
      name: "Pulsera Margarita",
      image: margarita,
      description: "Elegante pulsera de perlas con diseño floral",
    },
    {
      id: 2,
      name: "Aretes de Flores",
      image: aretes,
      description: "Hermoso set de aretes con flores coloridas",
    },
    {
      id: 3,
      name: "Pulseras Mariposas",
      image: pulseras,
      description: "Colección de pulseras tejidas con mariposas",
    },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4">
            Nuestra Galería
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubre algunos de nuestros productos más populares
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-500 animate-fade-in hover:-translate-y-2"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-xl font-medium mb-2">{product.name}</h3>
                    <p className="text-sm opacity-90">{product.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <p className="text-muted-foreground mb-4">
            ¿Te interesa alguno de nuestros productos?
          </p>
          <a
            href="https://www.instagram.com/brillarte.do.oficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            📱 Contáctanos por Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
