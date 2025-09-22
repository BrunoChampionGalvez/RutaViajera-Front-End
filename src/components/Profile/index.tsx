"use client";
import { UserContext } from "@/context/userContext";
import { IDecodeToken, IUserResponse } from "@/interfaces";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

export default function Profile() {
  const { isLogged, setUser, user, isAdmin, setIsAdmin, getCustomerDetails, getHotelierDetails } = useContext(UserContext);
  let decodedToken: IDecodeToken
  const [userId, setUserId] = useState<string>("")
  
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      decodedToken = jwtDecode<IDecodeToken>(token)
      setUserId(decodedToken.id)
      console.log('isAdmin set: ', decodedToken.isAdmin);
      
    }
  }, [])

  useEffect(() => {
    console.log('user: ', user);
    
    if (!isAdmin) {
      console.log('no es admin');
      getCustomerDetails(userId)
    } else {
      console.log('es admin');

      getHotelierDetails(userId)
    }
  }, [userId])

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-10">
      <div className="flex-1">
        <h1 className="text-3xl sm:text-4xl font-semibold mt-6 mb-4 sm:m-6 sm:mb-2 p-0">Mi perfil</h1>
      </div>
      <div>
        <div className="mx-auto max-h-screen h-1/3 w-full md:w-2/3">
          {isLogged ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 my-8 sm:my-12">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight">¡Hola, {user?.name}!</h1>
                </div>
                {isAdmin ? (
                  <Link href={"/edit-profile/hotelier"} className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-100 focus:bg-red-100 border border-red-600 rounded-md sm:mr-2 self-start sm:self-auto">
                    <Image
                      src={"/edit.png"}
                      alt="Editar"
                      width={24}
                      height={24}
                      className="invert mr-2"
                    />
                    Editar perfil
                  </Link>
                ) : (
                  <Link href={"/edit-profile/customer"} className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-100 focus:bg-red-100 border border-red-600 rounded-md sm:mr-2 self-start sm:self-auto">
                    <Image
                      src={"/edit.png"}
                      alt="Editar"
                      width={24}
                      height={24}
                      className="invert mr-2"
                    />
                    Editar perfil
                  </Link>
                )}
              </div>
              <div>
                <div className="border border-y-4 border-gray-900 p-4 rounded-lg w-full md:w-2/3 mx-auto shadow-sm bg-white">
                  <h2 className="text-xl sm:text-2xl font-light p-2 underline decoration-red-500 underline-offset-8">
                    Tú información personal
                  </h2>
                  <div className="border-b-2 rounded-md p-2 mx-1 sm:mx-2">
                    <h2 className="font-semibold">Fecha de nacimiento</h2>
                    <p className="text-muted-foreground">{user?.birthDate}</p>
                  </div>
                  <div className="border-b-2 rounded-md p-2 mx-1 sm:mx-2">
                    <h2 className="font-semibold">Correo electrónico</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="border-b-2 rounded-md p-2 mx-1 sm:mx-2">
                    <h2 className="font-semibold">Número de teléfono</h2>
                    <p className="text-muted-foreground">{user?.phone}</p>
                  </div>
                  <div className="border-b-2 rounded-md p-2 mx-1 sm:mx-2 mb-2">
                    <h2 className="font-semibold">Dirección</h2>
                    <p
                      className="text-muted-foreground"
                      style={{ color: "#588157" }}
                    >
                      {user?.address}, {user?.city}, {user?.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2>No estás logueado</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
