import { useState, useEffect } from 'react';

interface CountryCityData {
  [country: string]: string[];
}

export const useHotelLocations = () => {
  const [locations, setLocations] = useState<CountryCityData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hotels`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const hotels = await response.json();
        
        // Build country-city mapping from actual hotel data
        const locationMap: CountryCityData = {};
        
        hotels.forEach((hotel: any) => {
          const country = hotel.country?.trim();
          const city = hotel.city?.trim();
          
          if (country && city) {
            if (!locationMap[country]) {
              locationMap[country] = [];
            }
            if (!locationMap[country].includes(city)) {
              locationMap[country].push(city);
            }
          }
        });
        
        // Sort countries and cities alphabetically
        Object.keys(locationMap).forEach(country => {
          locationMap[country] = locationMap[country].sort();
        });
        
        setLocations(locationMap);
        setError(null);
      } catch (err) {
        console.error('Error fetching hotel locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
        setLocations({});
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, loading, error };
};