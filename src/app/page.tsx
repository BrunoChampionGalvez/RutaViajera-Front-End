import Image from "next/image";
import Link from "next/link";
import ReviewSlider from "@/components/ReviewsSlider";

const landingTestimonials = [
  {
    id: "t1",
    rating: 5,
    comment:
      "Excelente servicio y ubicación perfecta. Las habitaciones están muy limpias y el personal es muy amable.",
    customerName: "María Fernanda",
  },
  {
    id: "t2",
    rating: 5,
    comment:
      "Hotel increíble con vistas espectaculares. La comida del restaurante es deliciosa y el spa es relajante.",
    customerName: "Carlos Andrés",
  },
  {
    id: "t3",
    rating: 4,
    comment:
      "Muy buena relación calidad-precio. Las instalaciones están en perfecto estado y el desayuno es variado.",
    customerName: "Laura Gómez",
  },
  {
    id: "t4",
    rating: 5,
    comment:
      "Lugar perfecto para descansar. El ambiente es tranquilo y las habitaciones son muy cómodas.",
    customerName: "Juan Pérez",
  },
  {
    id: "t5",
    rating: 5,
    comment:
      "Atención de primera y ubicación inmejorable. Volvería sin dudarlo.",
    customerName: "Sofía Martínez",
  },
  {
    id: "t6",
    rating: 4,
    comment:
      "Habitaciones cómodas y desayuno delicioso. Excelente relación calidad-precio.",
    customerName: "Diego Ramírez",
  },
];

export default function Landing() {
  return (
    <div>
      <div className="relative z-20 flex items-center overflow-hidden bg-black w-full min-h-screen">
        <div className="absolute inset-0">
          <Image
            src={"/hotel.jpg"}
            alt="Hotel"
            fill
            style={{ objectFit: "cover" }}
            quality={100}
            className="opacity-50"
            priority
          />
        </div>
        <div className="relative z-10 w-full text-center text-white flex justify-center items-center h-full">
          <div className="flex flex-col justify-end items-center p-4 sm:p-0 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center text-center sm:text-left sm:mb-4 mb-2">
              <h1 className="title font-extrabold text-4xl sm:text-6xl">
                RutaViajera
              </h1>
            </div>
            <h2 className="font-bold text-xl sm:text-2xl sm:mb-14 mb-8">
              Tu Aventura Comienza Aquí
            </h2>
            <Link href={"/home"}>
              <button className="btn-primary text-xl sm:text-xl px-6 py-3">
                Comenzar
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto my-8 text-center pb-4 w-full px-4 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center w-full">
          <Image
            src={"/brujula.png"}
            alt="Brujula"
            width={100}
            height={100}
            className="py-4"
          />
          <h2 className="font-semibold text-lg">Descubre rutas</h2>
          <p className="text-gray-500">
            Con nuestras recomendaciones vivirás grandes aventuras.
          </p>
        </div>
        <div className="flex flex-col items-center w-full">
          <Image
            src={"/mapa.png"}
            alt="Mapa"
            width={100}
            height={100}
            className="py-4"
          />
          <h2 className="font-semibold text-lg">Planea tu viaje</h2>
          <p className="text-gray-500">
            Nosotros lo hacemos por ti, tú solo debes disfrutar.
          </p>
        </div>
        <div className="flex flex-col items-center w-full">
          <Image
            src={"/dom.png"}
            alt="Mar"
            width={100}
            height={100}
            className="py-4"
          />
          <h2 className="font-semibold text-lg">Crea experiencias</h2>
          <p className="text-gray-500">
            Tendrás las mejores aventuras que contar.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 justify-items-center mx-auto text-center w-full px-4 sm:px-8 lg:px-16">
        <h2 className="font-bold text-xl mb-4">Testimonios</h2>
        <h3 className="font-medium text-gray-800 mb-4">
          ¿Qué dicen nuestros clientes?
        </h3>
  <ReviewSlider items={landingTestimonials} />
      </div>
    </div>
  );
}
