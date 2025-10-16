"use client";

import { useState, useEffect, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelected?: (address: string, location: [number, number]) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  country?: string;
  city?: string;
}

const libraries: ("places")[] = ["places"];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelected,
  onBlur,
  placeholder = "Dirección",
  className = "formInput",
  country,
  city,
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar servicios de Google Places
  useEffect(() => {
    if (isLoaded && typeof google !== "undefined") {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  // Sincronizar con el valor externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Limpiar timeout si existe
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Notificar cambio inmediatamente
    setSelectedIndex(-1);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!newValue.trim() || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // Debounce: esperar 300ms antes de buscar
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      // Construir request con bias de país/ciudad si está disponible
      const request: google.maps.places.AutocompletionRequest = {
        input: newValue,
      };

      // Agregar bias de país si está disponible
      if (country || city) {
        const searchQuery = [city, country].filter(Boolean).join(", ");
        if (searchQuery) {
          request.input = `${newValue}, ${searchQuery}`;
        }
      }

      // Obtener predicciones
      autocompleteService.current!.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300);
  };

  const selectSuggestion = (prediction: google.maps.places.AutocompletePrediction) => {
    const selectedAddress = prediction.description;
    setInputValue(selectedAddress);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Obtener coordenadas del lugar seleccionado solo si hay callback
    if (placesService.current && onAddressSelected) {
      placesService.current.getDetails(
        { placeId: prediction.place_id },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            onAddressSelected(selectedAddress, [lat, lng]);
          }
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  if (!isLoaded) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-red-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs opacity-75">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
