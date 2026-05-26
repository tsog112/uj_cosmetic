'use client';

export default function SkeletonCard({ 
  height = 'h-28', 
  className = '' 
}: { 
  height?: string; 
  className?: string 
}) {
  return (
    <div className={`rounded-[20px] animate-shimmer ${height} ${className}`}>
      <span className="sr-only">Уншиж байна...</span>
    </div>
  );
}
