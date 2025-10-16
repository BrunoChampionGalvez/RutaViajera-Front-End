# Address Autocomplete Component

Componente de autocompletado de direcciones usando Google Places API.

## Características

✅ **Autocompletado inteligente** con Google Places API
✅ **Navegación con teclado** (flechas arriba/abajo, Enter, Escape)
✅ **Click para seleccionar** direcciones
✅ **Debounce** de 300ms para optimizar llamadas a la API
✅ **Indicador de carga** mientras busca
✅ **Bias geográfico** basado en país y ciudad seleccionados
✅ **Coordenadas automáticas** (lat, lng) solo al seleccionar del dropdown o con Enter
✅ **Diseño responsive** y accesible
✅ **Mapa actualizado solo al seleccionar** una dirección (no mientras se escribe)

## Uso

```tsx
import AddressAutocomplete from "@/components/AddressAutocomplete";

<AddressAutocomplete
  value={address}
  country="Perú"
  city="Lima"
  placeholder="Ingresa una dirección"
  className="formInput"
  onChange={(address) => {
    // Se ejecuta mientras el usuario escribe
    // Solo recibe el texto, NO actualiza el mapa
    console.log("Texto ingresado:", address);
  }}
  onAddressSelected={(address, location) => {
    // Se ejecuta SOLO cuando el usuario selecciona una dirección
    // del dropdown o presiona Enter
    console.log("Dirección seleccionada:", address);
    console.log("Coordenadas:", location); // [lat, lng]
    // Aquí se debe actualizar el mapa
  }}
/>
```

## Props

- `value`: string - Valor actual del input
- `onChange`: (address: string) => void - Callback al escribir (no actualiza mapa)
- `onAddressSelected?`: (address: string, location: [number, number]) => void - Callback al seleccionar del dropdown o Enter
- `onBlur?`: () => void - Callback al perder foco
- `placeholder?`: string - Placeholder del input
- `className?`: string - Clases CSS del input
- `country?`: string - País para bias geográfico
- `city?`: string - Ciudad para bias geográfico

## Comportamiento

### Mientras el usuario escribe:
- Se muestran sugerencias
- Se ejecuta `onChange` con el texto
- **NO** se obtienen coordenadas
- **NO** se actualiza el mapa

### Al seleccionar una dirección (click o Enter):
- Se cierra el dropdown
- Se ejecuta `onAddressSelected` con:
  - La dirección completa
  - Las coordenadas [lat, lng]
- Aquí sí se debe actualizar el mapa

## Controles de teclado

- **↓** (Flecha abajo): Navegar a la siguiente sugerencia
- **↑** (Flecha arriba): Navegar a la sugerencia anterior
- **Enter**: Seleccionar la sugerencia resaltada (actualiza mapa)
- **Escape**: Cerrar el menú de sugerencias

## Requisitos

- Google Maps API Key configurada en `.env.local`:
  ```
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
  ```
- APIs habilitadas en Google Cloud Console:
  - Maps JavaScript API
  - Places API
