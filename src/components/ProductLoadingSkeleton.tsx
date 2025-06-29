
const ProductLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-32 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-96 bg-gray-300 rounded-xl"></div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductLoadingSkeleton;
