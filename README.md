## RutaViajera – Front-End (Next.js)

Plataforma de reservas hoteleras: los usuarios pueden explorar y reservar habitaciones; los administradores de hotel publican y gestionan sus hoteles; un superadmin controla todo desde un dashboard.

Sitio desplegado: https://ruta-viajera-front-end.vercel.app/

Repositorio del Back-End (API): https://github.com/BrunoChampionGalvez/RutaViajera-Back-End

### Tech stack

- Next.js 14, React 18
- Tailwind CSS
- Integraciones: Google Maps, Cloudinary, PayPal, NextAuth (Google OAuth)

## Requisitos

- Node.js 18+ y npm

## Configuración rápida

1) Copia `.env.example` a `.env.local` y completa los valores.
2) Asegúrate de que el Back-End esté corriendo en local o tengas su URL.

Variables de entorno necesarias (placeholders):

- NEXT_PUBLIC_API_URL: URL del backend (ej. http://localhost:3001)
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: clave del mapa
- Autenticación (NextAuth + Google):
	- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
	- NEXTAUTH_URL (ej. http://localhost:3000), NEXTAUTH_SECRET
- Pagos:
	- NEXT_PUBLIC_PAYPAL_CLIENT_ID (SDK del cliente)
	- PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET (para la ruta API del checkout)
- Cloudinary (subida de imágenes):
	- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
	- NEXT_PUBLIC_CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Otros:
	- LOCAL_IMAGE_STORAGE=true para guardar imágenes localmente en desarrollo (carpeta `public/uploads`).

Ejemplo mínimo de `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth + Google
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-nextauth-secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_SECRET=tu-paypal-client-secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset
NEXT_PUBLIC_CLOUDINARY_API_KEY=tu-cloudinary-api-key
CLOUDINARY_API_SECRET=tu-cloudinary-api-secret

# Desarrollo local de imágenes
LOCAL_IMAGE_STORAGE=true
```

## Ejecutar en local

1) Instalar dependencias

```powershell
npm install
```

2) Iniciar el servidor de desarrollo

```powershell
npm run dev
```

3) Abre http://localhost:3000 en el navegador.

Consejos:
- Asegúrate de que `NEXT_PUBLIC_API_URL` apunte al backend correcto (por ejemplo, http://localhost:3001).
- Para iniciar sesión con Google en local, configura los URIs de redirección en Google Cloud para NextAuth.

## Producción

- Build de producción: `npm run build`
- Arranque: `npm start`

## Licencia

MIT
