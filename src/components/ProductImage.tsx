
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProductImageProps {
  imageUrl: string | null;
  productName: string;
  category: string | null;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  getImageUrl: (imageUrl: string | null) => string;
}

const ProductImage = ({ 
  imageUrl, 
  productName, 
  category, 
  onImageError, 
  getImageUrl 
}: ProductImageProps) => {
  return (
    <div className="lg:col-span-1">
      <Card className="overflow-hidden shadow-lg">
        <div className="relative">
          <img 
            src={getImageUrl(imageUrl)} 
            alt={productName} 
            className="w-full h-96 lg:h-[500px] object-cover"
            onError={onImageError}
          />
          {category && (
            <Badge className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white">
              {category}
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductImage;
