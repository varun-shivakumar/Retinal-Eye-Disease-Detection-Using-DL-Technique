import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const SkeletonLoader = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto mt-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton width={120} height={24} />
        <Skeleton width={80} height={24} borderRadius={20} />
      </div>
      
      {/* Image Skeleton */}
      <div className="mb-6">
        <Skeleton height={250} borderRadius={16} />
      </div>
      
      {/* Details Skeleton */}
      <div className="space-y-3">
        <Skeleton count={1} height={20} width="100%" />
        <Skeleton count={1} height={20} width="80%" />
        <div className="pt-4">
           <Skeleton height={40} borderRadius={8} />
        </div>
      </div>
    </div>
  );
};