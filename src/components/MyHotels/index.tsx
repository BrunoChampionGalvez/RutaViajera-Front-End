"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
// Modal wizard removed in favor of dedicated page
// import HotelCreationWizard from "@/components/HotelCreationWizard";
import Link from 'next/link';
import { UserContext } from "@/context/userContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/free-mode";
import { Pagination } from "swiper/modules";
// import EditHotelModal from "../EditHotelModal"; // replaced by HotelFullEditor
import HotelFullEditor from "../HotelFullEditor";
import { IAdminHotel } from "@/interfaces";
import { deleteHotel, updateHotel } from "@/lib/server/fetchHotels";
import { showToast } from "@/lib/toast";

function MyHotels() {
  const { user, getHotelsByAdmin, removeHotel } = useContext(UserContext);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<IAdminHotel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Filter out soft-deleted hotels immediately (prevents showing items with isDeleted flag)
  const hotels = (user?.hotels || []).filter(h => !h.isDeleted);
  // const [isWizardOpen, setIsWizardOpen] = useState(false); // deprecated (replaced by /publicar-hotel page)
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (!fetchedOnce && user?.id && user.isAdmin) {
      getHotelsByAdmin(user.id, true);
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
        if (user?.id) getHotelsByAdmin(user.id, true);
      } catch (error) {
        console.error("Error al actualizar el hotel:", error);
      }
    }
    handleCloseModal();
  };
  const handleDeleteHotel = async (hotelId: string) => {
    if (isDeleting) return; // evita clicks múltiples
    setIsDeleting(hotelId);
    try {
      const success = await deleteHotel(hotelId);
      if (success) {
        if (removeHotel) removeHotel(hotelId); // Optimista
        if (user?.id) getHotelsByAdmin(user.id, true); // Refetch forzado
        showToast("success", <p>Hotel eliminado</p>, { autoClose: 1800 });
        handleCloseModal();
      } else {
        showToast("error", <p>No se pudo eliminar el hotel.</p>, { autoClose: 2500 });
      }
    } catch (error: any) {
      console.error("Error eliminando hotel:", error);
      showToast("error", <p>Error al eliminar: {error?.message || 'Desconocido'}</p>);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
  <div className="flex flex-col h-full overflow-x-hidden w-full">
      {isModalOpen && selectedHotel && (
        <HotelFullEditor
          hotel={selectedHotel}
          onClose={handleCloseModal}
          onUpdated={() => getHotelsByAdmin(user?.id || "")}
          onDeleted={(deletedId: string) => {
            // Optimistic local removal
            if (removeHotel) removeHotel(deletedId);
            // Force refetch in background to ensure sync with backend
            if (user?.id) getHotelsByAdmin(user.id, true);
          }}
          refreshHotels={() => getHotelsByAdmin(user?.id || "")}
        />
      )}
      <div className="flex justify-between gap-3 items-center mx-2 py-4 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30 border-b">
        <h1 className="text-2xl sm:text-4xl font-semibold flex-1">Mis hoteles</h1>
        <Link href="/publicar-hotel" className="flex px-3 sm:px-4 py-2 sm:py-3 text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-md shadow text-sm sm:text-base items-center">
          <Image
            src={'/create2.png'}
            alt='Crear'
            width={20}
            height={20}
            className='mr-2'
          />
          <span className="hidden xs:inline sm:inline">Publicar hotel</span>
          <span className="sm:hidden">Publicar</span>
        </Link>
      </div>
      {/* Wizard modal removed; navigation handled by link */}
  <div className="px-2 sm:px-4 md:px-6 pt-4 flex-1 w-full overflow-x-hidden">
    <div className="w-full mx-auto max-w-[1400px] md:max-w-[1300px]">
          <Swiper
            spaceBetween={8}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.1, spaceBetween: 14 },
              900: { slidesPerView: 2, spaceBetween: 18 },
              1280: { slidesPerView: 3, spaceBetween: 20 },
            }}
            centeredSlides={false}
            pagination={{ clickable: true }}
            modules={[Pagination]}
            className="w-full myhotels-swiper"
          >
          {hotels && hotels.length > 0 ? (
            hotels.map((hotel) => (
              <SwiperSlide key={hotel.id} className="w-full flex justify-center px-1 md:px-2">
                <div className="hotel-card overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow mb-8 bg-white flex flex-col flex-1 w-full max-w-[420px] mx-auto border border-gray-100">
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
                      <div className="flex justify-center items-center h-48 bg-gray-50 text-gray-500 text-sm">
                        <p>No hay imágenes disponibles.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 md:p-4 flex flex-col space-y-1 flex-1">
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
                    <div className="flex justify-end mt-auto">
                      <button
                        className="flex text-white items-center px-3 py-2 mt-2 rounded-md border-2 border-gray-500 hover:bg-gray-500 invert hover:invert-0 duration-200 focus:scale-95"
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
          <div className="w-full flex justify-center mt-1 pb-2 relative pointer-events-none">
            {/* Swiper injects pagination absolutely; this wrapper ensures visual centering context */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyHotels;
