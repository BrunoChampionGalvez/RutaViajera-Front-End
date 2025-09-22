"use client";
import { HotelContext } from "@/context/hotelContext";
import { UserContext } from "@/context/userContext";
import { ICreateNumberOfRoom, IRoomType } from "@/interfaces";
import { getRoomTypesByHotelId, postRoom } from "@/lib/server/fetchHotels";
import { Field, Form, Formik, ErrorMessage } from "formik";
import Link from "next/link";
import Image from "next/image"
import { MouseEventHandler, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";

interface RoomNumberFormProps {
  onRoomsCreated?: () => void;
  hotelIdOverride?: string; // permitir pasar hotelId explícito
  draftRooms?: Record<string,string[]>; // map roomsTypeId -> pending numbers
  onDraftRoomsChange?: (byType: Record<string,string[]>) => void;
}

export default function RoomNumberForm({ onRoomsCreated, hotelIdOverride, draftRooms, onDraftRoomsChange }: RoomNumberFormProps) {
  const { isAdmin } = useContext(UserContext)
  const { hotelBeingCreated, roomTypeIdBeingCreated } = useContext(HotelContext)
  const [roomTypes, setRoomTypes] = useState<IRoomType[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [roomsByType, setRoomsByType] = useState<Record<string,string[]>>(draftRooms || {})
  const [showRooms, setShowRooms] = useState<boolean>(true);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);
  const [creatingBatch, setCreatingBatch] = useState<boolean>(false);
  const [lastBatchFailures, setLastBatchFailures] = useState<{roomNumber:string; error:string}[]>([]);

  useEffect(() => {
    const hotelId = hotelIdOverride || hotelBeingCreated?.id
    if (hotelId) setSelectedHotelId(hotelId)
  }, [hotelIdOverride, hotelBeingCreated?.id]);

  useEffect(() => {
    if (selectedHotelId) {
      const fetchRoomsTypes = async () => {
        try {
          const data = await getRoomTypesByHotelId(selectedHotelId);
          if (Array.isArray(data)) {
            // normaliza id a string si viene numérica temporal
            const normalized = data.map((rt: any) => ({
              ...rt,
              id: typeof rt.id === 'number' ? String(rt.id) : rt.id
            }));
            setRoomTypes(normalized);
          } else {
            console.error("Error: Expected array but received:", data);
          }
        } catch (error) {
          console.error("Error fetching room types:", error);
        }
      };

      fetchRoomsTypes();
    }
  }, [selectedHotelId]);

  const initialValues: ICreateNumberOfRoom = {
    roomNumber: "",
    roomsTypeId: "",
  };

  const handleAddRoom = async (values: ICreateNumberOfRoom,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
    // Permitir usar el id que dejó el paso anterior (roomTypeIdBeingCreated) si no se seleccionó manualmente
    const effectiveRoomTypeId = selectedRoomTypeId || roomTypeIdBeingCreated;
    if (!effectiveRoomTypeId) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un tipo de habitación', timer: 2000 });
      return;
    }
    const roomNumber = values.roomNumber.trim();
    if (!roomNumber) return;
    const list = roomsByType[effectiveRoomTypeId] || [];
    if (list.includes(roomNumber)) {
      Swal.fire({ icon: 'info', title: 'Número duplicado', text: 'Ya añadiste ese número.', timer: 2000 });
      return;
    }
    setAdding(true);
    setRoomsByType(prev => {
      const updated = { ...prev, [effectiveRoomTypeId]: [...(prev[effectiveRoomTypeId]||[]), roomNumber] };
      onDraftRoomsChange?.(updated);
      return updated;
    });
    resetForm();
    setAdding(false);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen mt-20 flex flex-col">
      {isAdmin ? (
        <div className="w-full mx-auto max-w-md p-8">
          <div className="flex justify-center mb-8">
            <h1 className="text-4xl mb-2 pb-2 text-center font-bold">
              Crea Habitaciones
            </h1>
          </div>
          <Formik initialValues={initialValues} onSubmit={handleAddRoom}>
            {({ isSubmitting, setSubmitting, values }) => (
              <Form className="flex flex-col space-y-4 justify-center items-center">
                <div className="w-full">
                  <div className="formDiv w-full flex-1">
                    <label htmlFor={`roomNumber`} className="formLabel">
                      Número de Habitación:
                    </label>
                    <Field
                      type="text"
                      name="roomNumber"
                      className="formInput"
                      placeholder="Número de Habitación...."
                    />
                    <ErrorMessage
                      name="roomNumber"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="formDiv w-full flex-1 mb-4">
                  <label htmlFor={`roomsTypeId`} className="formLabel">
                    Tipo de Habitación:
                  </label>
                  <select
                    name="roomsTypeId"
                    className="formInput"
                    value={selectedRoomTypeId || roomTypeIdBeingCreated || ''}
                    onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  >
                    <option value="">Seleccione un tipo de habitación</option>
                    {roomTypes.map((roomType) => (
                      <option key={String(roomType.id)} value={String(roomType.id)}>
                        {roomType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formDiv flex w-full gap-5 mb-4">
                  <button
                    className="btn-secondary flex items-center justify-center"
                    type="submit"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={"/create2.png"}
                        alt="Crear"
                        width={24}
                        height={24}
                      />
                      {adding ? 'Agregando...' : 'Agregar Habitación'}
                    </div>
                  </button>
                </div>
                {Object.values(roomsByType).some(arr=>arr.length>0) && (
                  <div className="flex flex-col gap-3 w-full mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Pendientes totales: {Object.values(roomsByType).reduce((a,b)=>a+b.length,0)}</span>
                      <button
                        type="button"
                        disabled={creatingBatch}
                        className="btn-secondary flex items-center justify-center"
                        onClick={async () => {
                          if (Object.keys(roomsByType).length===0) return;
                          setCreatingBatch(true);
                          const summary: { typeId: string; name: string; successes: number; failures: number; failedRooms: string[] }[] = [];
                          let anyFailure = false;
                          const newState: Record<string,string[]> = {};
                          for (const [rtId, list] of Object.entries(roomsByType)) {
                            if (list.length === 0) continue;
                            try {
                              const { successes, failures } = await postRoom(list, rtId);
                              const rtName = roomTypes.find(r=>String(r.id)===rtId)?.name || rtId;
                              summary.push({ typeId: rtId, name: rtName, successes: successes.length, failures: failures.length, failedRooms: failures.map(f=>f.roomNumber) });
                              if (failures.length>0) {
                                anyFailure = true;
                                newState[rtId] = failures.map(f=>f.roomNumber);
                              }
                            } catch (e) {
                              anyFailure = true;
                              const rtName = roomTypes.find(r=>String(r.id)===rtId)?.name || rtId;
                              summary.push({ typeId: rtId, name: rtName, successes: 0, failures: list.length, failedRooms: list });
                              newState[rtId] = list;
                            }
                          }
                          setRoomsByType(newState);
                          onDraftRoomsChange?.(newState);
                          setCreatingBatch(false);
                          const lines = summary.map(s=>`<b>${s.name}</b>: ${s.successes} ${s.failedRooms.length?` (${s.failedRooms.slice(0,5).join(', ')}${s.failedRooms.length>5?'...':''})`:''}`).join('<br/>');
                          Swal.fire({
                            icon: anyFailure ? 'info' : 'success',
                            title: anyFailure ? 'Resultado parcial' : 'Habitaciones creadas',
                            html: lines || 'Nada que crear',
                            width: 600,
                          });
                          if (!anyFailure && onRoomsCreated) onRoomsCreated();
                        }}
                      >
                        {creatingBatch ? 'Creando...' : 'Crear Habitaciones'}
                      </button>
                    </div>
                    {showRooms && (
                      <ul className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1 text-sm">
                        {Object.entries(roomsByType).flatMap(([rtId, list]) => {
                          const rtName = roomTypes.find(r=>String(r.id)===rtId)?.name || rtId;
                          return list.map(r => (
                            <li key={rtId+':'+r} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                              <span className="flex flex-col"><b>{r}</b><span className="text-[10px] text-gray-500">{rtName}</span></span>
                              <button type="button" className="text-xs text-red-500 hover:text-red-700"
                                onClick={() => setRoomsByType(prev => { const filtered = (prev[rtId]||[]).filter(x=>x!==r); const clone = { ...prev, [rtId]: filtered }; if(filtered.length===0) delete clone[rtId]; onDraftRoomsChange?.(clone); return clone; })}>Eliminar</button>
                            </li>
                          ));
                        })}
                      </ul>
                    )}
                    {lastBatchFailures.length > 0 && (
                      <div className="mt-3 w-full">
                        <p className="text-sm font-semibold text-red-600 mb-1">Errores:</p>
                        <ul className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2 bg-red-50">
                          {lastBatchFailures.map(f => (
                            <li key={f.roomNumber}>
                              <b>{f.roomNumber}:</b> {f.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Form>
            )}
          </Formik>

        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-100">
          <div className=" max-w-md bg-white shadow-md rounded-md p-4 text-center">
            <h1 className="text-2xl font-semibold mb-2">Acceso Denegado</h1>
            <p className="mb-4">
              No tienes permiso para acceder a esta página.
            </p>
            <Link href="/" className="btn-secondary">
              Regresar a la página principal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
