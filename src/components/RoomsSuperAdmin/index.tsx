"use client";

import { useEffect, useState, useMemo } from "react";
import { useContext } from "react";
import { SuperAdminContext } from "../../context/superAdminContext";
import { IRoomOfSuperAdmin } from "@/interfaces";
import Modal from "../ModalRooms"; // Import the Modal component
import { showToast } from '@/lib/toast';
import Swal from 'sweetalert2';
import Sidebar from "../SidebarSuperAdmin";

interface RoomsOfRoomTypeProps {
    roomTypeId: string;
    searchQuery: string;
}

const RoomsOfRoomType = ({ roomTypeId, searchQuery }: RoomsOfRoomTypeProps) => {
    const [rooms, setRooms] = useState<IRoomOfSuperAdmin[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<IRoomOfSuperAdmin[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15); // Table rows per page
    const [sortKey, setSortKey] = useState<'roomNumber' | 'isAvailable' | 'isDeleted'>('roomNumber');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const { fetchRoomsByRoomTypeId, fetchDeleteRoom, fetchUpdateRoom, fetchRoomsBySearch } = useContext(SuperAdminContext);
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [newRoomNumber, setNewRoomNumber] = useState<string>("");

    const handleNextPage = () => setCurrentPage(p => p + 1);
    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));

    const handleSort = (key: typeof sortKey) => {
        if (key === sortKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    useEffect(() => {
        if (roomTypeId) {
            const fetchData = async () => {
                const data = await fetchRoomsByRoomTypeId(roomTypeId);
                if (data) {
                    setRooms(data);
                    setFilteredRooms(data);
                } else {
                    console.warn('No data found for the given roomTypeId');
                }
            };
            fetchData();
        }
    }, [roomTypeId]);

    useEffect(() => {
        if (searchQuery) {
            fetchRoomsBySearch(roomTypeId, searchQuery).then((data) => {
                if (Array.isArray(data)) {
                    console.log(data);

                    setFilteredRooms(data);
                } else {
                    console.error("fetchRoomsBySearch did not return an array.");
                    setFilteredRooms([]);
                }
            });
        } else {
            setFilteredRooms(rooms);
        }
    }, [searchQuery, rooms, fetchRoomsBySearch]);

    const handleDeleteRoom = async (roomId: string) => {
        const res = await Swal.fire({
            title: '¿Eliminar habitación?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33'
        });
        if (!res.isConfirmed) return;
        try {
            const response = await fetchDeleteRoom(roomId);
            if (response) {
                const updatedRooms = rooms.filter(room => room.id !== roomId);
                setRooms(updatedRooms);
                setFilteredRooms(updatedRooms);
                showToast('success', <p>Habitación eliminada</p>);
            } else {
                showToast('error', <p>Hubo un error al eliminar la habitación.</p>, { autoClose: 3500 });
            }
        } catch (error) {
            console.log("Error deleting room: ", error);
            showToast('error', <p>Error inesperado eliminando habitación</p>);
        }
    };

    const handleUpdateRoom = async (roomId: string, newRoomNumber: string) => {
        try {
            const response = await fetchUpdateRoom(roomId, { roomNumber: newRoomNumber });
            if (response) {
                const updatedRooms = rooms.map(room =>
                    room.id === roomId ? { ...room, roomNumber: newRoomNumber } : room
                );
                setRooms(updatedRooms);
                setFilteredRooms(updatedRooms);
                showToast('success', <p>Habitación actualizada</p>);
            } else {
                showToast('error', <p>Hubo un error al actualizar la habitación.</p>, { autoClose: 3500 });
            }
        } catch (error) {
            console.log("Error updating room: ", error);
            showToast('error', <p>Error inesperado actualizando habitación</p>);
        }
    };

    const openModal = (roomId: string, currentRoomNumber: string) => {
        setSelectedRoomId(roomId);
        setNewRoomNumber(currentRoomNumber);
        setIsModalOpen(true);
    };

    const handleModalConfirm = (newRoomNumber: string) => {
        if (selectedRoomId) {
            handleUpdateRoom(selectedRoomId, newRoomNumber);
        }
        setIsModalOpen(false);
    };

    const sortedRooms = useMemo(() => {
        const arr = [...filteredRooms];
        arr.sort((a, b) => {
            let aVal: any = a[sortKey];
            let bVal: any = b[sortKey];
            if (sortKey === 'roomNumber') {
                // Natural numeric then string compare
                const aNum = parseInt(aVal, 10);
                const bNum = parseInt(bVal, 10);
                if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) return aNum - bNum;
            }
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
        return sortDir === 'asc' ? arr : arr.reverse();
    }, [filteredRooms, sortKey, sortDir]);

    const totalPages = Math.ceil(sortedRooms.length / itemsPerPage) || 1;
    const paginatedRooms = sortedRooms.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        // Reset to first page when filters/sorting change
        setCurrentPage(1);
    }, [searchQuery, sortKey, sortDir]);

    return (
        <div className="flex">
            <Sidebar setSidebarVisible={setSidebarVisible} toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />

            <div className="p-8 w-full">
                <div className="xs:flex-1 flex-col md:flex-row justify-between items-center">
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden mb-4 inline-flex p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        <div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                            <div className="w-[35px] h-[5px] bg-black my-[6px]"></div>
                        </div>
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Habitaciones</h1>
                        <p className="text-sm text-gray-600 mt-1">Gestiona las habitaciones del tipo seleccionado. Ordena, edita o elimina según sea necesario.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-md">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            Disponible
                        </div>
                        <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-md">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                            No disponible
                        </div>
                        <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-md">
                            <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                            Eliminada
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr>
                                <Th label="Número" sortKey="roomNumber" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                                <Th label="Disponible" sortKey="isAvailable" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                                <Th label="Eliminada" sortKey="isDeleted" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                                <th className="py-2 px-3 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRooms.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-gray-500">No se encontraron habitaciones.</td>
                                </tr>
                            )}
                            {paginatedRooms.map(room => {
                                const availabilityBadge = room.isAvailable ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300';
                                const deletedBadge = room.isDeleted ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-500 border-gray-200';
                                return (
                                    <tr key={room.id} className="border-t hover:bg-gray-50 transition-colors">
                                        <td className="py-2 px-3 font-medium">{room.roomNumber}</td>
                                        <td className="py-2 px-3">
                                            <span className={`inline-flex items-center gap-1 border text-xs font-semibold px-2.5 py-1 rounded-full ${availabilityBadge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${room.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {room.isAvailable ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className={`inline-flex items-center gap-1 border text-xs font-semibold px-2.5 py-1 rounded-full ${deletedBadge}`}>
                                                {room.isDeleted ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(room.id, room.roomNumber)}
                                                    className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-100 font-medium"
                                                >Editar</button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    className="px-2 py-1 text-xs rounded-md bg-[#f83f3a] text-white hover:bg-[#e63946] font-medium"
                                                >Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="text-sm text-gray-600">Página {currentPage} de {totalPages} ({filteredRooms.length} habitaciones)</div>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={handlePrevPage} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-100">Anterior</button>
                        <button disabled={currentPage === totalPages} onClick={handleNextPage} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-100">Siguiente</button>
                    </div>
                </div>
            </div>
            {/* Render the modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleModalConfirm}
                defaultValue={newRoomNumber}
            />
        </div>
    );
};

// Small helper component for sortable table headers
interface ThProps {
    label: string;
    sortKey: 'roomNumber' | 'isAvailable' | 'isDeleted';
    currentKey: string;
    dir: 'asc' | 'desc';
    onSort: (key: ThProps['sortKey']) => void;
}

const Th = ({ label, sortKey, currentKey, dir, onSort }: ThProps) => {
    const isActive = currentKey === sortKey;
    return (
        <th
            scope="col"
            onClick={() => onSort(sortKey)}
            className="py-2 px-3 text-left font-semibold cursor-pointer select-none group"
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <span className={`text-xs transition-opacity ${isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}>
                    {isActive ? (dir === 'asc' ? '▲' : '▼') : '▲'}
                </span>
            </span>
        </th>
    );
};

export default RoomsOfRoomType;
