import React, { useState, ChangeEvent } from "react";
import { IHotelsFilterProps } from "@/interfaces";
import { FaStar } from "react-icons/fa";
import { useHotelLocations } from "@/hooks/useHotelLocations";
import DualRangeSlider from "@/components/DualRangeSlider";

function HotelsFilter({ onFilter }: IHotelsFilterProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([1, 5]);
  
  const { locations, loading: locationsLoading } = useHotelLocations();

  // Apply explicitly via button click
  const applyFilters = () => {
    onFilter({
      country: selectedCountry || undefined,
      city: selectedCity || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      ratingMin: ratingRange[0],
      ratingMax: ratingRange[1],
    });
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    setSelectedCity("");
  };
  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
  };

  // All dual slider logic now handled by DualRangeSlider component

  return (
    <aside className="w-full md:w-64 lg:w-72 xl:w-80 bg-white border border-gray-200 rounded-xl p-6 md:sticky md:top-4 h-full shadow-sm space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
      {/* Country */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          País
        </label>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-[#f83f3a] focus:outline-none"
          disabled={locationsLoading}
        >
          <option value="">{locationsLoading ? "Cargando..." : "Todos"}</option>
          {Object.keys(locations).sort().map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      {/* City */}
      {selectedCountry && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Ciudad
          </label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-[#f83f3a] focus:outline-none"
          >
            <option value="">Todas</option>
            {(locations[selectedCountry] || []).map((city: string) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Precio (por noche, en USD)</span>
          <span className="text-xs font-semibold text-gray-700">${priceRange[0]} - ${priceRange[1]}</span>
        </div>
        <DualRangeSlider
          min={0}
          max={500}
          value={priceRange}
          onChange={setPriceRange}
          ariaLabelMin="Precio mínimo"
            ariaLabelMax="Precio máximo"
          format={(n) => `$${n}`}
          className="mb-2"
          trackColor="bg-red-500"
          emptyColor="#e5e7eb"
        />
      </div>
      {/* Rating Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Calificación</span>
          <span className="text-xs font-semibold text-gray-700">{ratingRange[0]} - {ratingRange[1]}</span>
        </div>
        <DualRangeSlider
          min={1}
          max={5}
          step={1}
          value={ratingRange}
          onChange={setRatingRange}
          ariaLabelMin="Calificación mínima"
          ariaLabelMax="Calificación máxima"
          className="mb-1"
          trackColor="bg-amber-400"
          emptyColor="#e5e7eb"
          format={(n) => `${n}`}
        />
        <div className="flex justify-between mt-1 text-sm text-gray-500">
          {[1,2,3,4,5].map(n => (
            <div key={n} className="flex justify-center gap-2 items-center">
              <FaStar className={`text-[10px] ${n >= ratingRange[0] && n <= ratingRange[1] ? 'text-yellow-300' : 'text-gray-300'}`} />
              <span className="text-gray-700 text-md">{n}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => {
          setSelectedCountry("");
          setSelectedCity("");
          setPriceRange([0,500]);
          setRatingRange([1,5]);
        }}
        className="w-full text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md py-2 transition-colors"
      >
        Limpiar filtros
      </button>
      <button
        onClick={applyFilters}
        className="w-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-md py-2 transition-colors"
      >
        Aplicar filtros
      </button>
    </aside>
  );
}

export default HotelsFilter;
