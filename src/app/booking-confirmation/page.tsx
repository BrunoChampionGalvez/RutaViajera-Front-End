"use client";

// Página depende de localStorage y query string -> se marca como dinámica para evitar prerender.
export const dynamic = 'force-dynamic'; // eliminar si se configura a nivel de rutas
// Nota: no exportamos revalidate aquí porque es un componente cliente; causar build error en algunos entornos.

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ISelectedRoom } from "@/interfaces";
import Image from "next/image";
import { fetchBookingById } from "@/lib/server/fetchHotels";

interface BookingConfirmationData {
  bookingId: string;
  hotelName: string;
  selectedRooms: ISelectedRoom[];
  totalAmount: number;
  checkInDate: string;
  checkOutDate: string;
}

const BookingConfirmationInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmationData, setConfirmationData] = useState<BookingConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("BookingConfirmationPage useEffect triggered");
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("localStorage length:", localStorage.length);
    
    const readBookingData = () => {
  const data = localStorage.getItem('bookingConfirmation');
      console.log("Raw data from localStorage:", data);
      console.log("Data type:", typeof data);
      console.log("Data length:", data?.length);
      
      if (data) {
        try {
          const raw = JSON.parse(data);
          console.log("Parsed booking confirmation data:", raw);
          console.log("Parsed data type:", typeof raw);
          console.log("Parsed data keys:", Object.keys(raw));
          // Normalize legacy shape (roomTypes + totalPayment) to the expected shape
          let normalized: any = raw;
          if (!raw.selectedRooms && Array.isArray(raw.roomTypes)) {
            // Legacy structure from previous implementation
            normalized = {
              bookingId: raw.bookingId || raw.id,
              hotelName: raw.hotelName || 'Hotel',
              selectedRooms: raw.roomTypes.map((rt: any) => ({
                roomTypeId: rt.roomTypeId,
                roomTypeName: rt.name,
                quantity: rt.quantity,
                price: rt.price || 0,
                checkInDate: raw.checkInDate || '',
                checkOutDate: raw.checkOutDate || '',
                nights: raw.nights || 1,
                totalPrice: (rt.price || 0) * (rt.quantity || 1) * (raw.nights || 1)
              })),
              totalAmount: raw.totalPayment || raw.totalAmount || 0,
              checkInDate: raw.checkInDate || '',
              checkOutDate: raw.checkOutDate || ''
            };
          } else if (raw.selectedRooms) {
            normalized = {
              bookingId: raw.bookingId || raw.id,
              hotelName: raw.hotelName || 'Hotel',
              selectedRooms: raw.selectedRooms,
              totalAmount: raw.totalAmount || raw.totalPayment || 0,
              checkInDate: raw.checkInDate || raw.selectedRooms[0]?.checkInDate || '',
              checkOutDate: raw.checkOutDate || raw.selectedRooms[0]?.checkOutDate || ''
            };
          }
          // Recompute total defensively from selectedRooms if present
          if (Array.isArray(normalized.selectedRooms) && normalized.selectedRooms.length > 0) {
            const recomputed = normalized.selectedRooms.reduce((acc: number, r: any) => {
              const per = typeof r.totalPrice === 'number'
                ? r.totalPrice
                : (r.price || 0) * (r.quantity || 0) * (r.nights || 1);
              return acc + per;
            }, 0);
            if (recomputed > 0 && Math.abs(recomputed - (normalized.totalAmount || 0)) > 0.01) {
              normalized.totalAmount = recomputed;
            }
          }
          setConfirmationData(normalized);
          setLoading(false);
          return true;
        } catch (error) {
          console.error("Error parsing booking confirmation data:", error);
          setConfirmationData(null);
          setLoading(false);
          return false;
        }
      } else {
        console.log("No booking confirmation data found in localStorage");
        return false;
      }
    };

    // Try to read data immediately
    if (!readBookingData()) {
      // If no data found, wait a bit and try again (in case of navigation timing)
      const retryTimeout = setTimeout(() => {
        console.log("Retrying to read booking data...");
        if (!readBookingData()) {
          // Still no localStorage data, attempt fetch by bookingId in URL
          const bookingId = searchParams.get('bookingId');
          if (bookingId) {
            console.log('Attempting to fetch booking by id:', bookingId);
            fetchBookingById(bookingId)
              .then((booking) => {
                // Transform booking entity into confirmationData shape
                const hotelName = booking.bookingDetails?.hotel?.name || 'Hotel';
                let totalAmount = booking.bookingDetails?.total || 0;
                // Group availabilities by roomtype
                const roomTypeMap = new Map<string, { roomTypeName: string; quantity: number; price: number; nights: number; firstStart: string; firstEnd: string }>();
                booking.bookingDetails?.availabilities?.forEach((av: any) => {
                  const rt = av.room?.roomtype;
                  if (!rt) return;
                  const key = rt.id;
                  const start = av.startDate;
                  const end = av.endDate;
                  const nights = Math.ceil((new Date(end).getTime() - new Date(start).getTime())/(1000*60*60*24));
                  if (!roomTypeMap.has(key)) {
                    roomTypeMap.set(key, { roomTypeName: rt.name, quantity: 1, price: rt.price, nights, firstStart: start, firstEnd: end });
                  } else {
                    const item = roomTypeMap.get(key)!;
                    item.quantity += 1;
                  }
                });
                const selectedRooms: ISelectedRoom[] = Array.from(roomTypeMap.entries()).map(([roomTypeId, v]) => ({
                  roomTypeId,
                  roomTypeName: v.roomTypeName,
                  quantity: v.quantity,
                  price: v.price,
                  checkInDate: v.firstStart,
                  checkOutDate: v.firstEnd,
                  totalPrice: v.price * v.quantity * v.nights,
                  nights: v.nights
                }));
                // Recompute totalAmount from derived rooms if mismatch
                const recomputedFetchTotal = selectedRooms.reduce((acc, r) => acc + (r.totalPrice || ((r.price||0)*(r.quantity||0)*(r.nights||1))), 0);
                if (recomputedFetchTotal > 0 && Math.abs(recomputedFetchTotal - totalAmount) > 0.01) {
                  totalAmount = recomputedFetchTotal;
                }
                const first = selectedRooms[0];
                const confirmationFromFetch = {
                  bookingId: booking.id,
                  hotelName,
                  selectedRooms,
                  totalAmount,
                  checkInDate: first?.checkInDate || '',
                  checkOutDate: first?.checkOutDate || ''
                };
                console.log('Constructed confirmation data from API:', confirmationFromFetch);
                setConfirmationData(confirmationFromFetch);
                setLoading(false);
              })
              .catch(err => {
                console.error('Error fetching booking by id fallback:', err);
                setConfirmationData(null);
                setLoading(false);
              });
          } else {
            setConfirmationData(null);
            setLoading(false);
          }
        }
      }, 100);
      
      return () => clearTimeout(retryTimeout);
    }
  }, []);

  // Cleanup localStorage only when navigating away from this page
  useEffect(() => {
    // Only clean up when component unmounts (user navigates away)
    return () => {
      localStorage.removeItem('bookingConfirmation');
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const generateRoomNumbers = (selectedRooms?: ISelectedRoom[]) => {
    if (!Array.isArray(selectedRooms) || selectedRooms.length === 0) return [];
    const roomNumbers: { type: string; numbers: string[] }[] = [];
    let currentRoomNumber = 101;
    for (const room of selectedRooms) {
      if (!room || typeof room.quantity !== 'number' || room.quantity <= 0) continue;
      const numbers: string[] = [];
      for (let i = 0; i < room.quantity; i++) {
        numbers.push(currentRoomNumber.toString());
        currentRoomNumber++;
      }
      roomNumbers.push({ type: room.roomTypeName || 'Habitación', numbers });
    }
    return roomNumbers;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No se encontraron datos de reserva
          </h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-900"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const roomNumbers = generateRoomNumbers(confirmationData.selectedRooms);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-gray-600">
            Su reserva ha sido procesada exitosamente
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-red-600 text-white p-6">
            <h2 className="text-2xl font-bold">{confirmationData.hotelName}</h2>
            <p className="text-blue-100">ID de Reserva: {confirmationData.bookingId}</p>
          </div>

          <div className="p-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Fecha de Entrada</h3>
                <p className="text-gray-600">{formatDate(confirmationData.checkInDate)}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Fecha de Salida</h3>
                <p className="text-gray-600">{formatDate(confirmationData.checkOutDate)}</p>
              </div>
            </div>

            {/* Room Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Habitaciones Reservadas</h3>
              <div className="space-y-4">
                {roomNumbers.length === 0 && (
                  <p className="text-sm text-gray-500">No hay detalles de habitaciones para mostrar.</p>
                )}
                {roomNumbers.map((roomGroup, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{roomGroup.type}</h4>
                    <div className="flex flex-wrap gap-2">
                      {roomGroup.numbers.map((number, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          Habitación {number}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen de la Reserva</h3>
              <div className="space-y-2">
                {confirmationData.selectedRooms.map((room, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">
                        {room.quantity}x {room.roomTypeName}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({room.nights} noche{room.nights !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      ${room.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Total Pagado:</span>
                    <span className="text-2xl font-bold text-red-600">
                      ${confirmationData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Información Importante</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Check-in: A partir de las 15:00 hrs</li>
                <li>• Check-out: Hasta las 12:00 hrs</li>
                <li>• Presentar documento de identidad válido al momento del check-in</li>
                <li>• Los números de habitación pueden cambiar según disponibilidad del hotel</li>
                <li>• Guarde este comprobante para presentar en recepción</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Comprobante
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('bookingConfirmation');
              router.push('/dashboard/bookings');
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ver Mis Reservas
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('bookingConfirmation');
              router.push('/');
            }}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper con Suspense para uso de useSearchParams (CSR bailout)
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <BookingConfirmationInner />
    </Suspense>
  );
}