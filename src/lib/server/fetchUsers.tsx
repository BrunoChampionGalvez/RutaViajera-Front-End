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

export const postCustomerRegister = async (user: Omit<IUser, "id">) => {
  // Normalize payload: backend expects birthDate string <= 10 chars (e.g. YYYY-MM-DD)
  const payload = {
    ...user,
    birthDate: user.birthDate ? user.birthDate.substring(0, 10) : '',
  };
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/cxSignUp`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/auth/adminSignUp`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/auth/SignIn`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/auth/password-recovery`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/auth/api/reset-password`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/reviews`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/reviews`
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
      `${process.env.NEXT_PUBLIC_API_URL}/customers/${userId}`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/hotel-admins/${userId}`,
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

  if (!token) {
    throw new Error("No se encontró el token de autenticación.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/bookings/customer/${customerId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    // Attempt to interpret known backend "no bookings" message
    try {
      const errData = await response.json();
      if (
        response.status === 400 &&
        (errData?.message === 'No se encontró ningún booking.' ||
          /No se encontr[oó] ning[uú]n booking/i.test(errData?.message))
      ) {
        return [] as any[]; // treat as empty list instead of error
      }
      throw new Error(
        `Error en la solicitud: ${response.status} - ${response.statusText} - ${errData?.message || ''}`
      );
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(
        `Error en la solicitud: ${response.status} - ${response.statusText}`
      );
    }
  }

  const data = await response.json();
  return data;
};

export const cancelBooking = async (bookingId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication token missing');
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/bookings/cancel/${bookingId}`,
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
  console.log('1 fetchCustomerDetails');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}`,
    {
      method: "GET",
      headers: {
        // Removed colon after Bearer; correct scheme is 'Bearer <token>'
        Authorization: `Bearer ${token}`,
      }
    }
  );
  console.log('2 fetchCustomerDetails');
  if (!response.ok) {
    let details: any = null;
    try { details = await response.json(); } catch {}
    const message = details?.message || 'Error fetching customer details';
    throw new Error(`Customer fetch failed (${response.status}): ${message}`);
  }
  return response.json();
}

export const fetchHotelierDetails = async (hotelierId: string) => {
  const token = getAuthToken();

  console.log('1 fetchHotelierDetails');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/hotel-admins/${hotelierId}`,
    {
      method: "GET",
      headers: {
        // Removed colon after Bearer; correct scheme is 'Bearer <token>'
        Authorization: `Bearer ${token}`,
      }
    }
  );

  console.log('2 fetchHotelierDetails');
  if (!response.ok) {
    let details: any = null;
    try { details = await response.json(); } catch {}
    const message = details?.message || 'Error fetching hotel admin details';
    throw new Error(`Hotelier fetch failed (${response.status}): ${message}`);
  }
  return response.json();
}
