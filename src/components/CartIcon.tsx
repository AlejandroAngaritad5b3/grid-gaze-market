
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import CartModal from "./CartModal";

interface CartIconProps {
  className?: string;
}

const CartIcon = ({ className }: CartIconProps) => {
  const { totalItems } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        className={`relative ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
      </Button>
      
      <CartModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default CartIcon;
