import { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "@/context/userContext";
import { IBooking } from "@/interfaces";

interface HotelBookingsProps {
  hotelId: string;
}

const HotelBookings: React.FC<HotelBookingsProps> = ({ hotelId }) => {
  const { getBookingsByHotel, getBookingsForHotelFromAdminCache } = useContext(UserContext);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true); setError(null);
    try {
      // Try admin-wide cached dataset first (contains all hotels) to ensure newly created bookings appear
      let data: IBooking[] = [];
      if (getBookingsForHotelFromAdminCache) {
        data = await getBookingsForHotelFromAdminCache(hotelId);
      }
      // Fallback to direct per-hotel endpoint if empty (maybe admin cache not yet primed)
      if ((!data || data.length === 0) && getBookingsByHotel) {
        const direct = await getBookingsByHotel(hotelId);
        if (direct && direct.length > 0) data = direct;
      }
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, [hotelId, getBookingsForHotelFromAdminCache, getBookingsByHotel]);

  useEffect(() => { let mounted = true; load(); return () => { mounted = false; }; }, [load]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Reservas del Hotel</h1>
      {loading && <p className="text-sm text-gray-500">Cargando reservas...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-800 text-white uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID de Reserva</th>
                <th className="py-3 px-6 text-left">Cliente</th>
                <th className="py-3 px-6 text-left">Fecha de Check-In</th>
                <th className="py-3 px-6 text-left">Fecha de Check-Out</th>
                <th className="py-3 px-6 text-left">Estado</th>
                <th className="py-3 px-6 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {bookings.map((booking: IBooking) => (
                <tr
                  key={booking.id}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {booking.id}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {booking.customer.name} {booking.customer.lastName}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {new Date(
                      booking.bookingDetails.availabilities[0].startDate
                    ).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {new Date(
                      booking.bookingDetails.availabilities[0].endDate
                    ).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {booking.bookingDetails.status}
                  </td>
                  <td className="py-3 px-6 text-left">
                    ${booking.bookingDetails.total} USD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && <p>No hay reservas para este hotel.</p>
      )}
    </div>
  );
};

export default HotelBookings;
