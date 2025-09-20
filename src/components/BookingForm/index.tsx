"use client";

import React, { useState, useEffect, useContext } from "react";
import { IHotelDetail, ISelectedRoom, ICreateBooking } from "@/interfaces";
import { UserContext } from "@/context/userContext";
import { postBooking } from "@/lib/server/fetchHotels";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  hotel: IHotelDetail;
}

const BookingForm: React.FC<Props> = ({ hotel }) => {
  const router = useRouter();
  const { user, isLogged, setUser } = useContext(UserContext);
  const [selectedRooms, setSelectedRooms] = useState<ISelectedRoom[]>([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getUserId = (): string | null => {
    // First try to get from user context
    if (user?.id) {
      return user.id;
    }
    
    // If not available, try to get from token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          return decoded.id;
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    }
    
    return null;
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const updateRoomQuantity = (roomTypeId: string, quantity: number) => {
    if (quantity === 0) {
      setSelectedRooms(prev => prev.filter(room => room.roomTypeId !== roomTypeId));
      return;
    }

    const roomType = hotel.roomstype?.find(rt => rt.id === roomTypeId);
    if (!roomType) return;

    const nights = calculateNights(checkInDate, checkOutDate);
    const totalPrice = (roomType.price || 0) * quantity * nights;

    setSelectedRooms(prev => {
      const existingIndex = prev.findIndex(room => room.roomTypeId === roomTypeId);
      const newRoom: ISelectedRoom = {
        roomTypeId,
        roomTypeName: roomType.name || "",
        quantity,
        price: roomType.price || 0,
        checkInDate,
        checkOutDate,
        totalPrice,
        nights
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRoom;
        return updated;
      } else {
        return [...prev, newRoom];
      }
    });
  };

  const getRoomQuantity = (roomTypeId: string): number => {
    const room = selectedRooms.find(r => r.roomTypeId === roomTypeId);
    return room ? room.quantity : 0;
  };

  useEffect(() => {
    // Recalculate all selected rooms when dates change
    if (checkInDate && checkOutDate && selectedRooms.length > 0) {
      const updatedRooms = selectedRooms.map(room => {
        const nights = calculateNights(checkInDate, checkOutDate);
        return {
          ...room,
          checkInDate,
          checkOutDate,
          nights,
          totalPrice: room.price * room.quantity * nights
        };
      });
      setSelectedRooms(updatedRooms);
    }
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    // Calculate total amount
    const total = selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
    setTotalAmount(total);
  }, [selectedRooms]);

  const handleBooking = async () => {
    if (!isLogged) {
      setError("Debe iniciar sesión para hacer una reserva");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("No se pudo obtener la información del usuario");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError("Debe seleccionar fechas de entrada y salida");
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError("La fecha de salida debe ser posterior a la de entrada");
      return;
    }

    if (selectedRooms.length === 0) {
      setError("Debe seleccionar al menos una habitación");
      return;
    }

    setIsBooking(true);
    setError("");

    try {
      const toISO = (dateStr: string) => {
        // If already ISO, normalize
        if (dateStr.includes('T')) return new Date(dateStr).toISOString();
        // Build a Date using the components in local time then produce an ISO string that keeps that calendar date
        const [y,m,d] = dateStr.split('-').map(Number);
        const localDate = new Date(y, m - 1, d, 12, 0, 0); // noon local to avoid DST edge
        // Represent stay boundaries as start-of-day at local, but keep date semantics (strip time to 00:00Z for consistency in backend comparisons)
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2,'0');
        const day = String(localDate.getDate()).padStart(2,'0');
        return `${year}-${month}-${day}T00:00:00.000Z`;
      };

      // Duplicate entries per quantity because backend expects one record per room requested
      const roomTypesIdsAndDates = selectedRooms.flatMap(room =>
        Array(room.quantity).fill(null).map(() => ({
          roomTypeId: room.roomTypeId,
          // Treat stay as [checkIn, checkOut) so checkOut date is non-inclusive; backend currently compares with <= / >=
          checkInDate: toISO(checkInDate),
          checkOutDate: toISO(checkOutDate)
        }))
      );

      const bookingData: ICreateBooking = {
        customerId: userId,
        hotelId: hotel.id,
        roomTypesIdsAndDates
      };

      const response = await postBooking({
        ...bookingData,
        totalPayment: totalAmount
      });

      if (response?.error) {
        const rawMsg = response.message || '';
        const mapError = (msg: string) => {
          if (/No available rooms for the specified dates/i.test(msg) || /No hay fechas libres/i.test(msg)) {
            return 'No hay habitaciones disponibles para esas fechas. Prueba cambiar las fechas o reducir la cantidad de habitaciones.';
          }
          if (/El roomTypeId enviado/i.test(msg)) {
            return 'El tipo de habitación seleccionado no pertenece a este hotel.';
          }
            // Remove technical prefix like "Error en la solicitud: 400 - " if present
          return 'No se pudo crear la reserva. Inténtalo nuevamente en unos instantes.';
        };
        setError(mapError(rawMsg));
        return;
      }

      // Optimistic append of booking stub to user context (will be refined on next fetch)
      try {
        setUser((prev: any) => {
          if (!prev) return prev;
          const newBooking = {
            id: response.id,
            date: new Date().toISOString(),
            bookingDetails: {
              total: totalAmount,
              status: 'CONFIRMED',
              hotel: { name: hotel.name },
              availabilities: roomTypesIdsAndDates.map((r) => ({
                startDate: r.checkInDate,
                endDate: r.checkOutDate,
                room: {
                  roomtype: {
                    id: r.roomTypeId,
                    name: selectedRooms.find(sr => sr.roomTypeId === r.roomTypeId)?.roomTypeName || '',
                    price: selectedRooms.find(sr => sr.roomTypeId === r.roomTypeId)?.price || 0,
                  }
                }
              }))
            }
          };
          const bookings = Array.isArray(prev.bookings) ? [...prev.bookings, newBooking] : [newBooking];
          const updated = { ...prev, bookings };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      } catch (e) { console.warn('Optimistic booking update failed', e); }

      // Store confirmation locally
      // Persist confirmation data in the same shape the confirmation page expects
      // (bookingId, hotelName, selectedRooms[], totalAmount, checkInDate, checkOutDate)
      // We store minimal selectedRooms info (nights & totalPrice) so page can render without recomputation.
      const nightsPerRoom = (room: typeof selectedRooms[number]) => {
        const start = new Date(room.checkInDate).getTime();
        const end = new Date(room.checkOutDate).getTime();
        const diff = Math.max(1, Math.ceil((end - start)/(1000*60*60*24)));
        return diff;
      };
      localStorage.setItem(
        'bookingConfirmation',
        JSON.stringify({
          bookingId: response.id,
          hotelName: hotel.name,
          selectedRooms: selectedRooms.map(r => ({
            roomTypeId: r.roomTypeId,
            roomTypeName: r.roomTypeName,
            quantity: r.quantity,
            price: r.price,
            checkInDate: r.checkInDate,
            checkOutDate: r.checkOutDate,
            nights: nightsPerRoom(r),
            totalPrice: r.price * r.quantity * nightsPerRoom(r)
          })),
          totalAmount: totalAmount,
          checkInDate: selectedRooms[0]?.checkInDate || '',
          checkOutDate: selectedRooms[0]?.checkOutDate || ''
        })
      );

      router.push(`/booking-confirmation?bookingId=${response.id}`);
    } catch (e: any) {
      console.error('Error al realizar la reserva:', e);
      setError(e.message || 'Error desconocido al crear la reserva');
    } finally {
      setIsBooking(false);
    }
  };

  const isValidBooking = () => {
    return checkInDate && 
           checkOutDate && 
           checkOutDate > checkInDate && 
           selectedRooms.length > 0 && 
           isLogged;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Reservar Habitaciones</h2>
      
      {/* Date Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de entrada
            </label>
            <input
              type="date"
              min={getTodayDate()}
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de salida
            </label>
            <input
              type="date"
              min={checkInDate || getTodayDate()}
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {checkInDate && checkOutDate && (
          <p className="text-sm text-gray-600">
            {calculateNights(checkInDate, checkOutDate)} noche(s)
          </p>
        )}
      </div>

      {/* Room Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Seleccionar Habitaciones</h3>
        <div className="space-y-4">
          {hotel.roomstype?.map((roomType) => (
            <div key={roomType.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    {roomType.images && roomType.images.length > 0 && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          unoptimized
                          src={roomType.images[0]}
                          alt={roomType.name || "Room"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{roomType.name}</h4>
                      <p className="text-sm text-gray-600">
                        Capacidad: {roomType.capacity} personas
                      </p>
                      <p className="text-sm text-gray-600">
                        {roomType.totalBeds} cama(s) • {roomType.totalBathrooms} baño(s)
                      </p>
                      <p className="text-lg font-bold text-secondary">
                        ${roomType.price?.toLocaleString()}/noche
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-4">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">
                      Cantidad:
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateRoomQuantity(
                          roomType.id as string, 
                          Math.max(0, getRoomQuantity(roomType.id as string) - 1)
                        )}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 cursor-pointer"
                        disabled={!checkInDate || !checkOutDate}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {getRoomQuantity(roomType.id as string)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateRoomQuantity(
                          roomType.id as string, 
                          getRoomQuantity(roomType.id as string) + 1
                        )}
                        className="w-8 h-8 rounded-full bg-[#f8263a] hover:bg-[#d71f32] text-white flex items-center justify-center cursor-pointer"
                        disabled={!checkInDate || !checkOutDate}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {getRoomQuantity(roomType.id as string) > 0 && checkInDate && checkOutDate && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">
                        {getRoomQuantity(roomType.id as string)} × ${roomType.price?.toLocaleString()} × {calculateNights(checkInDate, checkOutDate)} noche(s)
                      </p>
                      <p className="font-bold text-green-600">
                        Subtotal: ${((roomType.price || 0) * getRoomQuantity(roomType.id as string) * calculateNights(checkInDate, checkOutDate)).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Summary */}
      {selectedRooms.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Resumen de la Reserva</h3>
          <div className="space-y-2">
            {selectedRooms.map((room) => (
              <div key={room.roomTypeId} className="flex justify-between">
                <span className="text-gray-700">
                  {room.quantity}x {room.roomTypeName} ({room.nights} noche(s))
                </span>
                <span className="font-medium">
                  ${room.totalPrice.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total a pagar:</span>
                <span className="text-green-600">${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Booking Button */}
      <button
        onClick={handleBooking}
        disabled={!isValidBooking() || isBooking}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          isValidBooking() && !isBooking
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isBooking ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Procesando reserva...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">Reservar</span>
            <Image
              src="/continue.png"
              alt="Continue"
              width={20}
              height={20}
            />
          </div>
        )}
      </button>

      {!isLogged && (
        <p className="mt-3 text-sm text-gray-500 text-center">
          <span>Debe </span>
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            iniciar sesión
          </button>
          <span> para hacer una reserva</span>
        </p>
      )}
    </div>
  );
};

export default BookingForm;