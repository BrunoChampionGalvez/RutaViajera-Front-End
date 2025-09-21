"use client";

import { useState, Suspense, useCallback, useMemo } from "react";
import ProductsList from "@/components/ProductsList";
import SearchBar from "@/components/SearchBar";
import HotelsFilter from "@/components/HotelsFilter";
import OAuthHandler from "@/components/OAuthHandler";
import { QueryParams } from "@/interfaces";

function Home() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [queryParams, setQueryParams] = useState<string>("");
  // Keep last applied filters (optional UI use later) without causing re-renders loop
  const [currentFilters, setCurrentFilters] = useState<QueryParams>({});

  const handleSearch = (query: string) => {
    console.log("HandleSearch en Home con query:", query);
    setSearchQuery(query);
  };

  const removeAccents = useCallback((str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), []);

  const buildQueryString = useCallback((params: QueryParams) => {
    const working: QueryParams = { ...params };
    if (working.rating && !working.ratingMin && !working.ratingMax) {
      working.ratingMin = working.rating;
      working.ratingMax = 5;
    }
    const ordering: (keyof QueryParams)[] = ['country','city','minPrice','maxPrice','ratingMin','ratingMax'];
    const query = ordering
      .filter((key) => {
        const value = working[key];
        return value !== undefined && value !== null && value !== '';
      })
      .map((key) => {
        const unaccentedValue = removeAccents(String(working[key]));
        return `${encodeURIComponent(key)}=${encodeURIComponent(unaccentedValue)}`;
      })
      .join('&');
    setCurrentFilters(working);
    setQueryParams(query);
  }, [removeAccents]);
  

  const placeholder = "Buscar hoteles";

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const openFilters = useCallback(() => setMobileFiltersOpen(true), []);
  const closeFilters = useCallback(() => setMobileFiltersOpen(false), []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch relative overflow-x-hidden">
      {/* Mobile top bar with search + filter button */}
      <div className="md:hidden mb-0 sticky top-0 z-30 shadow"> 
        <SearchBar placeholder={placeholder} onSearch={handleSearch} onOpenFilters={openFilters} />
      </div>

      {/* Desktop static sidebar */}
      <div className="hidden md:block md:w-72 lg:w-80 flex-shrink-0 ml-0">
        <HotelsFilter onFilter={buildQueryString} />
      </div>

      {/* Mobile slide-in filter drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 max-w-[80%] bg-red-600 shadow-xl z-40 transform transition-transform duration-300 ease-out flex flex-col ${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!mobileFiltersOpen}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-500">
          <h2 className="text-white font-semibold">Filtros</h2>
          <button
            onClick={closeFilters}
            aria-label="Cerrar filtros"
            className="text-white p-2 rounded hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {/* Scrollable filter content */}
        <div className="overflow-y-auto flex-1">
          <HotelsFilter onFilter={buildQueryString} />
        </div>
      </div>

      {/* Backdrop */}
      {mobileFiltersOpen && (
        <button
          aria-label="Cerrar filtros"
          onClick={closeFilters}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        <Suspense fallback={<div>Loading...</div>}>
          <OAuthHandler />
        </Suspense>
        <div className="hidden md:block">
          <SearchBar placeholder={placeholder} onSearch={handleSearch} />
        </div>
        <ProductsList queryParams={queryParams} searchQuery={searchQuery} />
      </div>
    </div>
  );
}

export default Home;
