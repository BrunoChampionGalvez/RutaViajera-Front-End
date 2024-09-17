"use client";
import { HotelContext } from "@/context/hotelContext";
import { UserContext } from "@/context/userContext";
import { ICreateNumberOfRoom, IRoom, IRoomType } from "@/interfaces";
import { getRoomTypesByHotelId, postRoom } from "@/lib/server/fetchHotels";
import { Field, Form, Formik, ErrorMessage } from "formik";
import Link from "next/link";
import Image from "next/image"
import { MouseEventHandler, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function RoomNumberForm() {
  const { isAdmin } = useContext(UserContext)
  const { hotelBeingCreated, roomTypeIdBeingCreated } = useContext(HotelContext)
  const [roomTypes, setRoomTypes] = useState<IRoomType[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [rooms, setRooms] = useState<string[]>([])

  useEffect(() => {
    const hotelId = hotelBeingCreated?.id
    if (hotelId) setSelectedHotelId(hotelId)
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      const fetchRoomsTypes = async () => {
        try {
          const data = await getRoomTypesByHotelId(selectedHotelId);
          if (Array.isArray(data)) {
            setRoomTypes(data);
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
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    const roomNumber = values.roomNumber
    setRooms((prevRoomNumbers) => [...prevRoomNumbers, roomNumber])
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
                  <Field as="select" name="roomsTypeId" className="formInput">
                    <option value="">Seleccione un tipo de habitación</option>
                    {roomTypes.map((roomType) => (
                      <option key={String(roomType.id)} value={roomType.name}>
                        {roomType.name}
                      </option>
                    ))}
                  </Field>
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
                      Agregar Habitación
                    </div>
                  </button>
                </div>
                {rooms.length > 0 ? (<div className="flex gap-3">
                  <div className="text-center text-gray-500 text-sm">Ver {rooms.length} habitaciones</div>
                  <button
                    className="btn-secondary flex items-center justify-center"
                    onClick={async () => {
                      const newRooms = [...rooms]
                        try {
                          const response = await postRoom(newRooms, roomTypeIdBeingCreated);
                          if (!response.error) {
                            setSubmitting(false);
                          } else {
                            Swal.fire({
                              position: "top-end",
                              icon: "error",
                              title: "Opps...",
                              text: "Tal vez ya tengas una habitación con este número",
                              timer: 3000,
                            });
                          }
                        } catch (error) {
                          console.error(error);
                        } finally {
                          setSubmitting(false)
                        }
                    }}
                  >
                    Crear Habitaciones
                  </button>
                </div>) : null
                }
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
