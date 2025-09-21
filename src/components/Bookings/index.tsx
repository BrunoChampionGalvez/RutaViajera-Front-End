"use client";

import { UserContext } from "@/context/userContext";
import { IBooking } from "@/interfaces";
import { cancelBooking, fetchCustomerBookings } from "@/lib/server/fetchUsers";
import Link from "next/link";
import { useContext, useEffect, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import { useSearchParams } from "next/navigation";
import HotelBookings from "../HotelBookings";

function Bookings() {
  const { isAdmin, user, isLogged, getBookings } = useContext(UserContext);
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  // Track bookings currently being cancelled to disable buttons
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const customerId = user?.id;
  // Primary fetch effect
  useEffect(() => {
    if (!isLogged) {
      setLoading(false);
      return;
    }
    if (!customerId) {
      // No customer id yet: retry on next render but avoid spinner lock
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchCustomerBookings(customerId);
        if (cancelled) return;
        if (Array.isArray(data)) {
          if (data.length > 0) {
            setBookings(data);
          } else if (user?.bookings && user.bookings.length > 0) {
            // Fallback if context has bookings (e.g., just set by confirmation flow)
            setBookings(user.bookings as unknown as IBooking[]);
          } else {
            setBookings([]);
          }
        } else {
          // Unexpected shape
          setBookings([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error al obtener las reservas:", err);
        setError("No se pudieron cargar las reservas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [customerId, isLogged, user?.bookings]);

  // If navigated right after a booking (e.g., query param bookingId present), try a refresh once
  useEffect(() => {
    const bookingId = searchParams?.get('bookingId');
    if (bookingId && user?.id && isLogged && !loading && bookings.length === 0) {
      getBookings(user.id);
    }
  }, [searchParams, user?.id, isLogged, loading, bookings.length, getBookings]);

  // Secondary sync: if later userContext gets bookings and local still empty
  useEffect(() => {
    if (!loading && isLogged && bookings.length === 0 && user?.bookings?.length) {
      setBookings(user.bookings as unknown as IBooking[]);
    }
  }, [loading, isLogged, bookings.length, user?.bookings]);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    const result = await Swal.fire({
      title: '¿Cancelar reserva?',
      text: 'Esta acción no se puede deshacer y podría aplicar políticas del hotel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // darker gray
      cancelButtonColor: '#888',  // lighter gray
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener'
    });
    if (!result.isConfirmed) return;

    setCancelling(prev => new Set(prev).add(bookingId));
    try {
      const success = await cancelBooking(bookingId);
      if (success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? {
          ...b,
          bookingDetails: { ...b.bookingDetails, status: 'cancelled' }
        } : b));
        if (user?.id) {
          getBookings(user.id);
        }
        await Swal.fire({
          icon: 'success',
          title: 'Reserva cancelada',
          text: 'La reserva se ha cancelado exitosamente.',
          timer: 2200,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al cancelar la reserva. Inténtalo nuevamente.'
      });
    } finally {
      setCancelling(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  }, [user?.id, getBookings]);

  const groupRoomTypes = (booking: IBooking) => {
    const map = new Map<string, { name: string; count: number }>();
    booking.bookingDetails.availabilities.forEach((av) => {
      const rt = av.room?.roomtype;
      if (!rt) return;
      if (!map.has(rt.id)) map.set(rt.id, { name: rt.name, count: 1 });
      else map.get(rt.id)!.count += 1;
    });
    return Array.from(map.values());
  };

  const computeBookingTotal = (booking: IBooking) => {
    // Derive per-room-type cost: price * nights * quantity.
    try {
      const availabilityGroups = new Map<string, { price: number; quantity: number; nights: number }>();
      booking.bookingDetails.availabilities.forEach(av => {
        const rt = av.room?.roomtype;
        if (!rt) return;
        const start = new Date(av.startDate);
        const end = new Date(av.endDate);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime())/(1000*60*60*24)));
        if (!availabilityGroups.has(rt.id)) {
          availabilityGroups.set(rt.id, { price: rt.price ?? 0, quantity: 1, nights });
        } else {
          const g = availabilityGroups.get(rt.id)!;
          g.quantity += 1;
          // Use the max nights across availabilities of same type (assumes same stay)
          g.nights = Math.max(g.nights, nights);
        }
      });
      const recomputed = Array.from(availabilityGroups.values()).reduce((acc, g) => acc + g.price * g.quantity * g.nights, 0);
      const backend = booking.bookingDetails.total || 0;
      // If backend total wildly lower (e.g., difference > 1) show recomputed to avoid confusion
      if (recomputed > 0 && Math.abs(recomputed - backend) > 1) return recomputed;
      return backend;
    } catch {
      return booking.bookingDetails.total;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-semibold mb-6">Mis reservas</h1>
      {!isLogged && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          <p>Debes iniciar sesión para ver tus reservas. <Link className="underline" href="/login">Iniciar sesión</Link></p>
        </div>
      )}
      {isLogged && (
        <>
          {loading && (
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <div className="animate-spin h-5 w-5 border-b-2 border-gray-600 rounded-full"></div>
              <span>Cargando reservas...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          {!loading && bookings.length === 0 && !error && (
            <div className="bg-white border rounded p-6 text-center text-gray-600">
              No tienes reservas aún.
            </div>
          )}
          {/* Always show personal bookings table if there are bookings, even for admins */}
          {bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead>
                  <tr className="bg-gray-800 text-white text-xs md:text-sm uppercase">
                    <th className="py-3 px-4 text-left">Reserva</th>
                    <th className="py-3 px-4 text-left">Fecha Creación</th>
                    <th className="py-3 px-4 text-left">Hotel</th>
                    <th className="py-3 px-4 text-left">Estadía</th>
                    <th className="py-3 px-4 text-left">Habitaciones</th>
                    <th className="py-3 px-4 text-left">Total</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-xs md:text-sm">
                  {bookings.map((booking) => {
                    const grouped = groupRoomTypes(booking);
                    const firstAvailability = booking.bookingDetails.availabilities[0];
                    const lastAvailability = booking.bookingDetails.availabilities[booking.bookingDetails.availabilities.length - 1];
                    const startDate = firstAvailability ? new Date(firstAvailability.startDate).toLocaleDateString() : '-';
                    const endDate = firstAvailability ? new Date(firstAvailability.endDate).toLocaleDateString() : '-';
                    return (
                      <tr key={booking.id} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-[10px] md:text-xs break-all max-w-[120px]">
                          {booking.id}
                        </td>
                        <td className="py-3 px-4">{new Date(booking.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{booking.bookingDetails.hotel.name}</td>
                        <td className="py-3 px-4">{startDate} - {endDate}</td>
                        <td className="py-3 px-4">
                          {grouped.map(g => (
                            <div key={g.name}>{g.count}x {g.name}</div>
                          ))}
                        </td>
                        <td className="py-3 px-4 font-semibold">${computeBookingTotal(booking)}</td>
                        <td className="py-3 px-4">
                          {(() => {
                            const status = booking.bookingDetails.status;
                            const baseClass = "px-2 py-1 rounded text-white text-xs";
                            let style = "bg-green-600";
                            if (/cancel/i.test(status)) style = "bg-red-500";
                            else if (/pending|pendiente/i.test(status)) style = "bg-yellow-500";
                            else if (/error|failed/i.test(status)) style = "bg-red-600";
                            return <span className={`${baseClass} ${style}`}>{status}</span>;
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(/cancel/i.test(booking.bookingDetails.status)) ? (
                            <button
                              disabled
                              className="bg-gray-400 cursor-not-allowed text-white text-xs font-semibold py-1 px-3 rounded"
                            >
                              Cancelado
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelling.has(booking.id)}
                              className={`text-white text-xs font-semibold py-1 px-3 rounded transition-colors ${cancelling.has(booking.id) ? 'bg-red-300 cursor-wait' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                              {cancelling.has(booking.id) ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-col justify-center items-center">
              {user?.hotels?.map((hotel) => (
                <div key={hotel.id} className="w-full mb-6">
                  <h2 className="text-2xl font-bold decoration-orange-500 underline underline-offset-8">
                    {hotel.name}
                  </h2>
                  <HotelBookings hotelId={hotel.id} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Bookings;
