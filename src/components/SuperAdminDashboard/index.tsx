"use client";

import { SuperAdminContext } from "@/context/superAdminContext";
import { IBookingOfSuperAdmin } from "@/interfaces";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "../SidebarSuperAdmin";

export default function SuperAdmin() {
    const { fetchBookings } = useContext(SuperAdminContext);
    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible);
    };
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [bookings, setBookings] = useState<IBookingOfSuperAdmin[] | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoadingStats(true);
            try {
                const data = await fetchBookings();
                if (isMounted) {
                    setBookings(Array.isArray(data) ? data : []);
                }
            } catch (e: any) {
                console.error('Error cargando bookings para estadísticas', e);
                if (isMounted) setError('No se pudieron cargar las estadísticas');
            } finally {
                if (isMounted) setLoadingStats(false);
            }
        })();
        return () => { isMounted = false; };
    }, [fetchBookings]);

    // Memoize statistics to avoid unnecessary recalculations
    const { totalBookings, totalCustomers, totalEarnings } = useMemo(() => {
        if (!bookings || bookings.length === 0) {
            return { totalBookings: 0, totalCustomers: 0, totalEarnings: 0 };
        }
        const totalBookings = bookings.length;
        const customerIds = new Set<string>();
        let gross = 0;
        for (const b of bookings) {
            if (b.customer?.id) customerIds.add(b.customer.id);
            const val = b.bookingDetails?.total ?? 0;
            gross += typeof val === 'number' ? val : 0;
        }
        // Comisión (20%) según lógica previa
        const commission = (gross * 20) / 100;
        return { totalBookings, totalCustomers: customerIds.size, totalEarnings: commission };
    }, [bookings]);

    return (
        <div className="flex relative">
            {/* Sidebar */}
            <Sidebar setSidebarVisible={setSidebarVisible} toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />

            {/* Main Content */}
            <main className={`flex-1 p-6 transition-all md:ml-0`}>
                {/* Title for the statistics section */}
                <div>
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden mb-4 inline-flex w-auto h-auto p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        <div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                        </div>
                    </button>
                    <h2 className="text-xl text-center font-bold mb-4">Estadísticas</h2>
                </div>

                {/* Statistics Section */}
                <div className="p-6 border border-gray-300 rounded-lg mb-8">
                    <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1 text-center mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold">Cantidad de Compradores</h3>
                            <p className="text-2xl">{loadingStats ? '...' : totalCustomers}</p>
                        </div>
                        <div className="flex-1 text-center mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold">Cantidad de Reservas</h3>
                            <p className="text-2xl">{loadingStats ? '...' : totalBookings}</p>
                        </div>
                        <div className="flex-1 text-center">
                            <h3 className="text-lg font-semibold">Ingresos</h3>
                            <p className="text-2xl">USD {loadingStats ? '...' : totalEarnings.toFixed(2)}</p>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
                </div>


                {/* Title for the functions section */}
                <h2 className="text-xl text-center font-bold mb-4">Funciones</h2>

                {/* Functions Section */}
                <div className="p-6 border border-gray-300 rounded-lg">
                    <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1 mx-2 text-center mb-4 md:mb-0">
                            <Link href="/customersSuperAdmin" className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200">
                                <h4 className="text-md font-semibold">Clientes</h4>
                                <p className="text-sm text-gray-600">
                                    Haz click para crear, editar y eliminar clientes, y mirar los datos de sus reservas.
                                </p>
                            </Link>
                        </div>
                        <div className="flex-1 mx-2 text-center mb-4 md:mb-0">
                            <Link href="/hotelAdminsSuperAdmin" className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200">
                                <h4 className="text-md font-semibold">Administradores de Hoteles</h4>
                                <p className="text-sm text-gray-600">
                                    Haz click para ver, crear, editar y eliminar administradores de hoteles, junto con sus hoteles y las reseñas de estos.
                                </p>
                            </Link>
                        </div>
                        <div className="flex-1 mx-2 text-center">
                            <Link href="/superAdmins" className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200">
                                <h4 className="text-md font-semibold">Super Admins</h4>
                                <p className="text-sm text-gray-600">Haz click para crear super admins.</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
