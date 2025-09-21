"use client";

import { useState, useEffect, useContext, useRef } from "react";
import ProductCard from "../ProductCard";
import { IHotelDetail, IProductsListProps } from "@/interfaces";
import { HotelContext } from "@/context/hotelContext";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

function ProductsList({ searchQuery, queryParams }: IProductsListProps) {
  const [filteredHotels, setFilteredHotels] = useState<IHotelDetail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const firstLoadRef = useRef(true);
  const { fetchHotels, fetchHotelsBySearch, fetchHotelsByFilters } = useContext(HotelContext);

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCurrentPage(1); // reset pagination when criteria changes
    const logContext = { searchQuery, queryParams };
    console.log("ProductsList fetch start:", logContext);

    const run = async () => {
      try {
        let baseData: IHotelDetail[] = [];
        // Fetch base list (filters have precedence over plain list)
        if (queryParams) {
          baseData = await fetchHotelsByFilters(queryParams) as IHotelDetail[];
        } else {
          baseData = await fetchHotels() as IHotelDetail[];
        }

        // Local flexible name search (accent / case insensitive, multi-token, partial)
        const normalized = (str: string) => str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // remove accents
          .toLowerCase()
          .trim();

        let result = baseData;
        const q = normalized(searchQuery || '');
        if (q.length > 0) {
          const tokens = q.split(/\s+/).filter(Boolean); // split into words
          result = baseData.filter(hotel => {
            const nameNorm = normalized(hotel.name || '');
            // Every token must be contained somewhere in the name
            return tokens.every(tk => nameNorm.includes(tk));
          });

          // If no matches and filters not applied, attempt server-side search as fallback
            if (result.length === 0 && !queryParams) {
              try {
                const remote = await fetchHotelsBySearch(searchQuery) as IHotelDetail[];
                if (Array.isArray(remote) && remote.length > 0) {
                  // Re-apply local scoring (tokens) in case backend search is broader
                  result = remote.filter(hotel => {
                    const nameNorm = normalized(hotel.name || '');
                    return tokens.every(tk => nameNorm.includes(tk));
                  });
                  if (result.length === 0) result = remote; // fallback to whatever backend returned
                }
              } catch (e) {
                console.warn('Fallback remote search failed', e);
              }
            }
        }

        if (!active) return;
        setFilteredHotels(result);
      } catch (err) {
        if (!active) return;
        console.error('Error fetching/filtering hotels:', err);
        setFilteredHotels([]);
      } finally {
        if (active) {
          if (firstLoadRef.current) firstLoadRef.current = false;
          setLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [searchQuery, queryParams, fetchHotels, fetchHotelsBySearch, fetchHotelsByFilters]);

  const paginatedHotels = Array.isArray(filteredHotels)
    ? filteredHotels.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  return (
    <div className="p-6">
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-full w-full">
          {loading ? (
            <ProductCardSkeleton count={itemsPerPage} />
          ) : paginatedHotels.length > 0 ? (
            paginatedHotels.map((hotel, index) => (
              <ProductCard key={index} hotel={hotel} />
            ))
          ) : (
            <p className="col-span-full text-center text-sm text-gray-600">No hay resultados que coincidan con su búsqueda.</p>
          )}
        </div>
      </div>
      {!loading && filteredHotels.length > itemsPerPage && (
        <div className="flex justify-center mt-4 items-center flex-wrap gap-2">
          <button
            className="bg-[#f83f3a] text-white rounded-md p-1 px-3 hover:bg-[#e63946] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <button
            className="bg-[#f83f3a] text-white rounded-md p-1 px-3 hover:bg-[#e63946] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleNextPage}
            disabled={currentPage >= Math.ceil(filteredHotels.length / itemsPerPage)}
          >
            Siguiente
          </button>
          <span className="ml-2 text-sm text-gray-700">
            Página {currentPage} de {Math.ceil(filteredHotels.length / itemsPerPage)}
          </span>
        </div>
      )}
    </div>
  );
}

export default ProductsList;
