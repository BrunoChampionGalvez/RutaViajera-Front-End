"use client";

import { useEffect, useState, useCallback, useContext } from 'react';
import { SuperAdminContext } from '../../context/superAdminContext';
import { IBookingOfSuperAdmin } from '@/interfaces';
import { cancelBooking } from '@/lib/server/fetchUsers';
import Sidebar from '../SidebarSuperAdmin';
import Swal from 'sweetalert2';

interface BookingsSuperAdminProps { customerId: string; }

// Tabla estilo /dashboard/bookings para un cliente específico (vista super admin)
export default function BookingsSuperAdmin({ customerId }: BookingsSuperAdminProps) {
        const { fetchCustomerById, fetchBookingsByCustomerId, fetchDeleteBookingOfCustomer } = useContext(SuperAdminContext);
    const [customerName, setCustomerName] = useState('');
    const [bookings, setBookings] = useState<IBookingOfSuperAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState<Set<string>>(new Set());
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const toggleSidebar = () => setSidebarVisible(v => !v);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!customerId) { setLoading(false); return; }
            try {
                setLoading(true); setError('');
                const [customer, bookingsResp] = await Promise.all([
                    fetchCustomerById(customerId),
                    fetchBookingsByCustomerId(customerId)
                ]);
                if (cancelled) return;
                if (customer) setCustomerName(`${customer.name} ${customer.lastName}`.trim());
                setBookings(Array.isArray(bookingsResp) ? bookingsResp : []);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message || 'Error cargando reservas');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [customerId, fetchBookingsByCustomerId, fetchCustomerById]);

        const handleCancel = useCallback(async (bookingId: string) => {
            const result = await Swal.fire({
                title: '¿Cancelar reserva?',
                text: 'La reserva quedará con estado Cancelled pero seguirá visible.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#888',
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No'
            });
            if (!result.isConfirmed) return;
            setCancelling(p => new Set(p).add(bookingId));
            try {
                const ok = await cancelBooking(bookingId);
                if (ok) {
                    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingDetails: { ...b.bookingDetails, status: 'cancelled' } } : b));
                    Swal.fire({ icon: 'success', title: 'Reserva cancelada', timer: 1800, showConfirmButton: false });
                } else {
                    throw new Error('No se pudo cancelar');
                }
            } catch (e: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'Fallo al cancelar' });
            } finally {
                setCancelling(p => { const n = new Set(p); n.delete(bookingId); return n; });
            }
        }, []);

    const groupRoomTypes = (booking: IBookingOfSuperAdmin) => {
        const map = new Map<string, { name: string; count: number }>();
        booking.bookingDetails.availabilities.forEach(av => {
            const rt = (av as any)?.room?.roomtype; if (!rt) return;
            if (!map.has(rt.id)) map.set(rt.id, { name: rt.name, count: 1 }); else map.get(rt.id)!.count += 1;
        });
        return Array.from(map.values());
    };

    const getDisplayedTotal = (booking: IBookingOfSuperAdmin) => {
        const backend = booking.bookingDetails.total ?? 0;
        try {
            const groups = new Map<string, { price: number; quantity: number; nights: number }>();
                    booking.bookingDetails.availabilities.forEach(av => {
                        const rt = (av as any)?.room?.roomtype; if (!rt) return;
                        const startRaw = av.startDate || '';
                        const endRaw = av.endDate || '';
                        if (!startRaw || !endRaw) return; // skip if missing dates
                        const start = new Date(startRaw).getTime();
                        const end = new Date(endRaw).getTime();
                const nights = Math.max(1, Math.ceil((end - start)/(1000*60*60*24)));
                if (!groups.has(rt.id)) groups.set(rt.id, { price: rt.price ?? 0, quantity: 1, nights }); else groups.get(rt.id)!.quantity += 1;
            });
            const recalculated = Array.from(groups.values()).reduce((acc,g)=>acc + g.price * g.quantity * g.nights,0);
            const legacyFlag = recalculated > backend && Math.abs(recalculated - backend) >= 1;
            return { backend: legacyFlag ? recalculated : backend, rawBackend: backend, recalculated, legacyFlag };
        } catch { return { backend, rawBackend: backend, recalculated: backend, legacyFlag: false }; }
    };

    return (
        <div className="flex">
            <Sidebar setSidebarVisible={setSidebarVisible} toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
            <div className="mx-auto mt-8 w-full p-4 md:p-8">
                <div className="flex md:flex-row justify-between items-center mb-6">
                    <div className="flex flex-start md:flex-row justify-between">
                        <button onClick={toggleSidebar} className="md:hidden mb-4 inline-flex p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                            <div>
                                <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                                <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                                <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                            </div>
                        </button>
                    </div>
                    <h1 className="text-2xl text-center md:text-3xl font-bold flex-grow mb-4 md:mb-0">Reservas de {customerName || 'Cliente'}</h1>
                </div>

                {loading && (
                    <div className="flex items-center space-x-2 text-gray-600 mb-4">
                        <div className="animate-spin h-5 w-5 border-b-2 border-gray-600 rounded-full"></div>
                        <span>Cargando reservas...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4 text-sm">{error}</div>
                )}
                {!loading && bookings.length === 0 && !error && (
                    <div className="bg-white border rounded p-6 text-center text-gray-600">No hay reservas para este cliente.</div>
                )}

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
                                {bookings.map(b => {
                                    const grouped = groupRoomTypes(b);
                                      const first = b.bookingDetails.availabilities[0];
                                      const startDate = first?.startDate ? new Date(first.startDate).toLocaleDateString() : '-';
                                      const endDate = first?.endDate ? new Date(first.endDate).toLocaleDateString() : '-';
                                    return (
                                        <tr key={b.id} className="border-t hover:bg-gray-50">
                                            <td className="py-3 px-4 font-mono text-[10px] md:text-xs break-all max-w-[120px]">{b.id}</td>
                                            <td className="py-3 px-4">{new Date(b.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">{b.bookingDetails.hotel.name}</td>
                                            <td className="py-3 px-4">{startDate} - {endDate}</td>
                                            <td className="py-3 px-4">{grouped.map(g => <div key={g.name}>{g.count}x {g.name}</div>)}</td>
                                            <td className="py-3 px-4 font-semibold">
                                                {(() => {
                                                    const { backend, rawBackend, recalculated, legacyFlag } = getDisplayedTotal(b);
                                                    return (
                                                        <span title={legacyFlag ? `Backend almacenó ${rawBackend}. Recalculado (con noches): ${recalculated}` : 'Total'}>
                                                            ${backend}
                                                            {legacyFlag && <sup className="ml-1 text-[10px] text-orange-600" title={`Total ajustado para incluir noches. Valor original: ${rawBackend}`}>*</sup>}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-4">
                                                {(() => {
                                                    const status = b.bookingDetails.status;
                                                    const baseClass = 'px-2 py-1 rounded text-white text-xs';
                                                    let style = 'bg-green-600';
                                                    if (/cancel/i.test(status)) style = 'bg-red-500';
                                                    else if (/pending|pendiente/i.test(status)) style = 'bg-yellow-500';
                                                    else if (/error|failed/i.test(status)) style = 'bg-red-600';
                                                    return <span className={`${baseClass} ${style}`}>{status}</span>;
                                                })()}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                                        <div className="flex flex-col gap-1 items-center min-w-[110px]">
                                                                            <button
                                                                                onClick={() => handleCancel(b.id)}
                                                                                disabled={cancelling.has(b.id) || /cancel/i.test(b.bookingDetails.status)}
                                                                                className={`w-full text-white text-xs font-semibold py-1 px-3 rounded transition-colors ${/cancel/i.test(b.bookingDetails.status) ? 'bg-gray-400 cursor-not-allowed' : (cancelling.has(b.id) ? 'bg-red-300 cursor-wait' : 'bg-red-500 hover:bg-red-600')}`}
                                                                            >
                                                                                {(/cancel/i.test(b.bookingDetails.status)) ? 'Cancelado' : (cancelling.has(b.id) ? 'Cancelando...' : 'Cancelar')}
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    const result = await Swal.fire({
                                                                                        title: 'Eliminar reserva',
                                                                                        html: '<p class="text-sm">Esta acción la elimina definitivamente y no podrá recuperarse.<br/><b>¿Continuar?</b></p>',
                                                                                        icon: 'warning',
                                                                                        showCancelButton: true,
                                                                                        confirmButtonColor: '#b91c1c',
                                                                                        cancelButtonColor: '#6b7280',
                                                                                        confirmButtonText: 'Sí, eliminar',
                                                                                        cancelButtonText: 'Cancelar'
                                                                                    });
                                                                                    if (!result.isConfirmed) return;
                                                                                    try {
                                                                                        const deleted = await fetchDeleteBookingOfCustomer(b.id, b.customer?.id || '');
                                                                                        if (deleted) {
                                                                                            setBookings(prev => prev.filter(x => x.id !== b.id));
                                                                                            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1600, showConfirmButton: false });
                                                                                        } else {
                                                                                            throw new Error('No se pudo eliminar');
                                                                                        }
                                                                                    } catch (e: any) {
                                                                                        Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'Fallo al eliminar' });
                                                                                    }
                                                                                }}
                                                                                className="w-full text-white text-xs font-semibold py-1 px-3 rounded bg-gray-700 hover:bg-gray-800 transition-colors"
                                                                            >
                                                                                Eliminar
                                                                            </button>
                                                                        </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
