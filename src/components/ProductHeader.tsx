
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CartIcon from "@/components/CartIcon";

const ProductHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6 bg-[#ffd300]">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al catálogo</span>
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Tech Market</h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="text-sm"
            >
              Admin Dashboard
            </Button>
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProductHeader;
