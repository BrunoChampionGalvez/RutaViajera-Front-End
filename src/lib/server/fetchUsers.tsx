const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
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
  try {
    const response = await fetch(
      "https://rutaviajera-backend-production.up.railway.app/auth/cxSignUp",
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

export const postAdminRegister = async (user: Omit<IUser, "id">) => {
  try {
    const response = await fetch(
      "https://rutaviajera-backend-production.up.railway.app/auth/adminSignUp",
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
      "https://rutaviajera-backend-production.up.railway.app/auth/SignIn",
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
      "https://rutaviajera-backend-production.up.railway.app/auth/password-recovery",
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
      "https://rutaviajera-backend-production.up.railway.app/auth/api/reset-password",
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
  const token = getToken();
  console.log("Token:", token);
  try {
    const response = await fetch(
      "https://rutaviajera-backend-production.up.railway.app/reviews",
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
      const errorData = await response.json();
      console.error("Detalles del error:", errorData);
      throw new Error("Error al enviar la reseña.");
    }
  } catch (error) {
    console.error("Error en la operación:", error);
    throw error;
  }
};

export const getAllReviews = async () => {
  try {
    const response = await fetch(
      "https://rutaviajera-backend-production.up.railway.app/reviews"
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
      `https://rutaviajera-backend-production.up.railway.app/customers/${userId}`,
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
      `https://rutaviajera-backend-production.up.railway.app/hotel-admins/${userId}`,
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
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No se encontró el token de autenticación.");
  }

  const response = await fetch(
    `https://rutaviajera-backend-production.up.railway.app/bookings/customer/${customerId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error en la solicitud: ${response.status} - ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

export const cancelBooking = async (bookingId: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No se encontró el token de autenticación.");
  }
  const response = await fetch(
    `https://rutaviajera-backend-production.up.railway.app/bookings/cancel/${bookingId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const text = await response.text();
  if (
    response.status === 201 &&
    text.includes("Booking cancelado exitosamente")
  ) {
    return true;
  }
  throw new Error(
    `Error en la solicitud: ${response.status} - ${response.statusText}: ${text}`
  );
};

export const fetchCustomerDetails = async (customerId: string) => {
  const token = localStorage.getItem("token");
  console.log('1 fetchCustomerDetails');
  
  const response = await fetch(
    `https://rutaviajera-backend-production.up.railway.app/customers/${customerId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer: ${token}`,
      }
    }
  );
  console.log('2 fetchCustomerDetails');


  if (!response.ok) throw new Error('Error in fetching the customer details.')
  return response.json()
}

export const fetchHotelierDetails = async (hotelierId: string) => {
  const token = localStorage.getItem("token");

  console.log('1 fetchHotelierDetails');

  const response = await fetch(
    `https://rutaviajera-backend-production.up.railway.app/hotel-admins/${hotelierId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer: ${token}`,
      }
    }
  );

  console.log('2 fetchHotelierDetails');

  if (!response.ok) throw new Error('Error in fetching the hotel admin details.')
  const json = await response.json()
  return json
}
