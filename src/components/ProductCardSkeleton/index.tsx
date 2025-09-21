import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

// Simple tailwind-based skeleton placeholder
const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 8 }) => {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex flex-col"
        >
          <div className="bg-gray-200 h-32 w-full" />
          <div className="p-3 flex-1 flex flex-col gap-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="mt-auto flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-10" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
