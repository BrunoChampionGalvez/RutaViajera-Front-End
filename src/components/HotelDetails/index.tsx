"use client";

import useGoogleMapsDataLocation from "../../lib/googleMaps/googleMapsData";
import { IHotelDetail } from "@/interfaces";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Rating from "../Rating";
import PostReview from "../PostReview";
import BookingForm from "../BookingForm";
import Image from "next/image";
import { useContext } from "react";
import { FaStar } from "react-icons/fa";
import { UserContext } from "@/context/userContext";

interface Props {
  hotel: IHotelDetail | null;
}

const HotelDetail: React.FC<Props> = ({ hotel }) => {
  const { isLoaded, mapCenter, marker } = useGoogleMapsDataLocation(hotel);
  const { isAdmin } = useContext(UserContext);

  if (!hotel)
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );

  if (!isLoaded)
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );

  if (!mapCenter)
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading map...</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center mx-auto w-4/5 mt-8">
      <div className="w-full mb-4">
        <div className="flex flex-col lg:flex-row w-full h-auto lg:h-96 mb-4">
          <Image
            unoptimized
            src={hotel.images[0]}
            alt={hotel.name}
            width={400}
            height={300}
            className="object-cover rounded-lg flex-1 m-2"
          />
          <div className="w-full lg:w-1/2 mb-4 flex-1 m-4">
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

        <div className="lg:flex block">
          <div className="lg:relative w-full mb-4 rounded-lg overflow-hidden m-2 flex-1">
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ height: "600px", width: "100%" }}
                center={mapCenter}
                zoom={12}
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
            )}
          </div>
          {!isAdmin ? (
            <div className="flex-1 m-2">
              <BookingForm hotel={hotel} />
            </div>
          ) : (
            <div className="flex-1 m-2"></div>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 m-2">
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
          <div className="flex-1 m-4">
            <PostReview />
          </div>
        </div>
      </div>

      <div className="w-full mb-4"></div>
    </div>
  );
};

export default HotelDetail;
