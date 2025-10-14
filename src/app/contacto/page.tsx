"use client";

import Image from "next/image";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    titulo: "",
    descripcion: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación básica
    if (
      !formData.nombre ||
      !formData.correo ||
      !formData.titulo ||
      !formData.descripcion
    ) {
      showToast("error", "Por favor completa todos los campos");
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      showToast("error", "Por favor ingresa un correo válido");
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría la lógica para enviar el formulario al backend
      // Por ahora simulamos el envío con un timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mostrar mensaje de éxito
      showToast(
        "success",
        "¡Mensaje enviado correctamente!"
      );

      // Limpiar el formulario
      setFormData({
        nombre: "",
        correo: "",
        titulo: "",
        descripcion: "",
      });
    } catch (error) {
      showToast(
        "error",
        "Hubo un error al enviar tu mensaje. Por favor intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative z-20 flex items-center overflow-hidden bg-black w-full h-[50vh] md:h-[60vh]">
        <div className="absolute inset-0">
          <Image
            src={"/hotel.jpg"}
            alt="Contacto"
            fill
            style={{ objectFit: "cover" }}
            quality={100}
            className="opacity-40"
            priority
          />
        </div>
        <div className="relative z-10 w-full text-center text-white flex justify-center items-center h-full px-4">
          <div className="max-w-4xl">
            <h1 className="title font-extrabold text-4xl sm:text-5xl md:text-6xl mb-4">
              Contáctanos
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light">
              Estamos aquí para ayudarte. Déjanos tu mensaje y te responderemos
              pronto
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information & Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Información de Contacto
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                ¿Tienes preguntas sobre tu reserva, necesitas asistencia o
                simplemente quieres conocer más sobre nosotros? Completa el
                formulario y nuestro equipo se pondrá en contacto contigo lo
                antes posible.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-red-500 p-3 rounded-full flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Email
                  </h3>
                  <p className="text-gray-600">contacto@rutaviajera.com</p>
                  <p className="text-gray-600">soporte@rutaviajera.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-500 p-3 rounded-full flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Teléfono
                  </h3>
                  <p className="text-gray-600">+1 (800) 123-4567</p>
                  <p className="text-gray-600 text-sm">
                    Lunes a Viernes: 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-500 p-3 rounded-full flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Ubicación
                  </h3>
                  <p className="text-gray-600">
                    Ciudad de México, México
                    <br />
                    Oficinas en toda América Latina
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-500 p-3 rounded-full flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Horario de Atención
                  </h3>
                  <p className="text-gray-600">
                    Soporte 24/7 disponible
                    <br />
                    Respuesta en menos de 24 horas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Envíanos un Mensaje
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="correo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="titulo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Asunto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="¿En qué podemos ayudarte?"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none resize-none"
                  placeholder="Cuéntanos más sobre tu consulta..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-md text-white font-semibold text-lg transition-all duration-200 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar Mensaje"
                )}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Al enviar este formulario, aceptas nuestros{" "}
              <a href="/terms-conditions" className="text-red-500 hover:underline">
                términos y condiciones
              </a>{" "}
              y{" "}
              <a href="/privacy-policy" className="text-red-500 hover:underline">
                política de privacidad
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Preguntas Frecuentes
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                ¿Cuánto tiempo tardan en responder?
              </h3>
              <p className="text-gray-600">
                Nuestro equipo responde todos los mensajes en un plazo máximo de
                24 horas hábiles.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                ¿Tienen soporte telefónico?
              </h3>
              <p className="text-gray-600">
                Sí, contamos con líneas de atención telefónica de lunes a
                viernes de 9:00 AM a 6:00 PM.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                ¿Puedo modificar mi reserva por este medio?
              </h3>
              <p className="text-gray-600">
                Sí, puedes contactarnos para modificaciones de reserva. También
                puedes gestionarlas desde tu panel de usuario.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                ¿Ofrecen asistencia en otros idiomas?
              </h3>
              <p className="text-gray-600">
                Sí, ofrecemos soporte en español, inglés y portugués para mejor
                atenderte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
