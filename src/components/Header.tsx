import PageHeader from "@/components/PageHeader";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header = ({ title = "Promociones y Ofertas", subtitle }: HeaderProps) => {
  return <PageHeader title={title} subtitle={subtitle} />;
};

export default Header;
