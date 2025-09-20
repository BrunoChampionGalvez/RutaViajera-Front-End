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
}

export default function RoomNumberForm({ onRoomsCreated, hotelIdOverride }: RoomNumberFormProps) {
  const { isAdmin } = useContext(UserContext)
  const { hotelBeingCreated, roomTypeIdBeingCreated } = useContext(HotelContext)
  const [roomTypes, setRoomTypes] = useState<IRoomType[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [rooms, setRooms] = useState<string[]>([])
  const [showRooms, setShowRooms] = useState<boolean>(false);
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
    if (rooms.includes(roomNumber)) {
      Swal.fire({ icon: 'info', title: 'Número duplicado', text: 'Ya añadiste ese número.', timer: 2000 });
      return;
    }
    setAdding(true);
    setRooms(prev => [...prev, roomNumber]);
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
                {rooms.length > 0 && (
                  <div className="flex flex-col gap-3 w-full mt-4">
                    <div className="flex items-center justify-between">
                      <button type="button" className="text-sm text-gray-600 underline"
                        onClick={() => setShowRooms(prev => !prev)}>
                        {showRooms ? 'Ocultar' : 'Ver'} {rooms.length} habitaciones
                      </button>
                      <button
                        type="button"
                        disabled={creatingBatch}
                        className="btn-secondary flex items-center justify-center"
                        onClick={async () => {
                          if (!selectedRoomTypeId && !roomTypeIdBeingCreated) {
                            Swal.fire({ icon: 'warning', title: 'Selecciona un tipo', timer: 2000 });
                            return;
                          }
                          setCreatingBatch(true);
                          const targetRoomType = selectedRoomTypeId || roomTypeIdBeingCreated;
                          try {
                            const { successes, failures } = await postRoom(rooms, targetRoomType);
                            setLastBatchFailures(failures);
                            if (failures.length === 0) {
                              Swal.fire({ icon: 'success', title: 'Habitaciones creadas', timer: 2000 });
                              if (onRoomsCreated) onRoomsCreated();
                              setRooms([]);
                              setLastBatchFailures([]);
                            } else if (successes.length > 0) {
                              Swal.fire({ icon: 'info', title: 'Parcial', html: `${successes.length} creadas, ${failures.length} fallidas`, timer: 3000 });
                              setRooms(failures.map(f => f.roomNumber)); // deja pendientes las fallidas
                            } else {
                              Swal.fire({ icon: 'error', title: 'Error al crear habitaciones', html: `${failures.length} fallidas`, timer: 3000 });
                            }
                          } catch (e) {
                            Swal.fire({ icon: 'error', title: 'Error creando habitaciones', timer: 2500 });
                          } finally {
                            setCreatingBatch(false);
                          }
                        }}
                      >
                        {creatingBatch ? 'Creando...' : 'Crear Habitaciones'}
                      </button>
                    </div>
                    {showRooms && (
                      <ul className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1 text-sm">
                        {rooms.map(r => (
                          <li key={r} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                            <span>{r}</span>
                            <button type="button" className="text-xs text-red-500 hover:text-red-700"
                              onClick={() => setRooms(prev => prev.filter(x => x !== r))}>Eliminar</button>
                          </li>
                        ))}
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
            <Link href="/home" className="btn-secondary">
              Regresar a la página principal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
