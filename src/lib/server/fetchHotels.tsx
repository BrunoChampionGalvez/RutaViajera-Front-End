import {
  ICreateBooking,
  ICreateNumberOfRoom,
  IHotelRegisterPost,
  IRoomType,
  IRoomTypeRegister,
} from "@/interfaces";

export const postHotel = async (hotel: IHotelRegisterPost) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error(
      "No se encontró el token. Por favor, inicie sesión de nuevo."
    );
  }

  // Validación defensiva: asegurar que venga hotel_admin_id con forma UUID básica
  if (!hotel?.hotel_admin_id) {
    console.warn('[postHotel] Falta hotel_admin_id en payload. Abortando antes de llamar API.', hotel);
    throw new Error('Hotel admin id ausente. Vuelve a iniciar sesión como hotelero.');
  }
  const uuidRegex = /^[0-9a-fA-F-]{30,}$/;
  if (!uuidRegex.test(hotel.hotel_admin_id)) {
    console.warn('[postHotel] hotel_admin_id no parece UUID válido:', hotel.hotel_admin_id);
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(hotel),
      }
    );
    if (!response.ok) {
      let errorMsg = `Error en la solicitud: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error("Error en la solicitud backend:", errorData);
        const backendMessage = errorData?.message || errorData?.error;
        if (backendMessage === 'this Admin is not available') {
          errorMsg = 'El ID de hotelero enviado no existe en la base de datos. Asegúrate de haber iniciado sesión como hotelero o de que tu registro de hotelero se haya creado correctamente.';
        } else if (backendMessage) {
          errorMsg += ` - ${backendMessage}`;
        }
      } catch (e) {
        console.warn('No se pudo parsear JSON de error de crear hotel');
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const postRoomType = async (roomType: Partial<IRoomType>) => {
  const token = typeof window !== "undefined" && localStorage.getItem("token");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/roomstype`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(roomType),
    }
  );

  if (!response.ok) throw new Error('Error in posting the room type.')
  const data = await response.json();
  return data;
};

export const postRoom = async (rooms: string[], roomTypeId: string | null) => {
  const token = typeof window !== "undefined" && localStorage.getItem("token");
  const successes: any[] = [];
  const failures: { roomNumber: string; error: string; nonJson?: boolean }[] = [];

  if (!token) {
    console.warn('[postRoom] Falta token en localStorage');
    return { successes, failures: rooms.map(r => ({ roomNumber: r, error: 'Token ausente' })) };
  }
  if (!roomTypeId) {
    console.warn('[postRoom] roomTypeId null, abortando batch');
    return { successes, failures: rooms.map(r => ({ roomNumber: r, error: 'roomsTypeId faltante' })) };
  }
  // simple comprobación UUID (no estricta a versión) para advertir si no parece válido
  const uuidLike = /^[0-9a-fA-F-]{30,}$/;
  if (!uuidLike.test(roomTypeId)) {
    console.warn('[postRoom] roomTypeId no parece UUID ->', roomTypeId);
  }

  for (const room of rooms) {
    try {
      const trimmed = room.trim();
      if (!trimmed) {
        failures.push({ roomNumber: room, error: 'roomNumber vacío' });
        continue;
      }
      const roomObjectToSend = { roomNumber: trimmed, roomsTypeId: roomTypeId };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roomObjectToSend),
      });
      if (!response.ok) {
        const raw = await response.text();
        let backendMsg = raw;
        try {
          const parsed = JSON.parse(raw);
          backendMsg = parsed?.message || parsed?.error || raw;
        } catch {
          // respuesta no JSON (posible HTML / texto plano)
        }
        // Normaliza mensajes conocidos
        const lowered = (backendMsg || '').toLowerCase();
        if (lowered.includes('roomtype') && lowered.includes('not') && lowered.includes('found')) {
          backendMsg = 'El tipo de habitación no existe (verifica que se guardó correctamente).';
        } else if (lowered.includes('already exists')) {
          backendMsg = 'Ese número de habitación ya existe en este hotel.';
        }
        throw new Error(backendMsg || 'Error posting room');
      }
      // Respuesta exitosa: intentar parsear JSON, fallback a objeto mínimo
      const successRaw = await response.text();
      let successPayload: any = null;
      try {
        successPayload = JSON.parse(successRaw);
      } catch {
        successPayload = { roomNumber: trimmed, raw: successRaw, nonJson: true };
      }
      successes.push(successPayload);
    } catch (err: any) {
      console.error(`[postRoom] Error creando room ${room}:`, err?.message || err);
      failures.push({ roomNumber: room, error: err?.message || 'Error' });
    }
  }
  return { successes, failures };
};

export const getHotelById = async (id: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/hotels/${id}`,
      {
        cache: "no-cache",
      }
    );
    const hotel = await response.json();
    return hotel;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchHotelsByAdminId = async (id: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No se encontró el token de autenticación.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/hotels/hotelAdmin/${id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  // Eliminado console.log redundante que generaba ruido en consola.

  if (!response.ok) {
    throw new Error(
      `Error en la solicitud: ${response.status} - ${response.statusText}`
    );
  }
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Error en la solicitud: " + response.status);
  }
};

export const getHotels = async () => {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/hotels`;
    console.log("Environment variable NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("Fetching hotels from URL:", apiUrl);
    
    const response = await fetch(apiUrl);
    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Hotels data received:", data);
      return data;
    } else {
      const errorText = await response.text();
      console.error("Error response text:", errorText);
      throw new Error("Error en la solicitud: " + response.status);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const getHotelsBySearch = async (searchQuery: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/hotels/search?search=${searchQuery}`
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("Error en la solicitud: " + response.status);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBookingByHotel = async (hotelId: string) => {
  const response = await fetch("#");
  const data = await response.json();
  return data;
};

export const getRoomsByHotel = async (hotelId: string) => {
  const response = await fetch("#");
  const data = await response.json();
  return data;
};

export const postBooking = async (booking: {
  customerId: string;
  hotelId: string;
  roomTypesIdsAndDates: {
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
  }[];
  totalPayment: number;
}) => {
  const token = typeof window !== "undefined" && localStorage.getItem("token");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(booking),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      let message = `Error en la solicitud: ${response.status}`;
      try {
        const errData = await response.json();
        // NestJS validation or custom errors often return {message: string | string[]}
        if (errData?.message) {
          if (Array.isArray(errData.message)) message += ' - ' + errData.message.join(', ');
          else message += ' - ' + errData.message;
        }
      } catch {}
      return { error: true, status: response.status, message };
    }
  } catch (error) {
    console.error(error);
    return { error: true, status: 0, message: (error as Error).message };
  }
};

// export const postBooking = async (booking: ICreateBooking) => {
//   const token = typeof window !== "undefined" && localStorage.getItem("token");
//   const response = await fetch("${process.env.NEXT_PUBLIC_API_URL}/bookings", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(booking),
//   });
//   const data = await response.json();
//   return data;
// };

export const getRoomTypesByHotelId = async (
  hotelId: string | string[] | undefined
): Promise<IRoomTypeRegister[]> => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/roomstype/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Datos JSON recibidos:", data);
    if (Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        roomTypeId: item.roomTypeId,
        name: item.name,
        capacity: item.capacity,
        totalBathrooms: item.totalBathrooms,
        totalBeds: item.totalBeds,
        images: item.images,
        price: item.price,
      }));
    } else {
      console.error("Error: Expected array but received:", data);
      return [];
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    return [];
  }
};

export const updateHotel = async (hotelId: string, hotelData: any) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(hotelData),
    }
  );

  if (!response.ok) {
    throw new Error(`Error en la actualización del hotel: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const deleteHotel = async (hotelId: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No se encontró el token de autenticación.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const text = await response.text();
  try {
    if (response.status === 400 && text.includes("Hotel was eliminated")) {
      return true;
    }

    const data = JSON.parse(text);
    if (!response.ok) {
      throw new Error(
        `Error en la solicitud: ${response.status} - ${response.statusText}: ${data.message}`
      );
    }
    return data;
  } catch (error) {
    console.error("Error parseando JSON:", error, text);
    throw new Error("Respuesta del servidor no es JSON válido.");
  }
};

export const fetchBookingById = async (bookingId: string) => {
  const token = typeof window !== "undefined" && localStorage.getItem("token");
  if (!token) throw new Error('Token no encontrado');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}` , {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Error obteniendo booking: ${response.status}`);
  return await response.json();
};