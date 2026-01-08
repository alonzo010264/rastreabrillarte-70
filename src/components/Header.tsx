import brillarteLogo from "@/assets/brillarte-logo-new-optimized.webp";
const Header = () => {
  return <header className="bg-white py-12 px-4 border-b border-gray-100">
      <div className="container mx-auto text-center">
        <div className="flex items-center justify-center mb-6 animate-scale-in">
          <img src={brillarteLogo} alt="BRILLARTE Logo" width="96" height="96" className="h-24 w-auto transition-transform duration-300 hover:scale-110" />
        </div>
        <p className="text-gray-500 text-lg font-light animate-fade-in animation-delay-200">Promociones y Ofertas </p>
      </div>
    </header>;
};
export default Header;