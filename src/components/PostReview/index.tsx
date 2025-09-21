"use client";

import { UserContext } from "@/context/userContext";
import { ICreateReview, IPostReview, IReview, IReviewErrors } from "@/interfaces";
import { postReview } from "@/lib/server/fetchUsers";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useParams } from "next/navigation";
import { useContext, useState } from "react";
import { FaStar, FaCheckCircle } from "react-icons/fa";

export function PostReview() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { id } = useParams();
  const { user, isAdmin } = useContext(UserContext);

  const initialValues = {
    comment: "",
    rating: 0,
  };

  const handleSubmit = async (
    values: IPostReview,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    if (!user?.id) {
      setErrorMsg("Debes iniciar sesión para enviar una reseña.");
      setStatus("error");
      setSubmitting(false);
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    const review: ICreateReview = {
      comment: values.comment,
      rating: values.rating,
      clienteId: user.id,
      hotelId: id as string,
    };

    try {
      const data = await postReview(review);
      console.log("Reseña enviada: ", data);
      setStatus("success");
      // Optionally reset form & rating so user sees a clean state
      resetForm();
      setRating(0);
    } catch (error: any) {
      console.error("Error", error);
      // Attempt to extract backend message
      const backendMsg: string | undefined = error?.message;
      // Custom friendly mapping for known backend messages
      let friendly = backendMsg;
      if (/this customer is not available/i.test(backendMsg || '')) {
        friendly = "Tu cuenta de cliente no fue encontrada en el servidor. Cierra sesión y vuelve a iniciar, o registra un nuevo perfil de usuario.";
      } else if (/this hotel is not available/i.test(backendMsg || '')) {
        friendly = "El hotel ya no está disponible para reseñar.";
      }
      setErrorMsg(friendly || "Ocurrió un error al enviar la reseña. Intenta nuevamente.");
      setStatus("error");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full">
      {!isAdmin && (
        <div className="">
          <h3 className="font-light">¿Cómo calificarías tu experiencia?</h3>
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validate={(values) => {
              const errors: Partial<IReviewErrors> = {};

              // Validación del comentario
              if (!values.comment) {
                errors.comment = "Comentario requerido";
              } else if (values.comment.length > 100) {
                errors.comment =
                  "El comentario no debe tener más de 100 caracteres";
              }
              if (values.rating < 1 || values.rating > 5) {
                errors.rating = "Selecciona tu puntuación";
              }

              return errors;
            }}
          >
            {({ setFieldValue, isSubmitting }) => (
              <Form>
                <div className="mb-4">
                  <label htmlFor="rating" className="font-light">
                    {" "}
                  </label>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => {
                      const currentRate = index + 1;
                      console.log(currentRate);
                      return (
                        <label key={index}>
                          <input
                            type="radio"
                            name="rating"
                            value={currentRate}
                            className="hidden"
                            onClick={() => {
                              setFieldValue("rating", currentRate);
                              setRating(currentRate);
                            }}
                            disabled={status === "success"}
                          />
                          <FaStar
                            className="cursor-pointer"
                            color={
                              currentRate <= (hover || rating)
                                ? "#FBC02D"
                                : "#C9C9C9"
                            }
                            size={30}
                            onMouseEnter={() => setHover(currentRate)}
                            onMouseLeave={() => setHover(rating)}
                            style={{ opacity: status === "success" ? 0.6 : 1 }}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <ErrorMessage
                    name="rating"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="comment">Describe tu experiencia</label>
                  <Field
                    required
                    as="textarea"
                    name="comment"
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    disabled={status === "success"}
                  />
                  <ErrorMessage
                    name="comment"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className={`btn-secondary ${
                    isSubmitting || status === "success" ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting || status === "success"}
                >
                  {status === "submitting"
                    ? "Enviando..."
                    : status === "success"
                    ? "Enviado ✓"
                    : "Enviar"}
                </button>
                <div className="mt-2 min-h-6">
                  {status === "success" && (
                    <div className="text-green-600 flex items-center gap-2 text-sm">
                      <FaCheckCircle /> ¡Gracias! Tu reseña fue enviada.
                    </div>
                  )}
                  {status === "error" && (
                    <div className="text-red-500 text-sm whitespace-pre-line">{errorMsg}</div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
}

export default PostReview;
