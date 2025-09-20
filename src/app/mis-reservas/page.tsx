"use client";

import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/context/userContext';
import Link from 'next/link';

// Página de "Mis Reservas" (versión cliente) – lista las reservas del usuario logueado
export default function MisReservasPage() {
	const { user, isLogged, getBookings } = useContext(UserContext);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		(async () => {
			if (!isLogged || !user?.id) {
				setLoading(false);
				return;
			}
			try {
				await getBookings(user.id);
			} catch (e: any) {
				if (active) setError(e?.message || 'Error al cargar reservas');
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, [isLogged, user?.id, getBookings]);

	const bookings = user?.bookings || [];

	if (!isLogged) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center px-4">
				<h1 className="text-2xl font-semibold mb-4">Debes iniciar sesión</h1>
				<Link href="/login" className="text-blue-600 hover:underline">Ir a Iniciar Sesión</Link>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center px-4">
				<h1 className="text-xl font-semibold mb-2">Error</h1>
				<p className="text-gray-600 mb-4">{error}</p>
				<button onClick={() => location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Reintentar</button>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto py-10 px-4">
			<h1 className="text-3xl font-bold mb-8 text-center">Mis Reservas</h1>
			{bookings.length === 0 && (
				<div className="text-center text-gray-600">
					<p>No tienes reservas aún.</p>
					<Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">Buscar Hoteles</Link>
				</div>
			)}
			<div className="space-y-6">
				{bookings.map((b: any) => {
					const total = b.bookingDetails?.total ?? 0;
					const hotelName = b.bookingDetails?.hotel?.name || 'Hotel';
					const status = b.bookingDetails?.status || 'PENDING';
					return (
						<div key={b.id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div>
									<h2 className="text-lg font-semibold">Reserva #{b.id}</h2>
									<p className="text-sm text-gray-500">Hotel: {hotelName}</p>
									<p className="text-sm text-gray-500">Estado: <span className="font-medium">{status}</span></p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-500">Total</p>
									<p className="text-xl font-bold text-green-600">${total}</p>
								</div>
							</div>
							{Array.isArray(b.bookingDetails?.availabilities) && b.bookingDetails.availabilities.length > 0 && (
								<div className="mt-4">
									<p className="text-sm font-medium text-gray-700 mb-2">Habitaciones:</p>
									<div className="flex flex-wrap gap-2">
										{b.bookingDetails.availabilities.map((av: any, idx: number) => (
											<span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
												{av.room?.roomtype?.name || 'Tipo'} ({av.startDate} → {av.endDate})
											</span>
										))}
									</div>
								</div>
							)}
							<div className="mt-4 flex justify-end">
								<Link href={`/booking-confirmation?bookingId=${b.id}`} className="text-sm text-blue-600 hover:underline">Ver comprobante</Link>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
