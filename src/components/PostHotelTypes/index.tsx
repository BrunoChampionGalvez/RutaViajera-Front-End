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
import { IconContext } from "react-icons";
import { MdDelete } from "react-icons/md";

export default function TypesRegister() {
  const { isAdmin, user } = useContext(UserContext);
  const { setRoomTypeIdBeingCreated } = useContext(HotelContext)
  const router = useRouter();
  const [hotelId, setHotelId] = useState<string>("");
  const [savedRoomTypes, setSavedRoomTypes] = useState<Partial<IRoomTypeRegister>[]>([])
  const [nonSavedRoomTypes, setNonSavedRoomTypes] = useState<Partial<IRoomTypeRegister>[]>([])
  const [visibleName, setVisibleName] = useState<string | undefined>(undefined);
  const [visibleRoomType, setVisibleRoomType] = useState<Partial<IRoomTypeRegister> | null>(null)
  const [isSavedRoomTypesVisible, setIsSavedRoomTypesVisible] = useState<boolean>(false)
  const [isNonSavedRoomTypesVisible, setIsNonSavedRoomTypesVisible] = useState<boolean>(true)

  const showSavedRoomTypes = () => {
    setIsNonSavedRoomTypesVisible(false)
    setIsSavedRoomTypesVisible(true)
  }

  const showNonSavedRoomTypes = () => {
    setIsSavedRoomTypesVisible(false)
    setIsNonSavedRoomTypesVisible(true)
  }

  const toggleRoomTypeDetailsName = (name: string | undefined) => {
    if (isSavedRoomTypesVisible) {
      setVisibleName(visibleName === name ? undefined : name);
      for (const roomType of savedRoomTypes) {
        if (roomType.name === visibleName) {
          setVisibleRoomType(roomType)
        }
      }
    } else if (isNonSavedRoomTypesVisible) {
      setVisibleName(visibleName === name ? undefined : name);
      for (const roomType of nonSavedRoomTypes) {
        if (roomType.name === visibleName) {
          setVisibleRoomType(roomType)
        }
      }
    }
  };

  const [initialValues, setInitialValues] = useState<Omit<IRoomTypeRegister, 'id'>>({
    name: "",
    capacity: 0,
    totalBathrooms: 0,
    totalBeds: 0,
    images: [],
    price: 0,
    hotelId: hotelId
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

  const handleDeleteNonSavedRoomType = (id: number | undefined) => {
    const newNonSavedRoomTypes = [...nonSavedRoomTypes]
    const filteredNonSavedRoomTypes = newNonSavedRoomTypes.filter((roomType) => roomType.id !== id)
    setNonSavedRoomTypes(filteredNonSavedRoomTypes)
  }

  const [roomTypeIdCounter, setRoomTypeIdCounter] = useState<number>(0)

  const handleSubmit = async (
    values: Omit<IRoomTypeRegister, 'id'>,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Hubo un problema. Por favor, inicie sesión de nuevo.");
      setSubmitting(false);
      return;
    }

    const newRoomTypes = [
      ...nonSavedRoomTypes
    ]

    const newRoomTypesNoId = newRoomTypes.map(roomType => {
      delete roomType.id
      return roomType
    })

    for (const roomType of newRoomTypesNoId) {
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
      const arrayOfSavedRoomTypes = []
      try {
        const response = await postRoomType(formData);
        arrayOfSavedRoomTypes.push(response)
        Swal.fire({
          position: "top",
          icon: "success",
          title: "Tipo de habitación registrado exitosamente",
          showConfirmButton: true,
          timer: 4000,
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Ha ocurrido un error",
          timer: 4000,
        });
      } finally {
        setSavedRoomTypes(arrayOfSavedRoomTypes)
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
          <div className="w-max p-8">
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="flex">
                  <div className="flex justify-center w-1/2">
                    <div className="w-8/12 flex flex-col gap-3 p-8">

                      <div className="flex flex-col justify-center mb-8">
                        <h1 className="text-4xl mb-2 pb-2 text-center font-bold">
                          ¿Qué tipo de habitaciones tiene tu hotel?
                        </h1>
                        <p className="text-center">
                          Asegúrate de seleccionar todos los tipos de habitaciones que
                          tiene tu hotel antes de continuar
                        </p>
                      </div>
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
                          <div
                            onClick={
                              () => {

                                setNonSavedRoomTypes(prevRoomTypes => [...prevRoomTypes, {
                                  id: roomTypeIdCounter,
                                  ...values,
                                  images: selectedBuffers.map(buffer => Array.from(buffer)) // Convert Uint8Array to array of numbers
                                }])
                                setSelectedBuffers([])
                              }
                            }
                            className="py-2 px-4 border w-max border-black rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 cursor-pointer"
                          >
                            <div className="flex items-center w-max">
                              <h1 className="mr-1">Agregar</h1>
                              <Image
                                src={createImage}
                                alt="Crear"
                                width={24}
                                height={24}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border border-r-gray-300"></div>
                  <section className={`place-self-start p-8 w-1/2 transition-all duration-200 ease-in-out`}>
                    <div className="mx-auto mb-5">
                      <div className="flex justify-center items-center gap-8 mb-2 pb-2">
                        <h1 className="text-4xl text-center font-bold w-max">Tipos de<br />Habitación</h1>
                        <div className="w-max">
                          <button
                            disabled={isSavedRoomTypesVisible}
                            className={`btn-secondary !text-md text-center flex items-center justify-center ${isSavedRoomTypesVisible && "!bg-[#e2293c96] hover:!bg-[#e2293c96] !cursor-default"}`}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                            <IconContext.Provider value={{ size: "1.8em", className: "ml-2" }}>

                              <CiSaveUp2 />
                            </IconContext.Provider>

                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-center mb-3 w-4/6 mx-auto">Estos tipos de habitación no se han guardado. Presiona el botón <b>Guardar</b> de arriba para que se guarden y puedas editar sus cuartos.</p>
                      <div className="flex justify-around mx-auto w-4/6">
                        <div
                          onClick={showNonSavedRoomTypes}
                          className={`relative inline-block text-center bg-white border border-[#e93446] hover:bg-gray-100 py-2 px-4 rounded-md shadow-sm text-md font-medium cursor-pointer text-[#e93446] ${isNonSavedRoomTypesVisible && "before:absolute before:content-[''] before:h-0.5 before:left-4 before:bottom-1 before:bg-[#e93446] before:w-[calc(100%-30px)] before:rounded-sm"}`}>
                          Sin Guardar
                        </div>
                        <div
                          onClick={showSavedRoomTypes}
                          className={`relative inline-block text-center bg-white border border-[#e93446] hover:bg-gray-100 py-2 px-4 rounded-md shadow-sm text-md font-medium cursor-pointer text-[#e93446] ${isSavedRoomTypesVisible && "before:absolute before:content-[''] before:h-0.5 before:left-4 before:bottom-1 before:bg-[#e93446] before:w-[calc(100%-30px)] before:rounded-sm"}`}>
                          Guardados
                        </div>
                      </div>
                    </div>
                    {isNonSavedRoomTypesVisible ?
                      <div>
                        {
                          nonSavedRoomTypes.length > 0 ?

                            <div className="flex justify-around w-5/6 gap-2 flex-wrap mx-auto">
                              {nonSavedRoomTypes.map(roomType => (
                                <div className="w-max relative">

                                  <div className="-z-20 flex flex-col mt-5 gap-1 w-max border p-2 rounded-lg border-gray-600" key={roomType.name}>
                                    <div onClick={() => {
                                      handleDeleteNonSavedRoomType(roomType.id)
                                    }} className="absolute top-7 right-2 cursor-pointer">
                                      <IconContext.Provider value={{ color: "#f8263a", size: "1.3em" }}>
                                        <MdDelete />
                                      </IconContext.Provider>
                                    </div>
                                    <p className="font-bold text-lg text-gray-900 select-none">{roomType.name}</p>
                                    <div
                                      onClick={() => toggleRoomTypeDetailsName(roomType.name)}
                                      className="w-32 justify-start items-center flex gap-1 cursor-pointer"
                                    >
                                      <p className="text-gray-600 text-sm select-none">Ver detalles</p>
                                      <IconContext.Provider value={{ size: "1em", className: `ml-1 text-gray-500 transition-rotate duration-300 ease-in-out ${visibleName === roomType.name ? "-rotate-180" : "rotate-0"}` }}>

                                        <FaArrowDown />
                                      </IconContext.Provider>


                                    </div>
                                  </div>
                                  <div className={`bg-gray-100 z-20 absolute rounded-md transition-all border border-gray-500 shadow-lg p-2 w-max duration-300 ease-in-out ${visibleName === roomType.name ? `top-[110%] opacity-100 pointer-events-auto select-none` : "top-[100%] opacity-0 pointer-events-none"}`}>
                                    <p><b>Tipo de habitación:</b> {roomType.name}</p>
                                    <p><b>Capacidad:</b> {roomType.capacity}</p>
                                    <p><b>Baños:</b> {roomType.totalBathrooms}</p>
                                    <p><b>Camas:</b> {roomType.totalBeds}</p>
                                    <p><b>Precio por noche (USD):</b> {roomType.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div> :
                            <div className="mt-14">
                              <p className="text-center">No has creado ningún tipo de habitación todavía.</p>
                            </div>
                        }
                      </div> :
                      <div>
                        {
                          savedRoomTypes.length > 0 ?

                            <div className="flex justify-around w-5/6 gap-2 flex-wrap mx-auto">
                              {savedRoomTypes.map(roomType => (
                                <div className="w-max relative">

                                  <div className="-z-20 flex flex-col mt-5 gap-1 w-max border p-2 rounded-lg border-gray-600" key={roomType.name}>
                                    <p className="font-bold text-lg text-gray-900 select-none">{roomType.name}</p>
                                    <div
                                      onClick={() => toggleRoomTypeDetailsName(roomType.name)}
                                      className="w-32 justify-start items-center flex gap-1 cursor-pointer"
                                    >
                                      <p className="text-gray-600 text-sm select-none">Ver detalles</p>
                                      <IconContext.Provider value={{ size: "1em", className: `ml-1 text-gray-500 transition-rotate duration-300 ease-in-out ${visibleName === roomType.name ? "-rotate-180" : "rotate-0"}` }}>

                                        <FaArrowDown />
                                      </IconContext.Provider>


                                    </div>
                                  </div>
                                  <div className={`bg-gray-100 z-20 absolute rounded-md transition-all border border-gray-500 shadow-lg p-2 w-max duration-300 ease-in-out ${visibleName === roomType.name ? `top-[110%] opacity-100 pointer-events-auto select-none` : "top-[100%] opacity-0 pointer-events-none"}`}>
                                    <p><b>Tipo de habitación:</b> {roomType.name}</p>
                                    <p><b>Capacidad:</b> {roomType.capacity}</p>
                                    <p><b>Baños:</b> {roomType.totalBathrooms}</p>
                                    <p><b>Camas:</b> {roomType.totalBeds}</p>
                                    <p><b>Precio por noche (USD):</b> {roomType.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div> :
                            <div className="mt-14">
                              <p className="text-center">No has guardado ningún tipo de habitación todavía.</p>
                            </div>
                        }
                      </div>
                    }
                  </section>
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
      )}

    </div>
  );
}
