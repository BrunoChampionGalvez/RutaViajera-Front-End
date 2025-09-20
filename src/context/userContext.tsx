"use client";

import {
  IBooking,
  IDecodeToken,
  IHotel,
  ILoginUser,
  IReviewResponse,
  IRoomType,
  IUser,
  IUserContextType,
  IUserResponse,
} from "@/interfaces";
import {
  fetchCustomerBookings,
  getAllReviews,
  postAdminRegister,
  postCustomerRegister,
  postLogin,
} from "@/lib/server/fetchUsers";
import { jwtDecode } from "jwt-decode";
import { createContext, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { fetchHotelsByAdminId } from "@/lib/server/fetchHotels";
import { fetchCustomerDetails, fetchHotelierDetails } from "@/lib/server/fetchUsers";

export const UserContext = createContext<IUserContextType>({
  user: null,
  setUser: () => { },
  isLogged: false,
  setIsLogged: () => { },
  isAdmin: false,
  setIsAdmin: () => { },
  isSuperAdmin: false,
  setIsSuperAdmin: () => { },
  login: async () => false,
  getCustomerDetails: async () => { },
  getHotelierDetails: async () => { },
  customerRegister: async () => false,
  hotelierRegister: async () => false,
  getReviews: async () => { },
  reviews: [],
  getBookings: async () => { },
  getHotelsByAdmin: async () => { },
  addNewHotel: async () => { },
  getBookingsByHotel: async () => [],
  bookings: [],
  logOut: () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Partial<IUserResponse> | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [reviews, setReviews] = useState<IReviewResponse[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);

  const customerRegister = async (
    user: Omit<IUser, "id">
  ): Promise<boolean> => {
    try {

      const data = await postCustomerRegister(user);
      console.log(data);
      return true;
    } catch (error) {
      console.error("Error en el registro de cliente:", error);
      return false;
    }
  };

  const hotelierRegister = async (
    user: Omit<IUser, "id">
  ): Promise<boolean> => {
    try {
      const data = await postAdminRegister(user);
      console.log(data);
      return true;
    } catch (error) {
      console.error("Error en el registro de administrador:", error);
      return false;
    }
  };

  const login = async (credentials: ILoginUser): Promise<boolean> => {
    try {
      const data = await postLogin(credentials);
      console.log("Datos del servidor: ", data);
      if (data.token) {
        const decodedToken = jwtDecode<IDecodeToken>(data.token);
        console.log("Token decodificado", decodedToken);
        // roles puede venir ya en el token después del ajuste backend
        const rolesFromToken = (decodedToken as any).roles as string[] | undefined;
        const baseUser: Partial<IUserResponse> = {
          id: decodedToken.id.toString(),
          name: decodedToken.name,
          lastName: data.user?.lastName,
          email: decodedToken.email,
          phone: data.user?.phone,
          country: data.user?.country,
          city: data.user?.city,
          address: data.user?.address,
          birthDate: data.user?.birthDate,
          isAdmin: decodedToken.isAdmin,
          hotels: data.user?.hotels,
          reviews: data.user?.reviews,
          bookings: data.user?.bookings,
        };
  // Eliminamos verificación extra: el backend protege rutas con RolesGuard.
        if (rolesFromToken) (baseUser as any).roles = rolesFromToken;
        const tokenExpDate = new Date(decodedToken.exp).getUTCDate()

        setUser(baseUser as IUserResponse);
        setIsLogged(true);
  setIsAdmin(decodedToken.isAdmin);
  if ((decodedToken as any).superAdmin) setIsSuperAdmin(true);
  if ((decodedToken as any).superAdmin) setIsSuperAdmin(true);
        localStorage.setItem("token", data.token);
        localStorage.setItem('user', JSON.stringify(baseUser));

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      return false;
    }
  };

  const getCustomerDetails = async (customerId: string | undefined) => {
    if (customerId) {
      const customer = await fetchCustomerDetails(customerId)
      setUser(customer)
    }
  }

  const getHotelierDetails = async (hotelierId: string | undefined) => {
    console.log("hotelierId: ", hotelierId);
    
    if (hotelierId) {
      console.log('hola');
      
      const hotelier = await fetchHotelierDetails(hotelierId)
      console.log('hola 2');

      console.log("hotelier: ", hotelier);
      
      setUser(hotelier)
    }
  }

  const addNewHotel = (newHotel: IHotel) => {
    setUser((prevUser) => {
      if (!prevUser) return null;

      return {
        ...prevUser,
        hotels: [...(prevUser.hotels || []), newHotel],
      };
    });
  };

  // Cache sencilla para evitar spam de peticiones si múltiples componentes disparan la misma carga
  const adminHotelsCacheRef = (globalThis as any).__adminHotelsCacheRef || ((globalThis as any).__adminHotelsCacheRef = new Map());
  const getHotelsByAdmin = useCallback(async (adminId: string) => {
    if (!adminId) return;
    try {
      if (adminHotelsCacheRef.has(adminId)) {
        const cached = adminHotelsCacheRef.get(adminId);
        setUser(prev => {
          if (!prev) return prev;
          const prevHotels = prev.hotels || [];
          const sameLength = prevHotels.length === cached.length;
          const sameIds = sameLength && prevHotels.every((h: any, i: number) => h.id === cached[i].id);
          if (sameIds) return prev; // evita re-render infinito
          return { ...prev, hotels: cached };
        });
        return;
      }
      if ((adminHotelsCacheRef.get('pending') || new Set()).has(adminId)) {
        return; // Ya hay una petición en curso para este admin
      }
      const pending: Set<string> = adminHotelsCacheRef.get('pending') || new Set();
      pending.add(adminId);
      adminHotelsCacheRef.set('pending', pending);
      const data = await fetchHotelsByAdminId(adminId);
      adminHotelsCacheRef.set(adminId, data);
      pending.delete(adminId);
      setUser(prevUser => {
        if (!prevUser) return prevUser;
        const prevHotels = prevUser.hotels || [];
        const sameLength = prevHotels.length === data.length;
        const sameIds = sameLength && prevHotels.every((h: any, i: number) => h.id === data[i].id);
        if (sameIds) return prevUser;
        return { ...prevUser, hotels: data };
      });
    } catch (error) {
      console.error("Error al obtener los hoteles del admin:", error);
    }
  }, []);

  const getBookingsByHotel = async (hotelId: string): Promise<IBooking[]> => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error(
        "No se encontró el token. Por favor, inicie sesión de nuevo."
      );
      return [];
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/hotel/${hotelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener reservas");
      }

      const data: IBooking[] = await response.json();
      setBookings(data); // Guardamos las reservas en el estado
      return data;
    } catch (error) {
      console.error("Error al obtener reservas:", error);
      return [];
    }
  };

  const getReviews = useCallback(async () => {
    try {
      const data = await getAllReviews();
      setReviews(data);
      console.log("Revisiones obtenidas:", data);
    } catch (error) {
      console.error("Error al obtener revisiones:", error);
    }
  }, []);

  const getBookings = useCallback(async (customerId: string) => {
    try {
      const data = await fetchCustomerBookings(customerId);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, bookings: data } : prevUser
      );
    } catch (error) {
      console.error("Error al obtener las reservas:", error);
    }
  }, []);

  const router = useRouter();

  const logOut = () => {
    const confirm = Swal.fire({
      title: "¿Estás seguro?",
      text: "Tu sesión se cerrará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/");
        setUser(null);
        setIsLogged(false);
        setIsAdmin(false);
  setIsSuperAdmin(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      }
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        setIsLogged(true);
        const decodedToken = jwtDecode<IDecodeToken>(token);
        setIsAdmin(decodedToken.isAdmin);
  if ((decodedToken as any).superAdmin) setIsSuperAdmin(true);
        // Try to load persisted user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser) as IUserResponse);
        } else {
          // Reconstruct minimal user object from token so components (e.g., Bookings) have an id
            const minimalUser: any = {
              id: decodedToken.id.toString(),
              name: decodedToken.name,
              email: decodedToken.email,
              isAdmin: decodedToken.isAdmin,
              bookings: [],
              roles: (decodedToken as any).roles || (decodedToken.isAdmin ? ['admin'] : ['user'])
            };
            setUser(minimalUser as IUserResponse);
            localStorage.setItem('user', JSON.stringify(minimalUser));
        }
        if (decodedToken.id) {
          // Fetch bookings & admin hotels after ensuring user id is available
          getBookings(decodedToken.id);
          if (decodedToken.isAdmin) {
            getHotelsByAdmin(decodedToken.id);
          }
        }
      } else {
        setIsLogged(false);
      }
      // If no token, clear any stale user
      if (!token) setUser(null);
    }
  }, [getBookings, getHotelsByAdmin]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLogged,
        setIsLogged,
        isAdmin,
        setIsAdmin,
        isSuperAdmin,
        setIsSuperAdmin,
        login,
        getCustomerDetails,
        getHotelierDetails,
        hotelierRegister,
        customerRegister,
        getReviews,
        reviews,
        getBookings,
        getHotelsByAdmin,
        addNewHotel,
        getBookingsByHotel,
        bookings,
        logOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
