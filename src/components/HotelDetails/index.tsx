"use client";

import useGoogleMapsDataLocation from "../../lib/googleMaps/googleMapsData";
import { IHotelDetail } from "@/interfaces";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Rating from "../Rating";
import PostReview from "../PostReview";
import BookingForm from "../BookingForm";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";
import { FaStar } from "react-icons/fa";
import { UserContext } from "@/context/userContext";

interface Props {
  hotel: IHotelDetail | null;
}

const HotelDetail: React.FC<Props> = ({ hotel }) => {
  const { isLoaded, mapCenter, marker } = useGoogleMapsDataLocation(hotel);
  const { isAdmin } = useContext(UserContext);
  const bookingRef = useRef<HTMLDivElement | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const [mapHeight, setMapHeight] = useState<number | undefined>(undefined);

  // Sync heights using ResizeObserver on desktop (lg breakpoint ~1024px)
  // Previous implementation sometimes missed attaching because bookingRef.current was null on first effect run.
  // This version retries briefly until the element exists and re-attaches on hotel or map load state changes.
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let retryTimer: any = null;

    const updateHeight = () => {
      if (typeof window === 'undefined') return;
      const el = bookingRef.current;
      if (!el) return;
      if (window.innerWidth >= 1024) {
        const h = el.getBoundingClientRect().height;
        setMapHeight(h);
      } else {
        setMapHeight(undefined); // auto size on mobile
      }
    };

    const attach = () => {
      const el = bookingRef.current;
      if (!el) {
        // Retry a few times (up to ~1s) until the form mounts
        if (!retryTimer) {
          let attempts = 0;
          retryTimer = setInterval(() => {
            attempts += 1;
            const target = bookingRef.current;
            if (target) {
              updateHeight();
              resizeObserver = new ResizeObserver(updateHeight);
              resizeObserver.observe(target);
              clearInterval(retryTimer);
              retryTimer = null;
            } else if (attempts > 10) {
              clearInterval(retryTimer);
              retryTimer = null;
            }
          }, 100);
        }
        return;
      }
      updateHeight();
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(el);
    };

    attach();
    window.addEventListener('resize', updateHeight);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (retryTimer) clearInterval(retryTimer);
      window.removeEventListener('resize', updateHeight);
    };
  }, [hotel, isLoaded]);

  // We don't early-return on map loading to keep layout space reserved.
  if (!hotel) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando hotel...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mx-auto w-4/5 mt-8">
      <div className="w-full mb-4">
        <div className="flex flex-col lg:flex-row w-full gap-6 h-auto lg:min-h-[380px]">
          <div className="relative flex-1 aspect-video lg:aspect-auto lg:h-96 overflow-hidden rounded-lg">
            <Image
              unoptimized
              src={hotel.images[0]}
              alt={hotel.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex-1 mb-4 px-1 lg:px-0">
            <div className="flex flex-col lg:flex-row justify-between">
              <h2 className="text-3xl font-bold text-center lg:text-left pb-4">
                {hotel.name}
              </h2>
              <div className="flex justify-center lg:justify-end">
                <Rating rating={hotel.rating} />
              </div>
            </div>
            <hr className="hr-text mt-3 lg:mt-0 mb-3" data-content="" />
            <div className="block">
              <h2 className="text-2xl font-semibold">Descripción</h2>
              <p className="pb-4">{hotel.description}</p>
              <h2 className="text-2xl font-semibold">Servicios del Hotel</h2>
              <ul className="list-disc pl-5">
                {hotel.services.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row w-full gap-6 mt-6 items-stretch">
          <div
            ref={mapWrapperRef}
            className={`relative rounded-lg overflow-hidden w-full ${!mapHeight ? 'h-80 sm:h-96' : ''} lg:flex-1`}
            style={mapHeight ? { height: mapHeight } : undefined}
          >
            {isLoaded && mapCenter ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={12}
                mapContainerClassName="h-full"
              >
                {marker && marker.getPosition() && (
                  <Marker
                    position={{
                      lat: (marker.getPosition()?.lat() || 0) as number,
                      lng: (marker.getPosition()?.lng() || 0) as number,
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse text-gray-500 text-sm">
                Cargando mapa...
              </div>
            )}
          </div>
          {!isAdmin ? (
            <div className="flex-1" ref={bookingRef}>
              <BookingForm hotel={hotel} />
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row w-full gap-6 mt-6">
          <div className="flex-1">
            <h2 className="font-semibold text-2xl mb-2">Opiniones</h2>
            {hotel?.reviews && hotel.reviews.length > 0 ? (
              <ul className="w-full">
                {hotel.reviews.map((review, index) => (
                  <li
                    key={index}
                    className="mb-4 border border-black p-4 rounded-lg"
                  >
                    <div className="flex justify-between">
                      <p className="font-light">
                        {review?.customer?.name} {review?.customer?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{review.date}</p>
                    </div>
                    <hr className="hr-text mb-3" data-content="" />
                    <div>
                      <p className="flex mb-2">
                        {Array.from({ length: review.rating }, (_, i) => (
                          <FaStar key={i} color="#FBC02D" />
                        ))}
                      </p>
                      <p>{review.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay reseñas disponibles.</p>
            )}
          </div>
          <div className="flex-1">
            <PostReview />
          </div>
        </div>
      </div>

      <div className="w-full mb-4"></div>
    </div>
  );
};

export default HotelDetail;
