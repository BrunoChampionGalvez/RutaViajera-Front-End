"use client";

import { validatePostHotel } from "@/helpers/validateData";
import { IHotelRegisterInitialValues, ILocationDetail } from "@/interfaces";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Image from "next/image";
import continueImage from "../../../public/continue.png";
import { useContext, useState, useRef } from "react";
import { showToast } from "@/lib/toast";
import useGoogleMapsData from "@/lib/googleMaps/googleMapsData";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { postHotel } from "@/lib/server/fetchHotels";
import { getApiBase } from "@/lib/apiBase";
import { UserContext } from "@/context/userContext";
import Link from "next/link";
import { HotelContext } from "@/context/hotelContext";

interface HotelRegisterProps {
  onHotelCreated?: (hotel: any) => void; // se tipará mejor luego con IHotel
  suppressRedirect?: boolean; // si true no hace push automático
  // Draft persistence (optional)
  draft?: Partial<IHotelRegisterInitialValues> & { servicesString?: string };
  onDraftChange?: (partial: Partial<IHotelRegisterInitialValues> & { servicesString?: string }) => void;
}

const HotelRegister: React.FC<HotelRegisterProps> = ({ onHotelCreated, suppressRedirect = false, draft, onDraftChange }) => {
  // NOTE: Se eliminó la dependencia de isAdmin para no bloquear la creación si el flag local está desincronizado.
  // El backend (NestJS) tiene RolesGuard y devolverá 403 si realmente el usuario no posee el rol.
  const { user, addNewHotel } = useContext(UserContext);
  const { setHotelBeingCreated } = useContext(HotelContext)
  const router = useRouter();
  const [hotelLocation, setHotelLocation] = useState<ILocationDetail | null>(
    null
  );
  const { mapCenter, marker } = useGoogleMapsData(hotelLocation);

  const initialValues: IHotelRegisterInitialValues = {
    name: draft?.name || "",
    description: draft?.description || "",
    email: draft?.email || "",
    country: draft?.country || "",
    city: draft?.city || "",
    address: draft?.address || "",
    location: draft?.location || [0, 0],
    totalRooms: draft?.totalRooms || 0,
    services: draft?.services || [],
    rating: draft?.rating || 1,
    images: (draft?.images as File[]) || [] as File[],
    hotel_admin_id: user?.id || "",
  };

  const countryOptions = [
    "Afganistán",
    "Albania",
    "Alemania",
    "Andorra",
    "Angola",
    "Antigua y Barbuda",
    "Arabia Saudita",
    "Argelia",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaiyán",
    "Bahamas",
    "Bangladés",
    "Barbados",
    "Baréin",
    "Bélgica",
    "Belice",
    "Benín",
    "Bielorrusia",
    "Birmania",
    "Bolivia",
    "Bosnia y Herzegovina",
    "Botsuana",
    "Brasil",
    "Brunéi",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Bután",
    "Cabo Verde",
    "Camboya",
    "Camerún",
    "Canadá",
    "Catar",
    "Chad",
    "Chile",
    "China",
    "Chipre",
    "Ciudad del Vaticano",
    "Colombia",
    "Comoras",
    "Corea del Norte",
    "Corea del Sur",
    "Costa de Marfil",
    "Costa Rica",
    "Croacia",
    "Cuba",
    "Dinamarca",
    "Dominica",
    "Ecuador",
    "Egipto",
    "El Salvador",
    "Emiratos Árabes Unidos",
    "Eritrea",
    "Eslovaquia",
    "Eslovenia",
    "España",
    "Estados Unidos",
    "Estonia",
    "Etiopía",
    "Filipinas",
    "Finlandia",
    "Fiyi",
    "Francia",
    "Gabón",
    "Gambia",
    "Georgia",
    "Ghana",
    "Granada",
    "Grecia",
    "Guatemala",
    "Guyana",
    "Guinea",
    "Guinea-Bisáu",
    "Guinea Ecuatorial",
    "Haití",
    "Honduras",
    "Hungría",
    "India",
    "Indonesia",
    "Irak",
    "Irán",
    "Irlanda",
    "Islandia",
    "Islas Marshall",
    "Islas Salomón",
    "Israel",
    "Italia",
    "Jamaica",
    "Japón",
    "Jordania",
    "Kazajistán",
    "Kenia",
    "Kirguistán",
    "Kiribati",
    "Kuwait",
    "Laos",
    "Lesoto",
    "Letonia",
    "Líbano",
    "Liberia",
    "Libia",
    "Liechtenstein",
    "Lituania",
    "Luxemburgo",
    "Madagascar",
    "Malasia",
    "Malaui",
    "Maldivas",
    "Malí",
    "Malta",
    "Marruecos",
    "Mauricio",
    "Mauritania",
    "México",
    "Micronesia",
    "Moldavia",
    "Mónaco",
    "Mongolia",
    "Montenegro",
    "Mozambique",
    "Namibia",
    "Nauru",
    "Nepal",
    "Nicaragua",
    "Níger",
    "Nigeria",
    "Noruega",
    "Nueva Zelanda",
    "Omán",
    "Países Bajos",
    "Pakistán",
    "Palaos",
    "Panamá",
    "Papúa Nueva Guinea",
    "Paraguay",
    "Perú",
    "Polonia",
    "Portugal",
    "Reino Unido",
    "República Centroafricana",
    "República Checa",
    "República Dominicana",
    "República del Congo",
    "República Democrática del Congo",
    "Ruanda",
    "Rumanía",
    "Rusia",
    "Samoa",
    "San Cristóbal y Nieves",
    "San Marino",
    "San Vicente y las Granadinas",
    "Santa Lucía",
    "Santo Tomé y Príncipe",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leona",
    "Singapur",
    "Siria",
    "Somalia",
    "Sri Lanka",
    "Suazilandia",
    "Sudáfrica",
    "Sudán",
    "Sudán del Sur",
    "Suecia",
    "Suiza",
    "Surinam",
    "Tailandia",
    "Tanzania",
    "Tayikistán",
    "Timor Oriental",
    "Togo",
    "Tonga",
    "Trinidad y Tobago",
    "Túnez",
    "Turkmenistán",
    "Turquía",
    "Tuvalu",
    "Ucrania",
    "Uganda",
    "Uruguay",
    "Uzbekistán",
    "Vanuatu",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Yibuti",
    "Zambia",
    "Zimbabue",
  ];

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImagesSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);
  };

  const handleSubmit = async (
    values: IHotelRegisterInitialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("warning", <p>Sesión no válida. Inicia sesión nuevamente.</p>, { autoClose: 3000 });
      setSubmitting(false);
      return;
    }

    // Validación mínima: sólo requerimos que exista user.id. El rol se valida en el backend.
    if (!user?.id) {
      console.error("Hotel creation blocked: invalid user id", { user });
      showToast("error", <p>No se pudo identificar tu usuario. Inicia sesión nuevamente.</p>, { autoClose: 4000 });
      setSubmitting(false);
      return;
    }

    // No hacemos revalidación adicional: el backend aplicará RolesGuard (403) si el token no corresponde.

    // Validar formato básico UUID (simple regex) para evitar 404 'this Admin is not available'
    const uuidRegex = /^[0-9a-fA-F-]{30,}$/; // la longitud varía pero evita strings vacíos o muy cortos
    if (!uuidRegex.test(user.id)) {
      console.warn("El id del admin no parece un UUID válido:", user.id);
    }
    
    // Subir imágenes directamente al backend (NestJS) si hay archivos
    let uploadedUrls: string[] = [];
    if (selectedFiles.length) {
      const formDataImages = new FormData();
      selectedFiles.forEach(f => formDataImages.append('files', f));
      const base = getApiBase();
      const endpointsToTry = [ `${base}/hotels/images` ];
      // Heurística: si base termina en :3000 añadir intento alterno 3001 (caso backend corriendo en 3000 y frontend en 3001 o viceversa)
      try {
        const m = base.match(/^(https?:\/\/localhost:)(\d+)/i);
        if (m) {
          const currentPort = m[2];
          const altPort = currentPort === '3000' ? '3001' : '3000';
            endpointsToTry.push(base.replace(/:\d+$/, `:${altPort}`) + '/hotels/images');
        }
      } catch {}
      for (const ep of endpointsToTry) {
        try {
          const uploadResp = await fetch(ep, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formDataImages });
          if (uploadResp.ok) {
            const data = await uploadResp.json();
            uploadedUrls = (data?.files || []).filter((u: string) => !!u);
            break;
          } else {
            console.warn(`[upload images] intento fallido ${ep} status=${uploadResp.status}`);
          }
        } catch (err) {
          console.warn(`[upload images] error de red al intentar ${ep}`, err);
        }
      }
      if (!uploadedUrls.length) {
        console.warn('Ninguna subida de imágenes fue exitosa; se continúa sin imágenes.');
      }
    }

    const formData: any = {
      ...values,
      hotel_admin_id: user.id,
    };
    if (uploadedUrls.length) formData.images = uploadedUrls; // evita mandar [] o undefined

    console.log("Datos que se envían al backend:", formData);

    try {
      const createdHotel = await postHotel(formData);
      if (createdHotel) {
        console.log('createdHotel:', createdHotel);
        
        addNewHotel(createdHotel);
        // Fuerza actualización inmediata de la lista en contexto para que /dashboard/myhotels refleje el nuevo hotel
        try {
          if (user?.id && user.isAdmin && typeof (window as any) !== 'undefined') {
            // Intentar acceso a getHotelsByAdmin si existe en contexto (defensivo, en caso de refactors)
            const maybeGetHotels = (UserContext as any)?._currentValue?.getHotelsByAdmin;
            if (typeof maybeGetHotels === 'function') {
              await maybeGetHotels(user.id, true);
            }
          }
        } catch (e) {
          console.warn('No se pudo forzar refresco de hoteles tras creación', e);
        }
        setHotelBeingCreated(createdHotel)
        // Callback externa (wizard) o flujo original
        if (onHotelCreated) {
          onHotelCreated(createdHotel);
        }
        if (!suppressRedirect) {
          showToast("success", <p>Hotel registrado exitosamente</p>);
          router.push(`/post-hotel-types/${createdHotel.id}`);
        }
      } else {
        showToast("error", <p>Error al registrar el hotel</p>, { autoClose: 4000 });
      }
    } catch (error: any) {
      console.error("Error al registrar el hotel (detalle):", error);
      const rawMsg: string = error?.message || "Error desconocido";

      // Detección específica de duplicados (nombre y/o email)
      const nameConflict = /this hotel exists/i.test(rawMsg);
      const emailConflict = /this email exists/i.test(rawMsg);
      if (nameConflict || emailConflict) {
        let mensaje: string;
        if (nameConflict && emailConflict) {
          mensaje = "El nombre y el email ya están en uso por otro hotel."; // (Caso poco probable dado el flujo backend)
        } else if (nameConflict) {
          mensaje = "Ya existe un hotel con ese nombre.";
        } else {
          mensaje = "Ya existe un hotel con ese email.";
        }
        showToast("error", <p>{mensaje}</p>, { autoClose: 3000 });
      } else if (rawMsg.includes('hotelero') || rawMsg.includes('Hotel admin id ausente')) {
        showToast("error", <p>{rawMsg}</p>, { autoClose: 4000 });
      } else if (/404/.test(rawMsg)) {
        showToast("error", <p>No se pudo crear el hotel: el ID de hotelero no existe o tu sesión está desactualizada. Cierra sesión y vuelve a entrar como hotelero.</p>, { autoClose: 5000 });
      } else if (/401|403/.test(rawMsg)) {
        showToast("error", <p>No autorizado. Vuelve a iniciar sesión.</p>, { autoClose: 4000 });
      } else {
        const finalMsg = rawMsg.startsWith('Error en la solicitud') ? rawMsg : `Hubo un error al registrar el hotel. ${rawMsg}`;
        showToast("error", <p>{finalMsg}</p>, { autoClose: 5000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      {user?.id ? (
        <div className="flex w-full justify-center items-center">
          <div className="w-full max-w-md p-8">
            <div className="flex justify-center mb-8">
              <h1 className="text-4xl mb-2 pb-2 text-center font-bold">
                Publica tu hotel
              </h1>
            </div>
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validate={validatePostHotel}
              onSubmit={handleSubmit}
            >
              {({ setFieldValue, isSubmitting, values }) => (
                <Form className="space-y-2">
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="name" className="formLabel">
                      Nombre del hotel
                    </label>
                    <Field
                      type="text"
                      name="name"
                      className="formInput"
                      placeholder="Nombre del hotel"
                      onChange={(e: any) => { setFieldValue('name', e.target.value); onDraftChange?.({ name: e.target.value }); }}
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="description" className="formLabel">
                      Descripción del hotel
                    </label>
                    <Field
                      type="text"
                      name="description"
                      className="formInput"
                      placeholder="Descripción del hotel"
                      onChange={(e: any) => { setFieldValue('description', e.target.value); onDraftChange?.({ description: e.target.value }); }}
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="email" className="formLabel">
                      Correo electrónico
                    </label>
                    <Field
                      type="email"
                      name="email"
                      className="formInput"
                      placeholder="Correo electrónico"
                      onChange={(e: any) => { setFieldValue('email', e.target.value); onDraftChange?.({ email: e.target.value }); }}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="country" className="formLabel">
                      País
                    </label>
                    <Field
                      as="select"
                      type="text"
                      name="country"
                      className="formInput"
                      placeholder="País"
                      onChange={(e: any) => { setFieldValue('country', e.target.value); onDraftChange?.({ country: e.target.value }); }}
                    >
                      <option value="">Selecciona un país</option>
                      {countryOptions.map((country, index) => (
                        <option key={index} value={country}>
                          {country}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="country"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="city" className="formLabel">
                      Ciudad
                    </label>
                    <Field
                      type="text"
                      name="city"
                      className="formInput"
                      placeholder="Ciudad"
                      onChange={(e: any) => { setFieldValue('city', e.target.value); onDraftChange?.({ city: e.target.value }); }}
                    />
                    <ErrorMessage
                      name="city"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="address" className="formLabel">
                      Dirección
                    </label>
                    <Field
                      type="text"
                      name="address"
                      className="formInput"
                      placeholder="Dirección"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const address = e.target.value;
                        const country = values.country;
                        const city = values.city;
                        setHotelLocation({ country, city, address });
                        setFieldValue("address", address);
                        onDraftChange?.({ address });
                      }}
                    />
                    <ErrorMessage
                      name="address"
                      component="div"
                      className="text-red-500"
                    />
                  </div>

                  {hotelLocation && (
                    <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                      <GoogleMap
                        options={{
                          disableDefaultUI: true,
                          clickableIcons: true,
                          scrollwheel: false,
                        }}
                        zoom={14}
                        center={mapCenter}
                        mapTypeId={google.maps.MapTypeId.ROADMAP}
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                      >
                        {marker && <Marker position={mapCenter} />}
                      </GoogleMap>
                    </div>
                  )}

                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="location" className="formLabel">
                      Ubicación
                    </label>
                    <Field
                      type="text"
                      name="location"
                      className="formInput"
                      placeholder="Ubicación (lat, lng)"
                      value={`${mapCenter.lat}, ${mapCenter.lng}`}
                    />
                    <ErrorMessage
                      name="location"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="services" className="formLabel">
                      Servicios (separados por comas)
                    </label>
                    <Field
                      type="text"
                      name="services"
                      className="formInput"
                      placeholder="Servicios"
                      value={values.services.join(",")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const list = e.target.value.split(",");
                        setFieldValue("services", list);
                        onDraftChange?.({ services: list });
                      }}
                    />
                    <ErrorMessage
                      name="services"
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="services" className="formLabel">
                      Total de Cuartos
                    </label>
                    <Field
                      type="number"
                      name="totalRooms"
                      className="formInput"
                      placeholder="Total de Cuartos"
                      onChange={(e: any) => { const v = Number(e.target.value); setFieldValue('totalRooms', v); onDraftChange?.({ totalRooms: v }); }}
                    />
                  </div>
                  <div className="formDiv flex-1 mr-2">
                    <label htmlFor="images" className="formLabel">
                      Imagen del hotel
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      name="images"
                      onChange={handleImagesSelection}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    />
                    {selectedFiles.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{selectedFiles.length} archivo(s) seleccionado(s)</p>
                    )}
                    <ErrorMessage name="images" component="div" className="text-red-500" />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <div className="flex items-center">
                          <h1 className="mr-1">Continue</h1>
                          <Image
                            src={continueImage}
                            alt="Continue"
                            width={24}
                            height={24}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-100">
          <div className=" max-w-md bg-white shadow-md rounded-md p-4 text-center">
            <Image
              src="/logo.png"
              alt="Inicia sesión"
              width={100}
              height={100}
              className="mb-4 mx-auto"
            />
            <h1 className="text-2xl font-semibold mb-2">Inicia sesión</h1>
            <p className="mb-4">
              Debes iniciar sesión para registrar un hotel.
            </p>
            <Link href="/login" className="btn-secondary">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelRegister;
