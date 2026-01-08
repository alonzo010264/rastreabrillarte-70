import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { ProductShowcase } from "@/components/ProductShowcase";

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Productos" subtitle="Explora nuestra colección" />
      <ProductShowcase />
      <Footer />
    </div>
  );
};

export default Products;