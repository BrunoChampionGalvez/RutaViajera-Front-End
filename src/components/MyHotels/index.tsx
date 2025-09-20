"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import HotelCreationWizard from "@/components/HotelCreationWizard";
import { UserContext } from "@/context/userContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/free-mode";
import { FreeMode, Pagination } from "swiper/modules";
import EditHotelModal from "../EditHotelModal";
import { IAdminHotel } from "@/interfaces";
import { deleteHotel, updateHotel } from "@/lib/server/fetchHotels";

function MyHotels() {
  const { user, getHotelsByAdmin } = useContext(UserContext);
  const [selectedHotel, setSelectedHotel] = useState<IAdminHotel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hotels = user?.hotels || [];
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (!fetchedOnce && user?.id && user.isAdmin) {
      getHotelsByAdmin(user.id);
      setFetchedOnce(true);
    }
  }, [user?.id, user?.isAdmin, getHotelsByAdmin, fetchedOnce]);

  const handleEditClick = (hotel: IAdminHotel) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
  };

  const handleSaveChanges = async (updatedHotel: Partial<IAdminHotel>) => {
    if (selectedHotel) {
      try {
        const hotelId = selectedHotel.id;
        const updatedData = await updateHotel(hotelId, updatedHotel);
        console.log("Hotel actualizado", updatedData);
        getHotelsByAdmin(user?.id || "");
      } catch (error) {
        console.error("Error al actualizar el hotel:", error);
      }
    }
    handleCloseModal();
  };
  const handleDeleteHotel = async (hotelId: string) => {
    try {
      const success = await deleteHotel(hotelId);
      if (success) {
        getHotelsByAdmin(user?.id || "");
        handleCloseModal();
        alert("El hotel ha sido eliminado exitosamente.");
      }
    } catch (error) {
      console.error("Error eliminando hotel:", error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {isModalOpen && (
        <EditHotelModal
          hotel={selectedHotel}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
          onDelete={handleDeleteHotel}
        />
      )}
      <div className="flex justify-between items-center mx-4 py-4 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-20 border-b">
        <div className="flex-1">
          <h1 className="text-4xl font-semibold">Mis hoteles</h1>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex px-4 py-3 text-white bg-red-500 hover:bg-red-600 focus:bg-red-700 rounded-md"
          >
            <Image
              src={'/create2.png'}
              alt='Crear'
              width={24}
              height={24}
              className='mr-2'
            />
            Publicar hotel
          </button>
        </div>
      </div>
      {isWizardOpen && (
        <HotelCreationWizard onFinished={() => setIsWizardOpen(false)} />
      )}
      <div className="p-6 flex-1 overflow-hidden">
        <div className="w-full">
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1, spaceBetween: 20 },
              900: { slidesPerView: 2, spaceBetween: 24 },
              1280: { slidesPerView: 3, spaceBetween: 24 },
            }}
            freeMode
            pagination={{ clickable: true }}
            modules={[FreeMode, Pagination]}
            className="w-full"
          >
          {hotels && hotels.length > 0 ? (
            hotels.map((hotel) => (
              <SwiperSlide key={hotel.id} className="w-full max-w-xs">
                <div className="overflow-hidden rounded-lg shadow-lg mb-4">
                  <div>
                    {hotel.images && hotel.images.length > 0 ? (
                      <div className="">
                        <Image
                          unoptimized
                          src={hotel.images[0]}
                          alt={hotel.name}
                          width={500}
                          height={100}
                          className="w-full rounded-t-lg aspect-square object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center">
                        <p className="">No hay imágenes disponibles.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 md:p-4 flex flex-col space-y-1">
                    <div>
                      <h2 className="font-bold text-xl text-center mb-2">
                        {hotel.name}
                      </h2>
                      <hr className="hr-text mb-3" data-content="" />
                      <p className="line-clamp-2 overflow-hidden">
                        {hotel.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        E-mail: {hotel.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dirección: {hotel.address}, {hotel.city},{" "}
                        {hotel.country}
                      </p>
                      <p className="line-clamp-1 overflow-hidden text-sm text-gray-600">
                        Servicios: {hotel.services.join(", ")}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        className="flex text-white items-center px-3
                      py-2 mt-2 rounded-md border-2 border-gray-500 hover:bg-gray-500 invert hover:invert-0 duration-200 focus:scale-95"
                        onClick={() => handleEditClick(hotel)}
                      >
                        <Image
                          src={"/edit2.png"}
                          alt="Edit"
                          width={20}
                          height={20}
                          className="mr-2"
                        />
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))
          ) : (
            <div className="text-center py-4">
              No tienes hoteles registrados.
            </div>
          )}
          </Swiper>
        </div>
      </div>
    </div>
  );
}

export default MyHotels;
