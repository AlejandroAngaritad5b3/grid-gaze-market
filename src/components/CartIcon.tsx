
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";

interface CartIconProps {
  className?: string;
}

const CartIcon = ({ className }: CartIconProps) => {
  const { totalItems } = useCart();

  return (
    <Button variant="ghost" className={`relative ${className}`}>
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
  );
};

export default CartIcon;
