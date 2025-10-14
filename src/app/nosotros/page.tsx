import Image from "next/image";

export default function Nosotros() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative z-20 flex items-center overflow-hidden bg-black w-full h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <Image
            src={"/hotel.jpg"}
            alt="RutaViajera Team"
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
              Sobre Nosotros
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light">
              Creando experiencias de viaje inolvidables desde el corazón
            </p>
          </div>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-red-500 p-3 rounded-full mr-4">
                <Image
                  src={"/brujula.png"}
                  alt="Misión"
                  width={40}
                  height={40}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Nuestra Misión
              </h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Facilitar experiencias de viaje excepcionales conectando a
              viajeros con los mejores alojamientos de América Latina. Nos
              comprometemos a simplificar cada reserva, garantizando calidad,
              transparencia y confianza en cada paso del camino.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-red-500 p-3 rounded-full mr-4">
                <Image
                  src={"/mapa.png"}
                  alt="Visión"
                  width={40}
                  height={40}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Nuestra Visión
              </h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Ser la plataforma líder de reservas hoteleras en América Latina,
              reconocida por nuestra innovación tecnológica, servicio al cliente
              excepcional y compromiso con el turismo sostenible que beneficia a
              comunidades locales.
            </p>
          </div>
        </div>
      </div>

      {/* Historia */}
      <div className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Nuestra Historia
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              RutaViajera nació de una pasión compartida por los viajes y la
              tecnología. Fundada por un grupo de emprendedores apasionados por
              explorar América Latina, identificamos la necesidad de una
              plataforma confiable que conectara a viajeros con alojamientos de
              calidad en toda la región.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Desde nuestros inicios, hemos trabajado incansablemente para
              construir relaciones sólidas con hoteles y propiedades de toda
              América Latina, asegurándonos de ofrecer opciones variadas que se
              adapten a cada tipo de viajero, desde el aventurero mochilero
              hasta el turista de lujo.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Hoy, nos enorgullece ser parte de miles de historias de viaje,
              facilitando experiencias que perduran en los recuerdos de nuestros
              usuarios. Continuamos evolucionando, siempre con el objetivo de
              hacer que tu próxima aventura sea inolvidable.
            </p>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Nuestros Valores
          </h2>
          <div className="w-24 h-1 bg-red-500 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🤝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Confianza
            </h3>
            <p className="text-gray-600">
              Construimos relaciones transparentes y duraderas con nuestros
              usuarios y socios hoteleros.
            </p>
          </div>

          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Innovación
            </h3>
            <p className="text-gray-600">
              Utilizamos tecnología de punta para mejorar continuamente la
              experiencia de reserva.
            </p>
          </div>

          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⭐</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Excelencia
            </h3>
            <p className="text-gray-600">
              Nos esforzamos por superar expectativas en cada interacción y
              servicio que ofrecemos.
            </p>
          </div>

          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌎</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Sostenibilidad
            </h3>
            <p className="text-gray-600">
              Promovemos prácticas de turismo responsable que benefician al
              medio ambiente y comunidades locales.
            </p>
          </div>

          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❤️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Pasión
            </h3>
            <p className="text-gray-600">
              Amamos lo que hacemos y ese entusiasmo se refleja en cada detalle
              de nuestro servicio.
            </p>
          </div>

          <div className="text-center p-6 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Comunidad
            </h3>
            <p className="text-gray-600">
              Valoramos a cada viajero y socio como parte de nuestra familia
              RutaViajera.
            </p>
          </div>
        </div>
      </div>

      {/* Por qué elegirnos */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Por Qué Elegir RutaViajera?
            </h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <p className="text-lg opacity-90">Hoteles Asociados</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">50,000+</div>
              <p className="text-lg opacity-90">Viajeros Satisfechos</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">20+</div>
              <p className="text-lg opacity-90">Países de América Latina</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <p className="text-lg opacity-90">Soporte al Cliente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
          Únete a Nuestra Comunidad de Viajeros
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Descubre tu próximo destino y crea experiencias inolvidables con
          RutaViajera
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/home"
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200"
          >
            Explorar Hoteles
          </a>
          <a
            href="/contacto"
            className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200"
          >
            Contáctanos
          </a>
        </div>
      </div>
    </div>
  );
}
