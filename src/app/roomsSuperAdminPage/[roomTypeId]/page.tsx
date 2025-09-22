"use client";

import RoomsOfRoomType from "@/components/RoomsSuperAdmin";
import SearchBar from "@/components/SearchBar";
import { useState } from "react";

interface Props {
    params: {
        roomTypeId: string;
    };
}

function RoomTypesSuperAdminPage({ params }: Props) {
    const { roomTypeId } = params;
    const [searchQuery, setSearchQuery] = useState<string>("");

    const handleSearch = (searchQuery: string) => {
        setSearchQuery(searchQuery);
    };

    const placeholder = "Busca un cuarto."

    return (
        <div className="w-full">
            <div className="px-6 pt-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de habitaciones</h1>
                    <div className="w-full md:w-80">
                        <SearchBar placeholder={placeholder} onSearch={handleSearch} />
                    </div>
                </div>
            </div>
            <RoomsOfRoomType searchQuery={searchQuery} roomTypeId={roomTypeId} />
        </div>
    );
}

export default RoomTypesSuperAdminPage;
