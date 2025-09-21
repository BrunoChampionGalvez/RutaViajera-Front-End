import { useState } from "react";
import { ISearchBarProps } from "@/interfaces";
import Image from "next/image";

interface ExtendedSearchBarProps extends ISearchBarProps {
  onOpenFilters?: () => void;
}

function SearchBar({ onSearch, placeholder, onOpenFilters }: ExtendedSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Búsqueda activada con query:", searchQuery);
    onSearch(searchQuery);
  };

  return (
    <div className="bg-slate-800 px-4 py-3 w-full flex items-center gap-3">
      {/* Mobile filter button */}
      {onOpenFilters && (
        <button
          type="button"
          onClick={onOpenFilters}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md border border-red-600 text-white hover:bg-red-600 transition-colors"
          aria-label="Abrir filtros"
        >
          {/* Simple icon (three sliders) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="10" y2="18" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="16" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      )}
      <form onSubmit={handleSearch}>
        <div className="w-full md:w-3/12">
          <div className="flex">
            <input
              type="search"
              value={searchQuery}
              placeholder={placeholder}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex rounded-l-md bg-white text-black py-2 px-4 focus:outline-none  border border-red-600"
              style={{ borderRight: "none" }}
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r-md flex items-center justify-center"
              aria-label="Buscar"
            >
              {/* Search SVG icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
