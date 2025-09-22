// Unified token accessor (safe for SSR environments)
const getAuthToken = () => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
  } catch (e) {
    console.warn('Unable to access token from localStorage', e);
  }
  return null;
};

import {
  ICreateReview,
  IEditProfileHotelier,
  IEditProfileUser,
  ILogin,
  INewPassword,
  IReview,
  IUser,
} from "@/interfaces";
import { getApiBase } from "@/lib/apiBase";

export const postCustomerRegister = async (user: Omit<IUser, "id">) => {
  // Normalize payload: backend expects birthDate string <= 10 chars (e.g. YYYY-MM-DD)
  const payload = {
    ...user,
    birthDate: user.birthDate ? user.birthDate.substring(0, 10) : '',
  };
  try {
    const response = await fetch(
      `${getApiBase()}/auth/cxSignUp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      let details: any = null;
      try { details = await response.json(); } catch {}
      const backendMsg = details?.message || details?.error || 'Solicitud inválida';
      const fullMessage = Array.isArray(backendMsg) ? backendMsg.join('; ') : backendMsg;
      const err = new Error(`Registro fallido (${response.status}): ${fullMessage}`);
      (err as any).details = details;
      throw err;
    }
  } catch (error) {
    console.error("Error en la operación de registro:", error);
    throw error;
  }
};

export const postAdminRegister = async (user: Omit<IUser, "id">) => {
  try {
    const response = await fetch(
      `${getApiBase()}/auth/adminSignUp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("Error en la solicitud: " + response.status);
    }
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const postLogin = async (credentials: ILogin) => {
  try {
    const response = await fetch(
      `${getApiBase()}/auth/SignIn`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("Error en la solicitud: " + response.status);
    }
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const sendEmail = async (credentials: Partial<ILogin>) => {
  try {
    const response = await fetch(
      `${getApiBase()}/auth/password-recovery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      }
    );
    return response;
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const tokenVerified = async (
  credentials: Omit<INewPassword, "confirmPassword">
) => {
  try {
    const response = await fetch(
      `${getApiBase()}/auth/api/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      }
    );
    return response;
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const postReview = async (review: ICreateReview) => {
  const token = getAuthToken();
  console.log("Token:", token);
  try {
    const response = await fetch(
      `${getApiBase()}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(review),
      }
    );

    if (response.ok) {
      const data = await response.text();
      return data;
    } else {
      let backendDetails: any = null;
      try { backendDetails = await response.json(); } catch {}
      const backendMsg = backendDetails?.message || backendDetails?.error || `HTTP ${response.status}`;
      console.error("Detalles del error:", backendDetails);
      const err = new Error(
        Array.isArray(backendMsg) ? backendMsg.join('; ') : backendMsg
      );
      (err as any).status = response.status;
      (err as any).details = backendDetails;
      throw err;
    }
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const getAllReviews = async () => {
  try {
    const response = await fetch(
      `${getApiBase()}/reviews`
    );
    if (response.ok) {
      const data = await response.json();
      console.log(data);

      return data;
    } else {
      throw new Error("Error en la solicitud: " + response.status);
    }
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const putUpdateProfile = async (
  userId: string,
  profileData: IEditProfileUser
) => {
  try {
    console.log('on putUpdateProfile');
    const token =
      typeof window !== "undefined" && localStorage.getItem("token");

    
    
    const response = await fetch(
      `${getApiBase()}/customers/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      }
    );

    console.log(response);
    

    if (!response.ok) {
      throw new Error("Error al actualizar el perfil");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en la solicitud:", error);
    throw new Error("Error al actualizar el perfil");
  }
};
export const putUpdateProfileHotelier = async (
  userId: string,
  profileData: IEditProfileHotelier
) => {
  try {
    const token =
      typeof window !== "undefined" && localStorage.getItem("token");
    const response = await fetch(
      `${getApiBase()}/hotel-admins/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      }
    );
    if (!response.ok) {
      throw new Error("Error al actualizar el perfil");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en la solicitud:", error);
    throw new Error("Error al actualizar el perfil");
  }
};

export const fetchCustomerBookings = async (customerId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error("No se encontró el token de autenticación.");
  const base = getApiBase();
  let response: Response;
  try {
    response = await fetch(`${base}/bookings/customer/${customerId}` , {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
  } catch (err: any) {
    if (err?.message === 'Failed to fetch') {
      throw new Error(`Failed to fetch - No se pudo contactar al backend (${base}/bookings/customer/${customerId}). Verifica backend (PORT), CORS y variable NEXT_PUBLIC_API_URL.`);
    }
    throw err;
  }
  if (!response.ok) {
    try {
      const errData = await response.json();
      if (response.status === 400 && (errData?.message === 'No se encontró ningún booking.' || /No se encontr[oó] ning[uú]n booking/i.test(errData?.message))) {
        return [] as any[]; // no bookings is non-fatal
      }
      throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText} - ${errData?.message || ''}`);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
    }
  }
  return await response.json();
};

export const cancelBooking = async (bookingId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication token missing');
  const response = await fetch(
    `${getApiBase()}/bookings/cancel/${bookingId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const text = await response.text();
  if (response.ok && /Booking cancelado exitosamente/i.test(text)) return true;
  throw new Error(
    `Error en la solicitud: ${response.status} - ${response.statusText}: ${text}`
  );
};

export const fetchCustomerDetails = async (customerId: string) => {
  const token = getAuthToken();
  const base = getApiBase();
  try {
    const response = await fetch(`${base}/customers/${customerId}` , {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      let details: any = null; try { details = await response.json(); } catch {}
      const message = details?.message || 'Error fetching customer details';
      throw new Error(`Customer fetch failed (${response.status}): ${message}`);
    }
    return response.json();
  } catch (err: any) {
    if (err?.message === 'Failed to fetch') {
      throw new Error(`Failed to fetch - No se pudo contactar al backend (${base}/customers/${customerId}). Verifica que el backend esté corriendo, CORS y NEXT_PUBLIC_API_URL.`);
    }
    throw err;
  }
};

export const fetchHotelierDetails = async (hotelierId: string) => {
  const token = getAuthToken();
  const base = getApiBase();
  try {
    const response = await fetch(`${base}/hotel-admins/${hotelierId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      let details: any = null; try { details = await response.json(); } catch {}
      const message = details?.message || 'Error fetching hotel admin details';
      throw new Error(`Hotelier fetch failed (${response.status}): ${message}`);
    }
    return response.json();
  } catch (err: any) {
    if (err?.message === 'Failed to fetch') {
      throw new Error(`Failed to fetch - No se pudo contactar al backend (${base}/hotel-admins/${hotelierId}). Verifica backend, CORS y NEXT_PUBLIC_API_URL.`);
    }
    throw err;
  }
};
