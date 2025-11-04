import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ProductShowcase } from "@/components/ProductShowcase";

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ProductShowcase />
      <Footer />
    </div>
  );
};

export default Products;