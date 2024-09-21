"use client";

import { IRoomTypeRegister } from "@/interfaces";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import createImage from "../../../public/create.png";
import Image from "next/image";
import { postRoomType } from "@/lib/server/fetchHotels";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { UserContext } from "@/context/userContext";
import { HotelContext } from "@/context/hotelContext";
import { FaArrowDown } from "react-icons/fa";
import { CiSaveUp2 } from "react-icons/ci";

export default function TypesRegister() {
  const { isAdmin, user } = useContext(UserContext);
  const { setRoomTypeIdBeingCreated } = useContext(HotelContext)
  const router = useRouter();
  const [hotelId, setHotelId] = useState<string>("");
  const [roomTypes, setRoomTypes] = useState<Partial<IRoomTypeRegister>[]>([])

  const [initialValues, setInitialValues] = useState<IRoomTypeRegister>({
    name: "",
    capacity: 0,
    totalBathrooms: 0,
    totalBeds: 0,
    images: [],
    price: 0,
    hotelId: hotelId,
    roomTypeId: "",
    id: "",
  });

  useEffect(() => {
    if (user && user.hotels && user.hotels.length > 0) {
      const lastHotelId = user.hotels[user.hotels.length - 1].id;
      setHotelId(lastHotelId);
      setInitialValues((prevValues) => ({
        ...prevValues,
        hotelId: lastHotelId,
      }));
    }
  }, [user]);

  const uploadImageToCloudinary = async (
    file: string | File
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("No se recibió el enlace de la imagen");
      }
    } catch (error) {
      console.error("Error al subir la imagen a Cloudinary:", error);
      throw new Error("Error al subir la imagen");
    }
  };

  const handleAddRoomType = (
    values: IRoomTypeRegister,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setRoomTypes(prevRoomTypes => [...prevRoomTypes, {
      ...values,
      images: selectedBuffers.map(buffer => Array.from(buffer)) // Convert Uint8Array to array of numbers
    }])
    setSelectedBuffers([])
  }

  const handleSubmit = async (
    values: IRoomTypeRegister,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Hubo un problema. Por favor, inicie sesión de nuevo.");
      setSubmitting(false);
      return;
    }

    for (const roomType of roomTypes) {
      const response = await fetch('/api/upload-hotel-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomType.images)
      })

      let uploadedUrls: string[] = await response.json()

      const formData = {
        ...values,
        images: uploadedUrls,
        hotelId: hotelId || values.hotelId,
      };

      console.log("Datos enviados al back: ", formData);

      try {
        const response = await postRoomType(formData);
        setRoomTypeIdBeingCreated(response)
        Swal.fire({
          position: "top",
          icon: "success",
          title: "Tipo de habitación registrado exitosamente",
          showConfirmButton: true,
          timer: 4000,
        });
        router.push("/rooms-number");
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Ha ocurrido un error",
          timer: 4000,
        });
      } finally {
        setSubmitting(false);
      }
    }

  };

  const [selectedBuffers, setSelectedBuffers] = useState<Uint8Array[]>([])
  const handleImagesSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const filesArray = Array.from(files)
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        setSelectedBuffers((prevFiles) => [...prevFiles, buffer])
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isAdmin ? (
        <div className="flex w-full justify-center items-center">
          <div className="w-full max-w-md p-8">
            <div className="flex flex-col justify-center mb-8">
              <h1 className="text-4xl mb-2 pb-2 text-center font-bold">
                ¿Qué tipo de habitaciones tiene tu hotel?
              </h1>
              <p className="text-center">
                Asegúrate de seleccionar todos los tipos de habitaciones que
                tiene tu hotel antes de continuar
              </p>
            </div>
            <Formik initialValues={initialValues} onSubmit={handleAddRoomType}>
              {({ isSubmitting, setFieldValue }) => (
                <Form className="space-y-2">
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="name" className="formLabel">
                      Tipo de habitación
                    </label>
                    <Field
                      type="text"
                      name="name"
                      className="formInput"
                    ></Field>
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="capacity" className="formLabel">
                      ¿Para cuántas personas es?
                    </label>
                    <Field
                      type="number"
                      name="capacity"
                      placeholder="0"
                      className="formInput"
                    />
                    <ErrorMessage
                      name="capacity"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="totalBathrooms" className="formLabel">
                      ¿Cuántos baños tiene?
                    </label>
                    <Field
                      type="number"
                      name="totalBathrooms"
                      placeholder="0"
                      className="formInput"
                    />
                    <ErrorMessage
                      name="totalBathrooms"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="totalBeds" className="formLabel">
                      ¿Cuántas camas tiene?
                    </label>
                    <Field
                      type="number"
                      name="totalBeds"
                      placeholder="0"
                      className="formInput"
                    />
                    <ErrorMessage
                      name="totalBeds"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="images" className="formLabel">
                      Imagen de la habitación
                    </label>
                    <input
                      type="file"
                      multiple
                      name="images"
                      onChange={handleImagesSelection}
                    />
                    <ErrorMessage
                      name="images"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="price" className="formLabel">
                      ¿Cuál es el precio por noche? (USD)
                    </label>
                    <Field
                      type="number"
                      name="price"
                      placeholder="0"
                      className="formInput"
                    />
                    <ErrorMessage
                      name="price"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div className="flex justify-end mr-2">
                    <div>
                      <button
                        type="submit"
                        className="py-2 px-4 border border-black rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f8263a]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Creando..."
                        ) : (
                          <div className="flex items-center">
                            <h1 className="mr-1">Agregar</h1>
                            <Image
                              src={createImage}
                              alt="Crear"
                              width={24}
                              height={24}
                            />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full bg-gray-100">
          <div className=" max-w-md bg-white shadow-md rounded-md p-4 text-center">
            <Image
              src="/logo.png"
              alt="Acceso Denegado"
              width={100}
              height={100}
              className="mb-4 mx-auto"
            />
            <h1 className="text-2xl font-semibold mb-2">Acceso Denegado</h1>
            <p className="mb-4">
              No tienes permiso para acceder a esta página.
            </p>
            <Link href="/home" className="btn-secondary">
              Regresar a la página principal
            </Link>
          </div>
        </div>
      )},
      {roomTypes.length > 0 &&
        <section className={`transition-all duration-200 ease-in-out ${roomTypes.length > 0 ? 'block' : 'hidden'}`}>
          <div className="mx-auto">
            <div>
              <h1 className="text-4xl mb-2 pb-2 text-center font-bold">Tipos de Habitación</h1>
              <p className="text-gray-600">Estos tipos de habitación todavía no se han guardado. Presiona en el botón de <b>Guardar</b> de la derecha para que se guarden.</p>
            </div>
            <button className="btn-secondary">
              Guardar
              <CiSaveUp2 />
            </button>
          </div>
          <div className="flex">
            {roomTypes.map(roomType => (
              <div key={roomType.id}>
                <p>{roomType.name}</p>
                <div>
                  <p>Ver detalles</p>
                  <FaArrowDown />
                </div>
              </div>
            ))}
          </div>
        </section>
      }
    </div>
  );
}
