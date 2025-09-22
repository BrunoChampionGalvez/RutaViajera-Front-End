import Link from "next/link";
import Rating from "../Rating";
import Image from "next/image";
import { getApiBase } from "@/lib/apiBase";

interface Hotel {
  id: string;
  name: string;
  country: string;
  city: string;
  rating: string;
  images: string[];
}

interface ProductCardProps {
  hotel: Hotel;
}

function ProductCard({ hotel }: ProductCardProps) {
  const normalizeImageUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/uploads/')) return `${getApiBase().replace(/\/$/, '')}${url}`;
    return url;
  };
  return (
    <div className="w-full">
      <Link href={`/hotel-detail/${hotel.id}`} className="group block">
        <div className="rounded-lg transition-shadow shadow-none group-hover:shadow-lg overflow-hidden">
          <div className="relative w-full aspect-square overflow-hidden">
            <Image
              unoptimized
              fill
              src={normalizeImageUrl(hotel.images[0])}
              alt={hotel.name}
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              onError={(e:any)=>{ e.currentTarget.style.opacity='0'; console.warn('No se pudo cargar imagen', hotel.images[0]); }}
            />
            {/* Overlay with icons (exactly covering the image) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-80 bg-black/60 transition-opacity z-10">
              <div className="flex gap-2 justify-center items-center text-white pointer-events-none">
                {/* Plus icon */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {/* Booking icon (calendar) */}
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 3v4M8 3v4M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-2 md:p-4 flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{hotel.name}</div>
              <div className="w-[80px]">
                <Rating rating={hotel.rating} />
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <span>
                {hotel.city}, {hotel.country}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              {/* <span>{5} km de distancia</span> */}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
