// Shared pricing / totals utilities
// Compute total price given selected rooms with roomType price and date range
// selectedRooms: Array<{ roomTypeId: string; quantity: number; pricePerNight?: number; nights?: number; checkInDate?: string; checkOutDate?: string }>
// Optionally accepts explicit nights; otherwise derives from checkIn/checkOut.

export interface SelectedRoomLike {
  roomTypeId: string;
  quantity: number;
  pricePerNight?: number; // fallback if we don't have roomType price mapping
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number; // precomputed nights if available
}

export interface RoomTypePriceMap {
  [roomTypeId: string]: number | undefined;
}

export function diffNights(checkIn: string, checkOut: string): number {
  try {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const ms = outDate.getTime() - inDate.getTime();
    if (isNaN(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function computeTotalFromSelectedRooms(
  selectedRooms: SelectedRoomLike[] | undefined | null,
  roomTypePrices?: RoomTypePriceMap,
  globalCheckIn?: string,
  globalCheckOut?: string
): number {
  if (!selectedRooms || selectedRooms.length === 0) return 0;
  return selectedRooms.reduce((acc, item) => {
    if (!item || !item.roomTypeId || !item.quantity) return acc;
    const price = roomTypePrices?.[item.roomTypeId] ?? item.pricePerNight ?? 0;
    // Determine nights precedence: explicit item.nights > item dates > global dates
    let nights = item.nights;
    if (typeof nights !== 'number' || nights <= 0) {
      const inDate = item.checkInDate || globalCheckIn;
      const outDate = item.checkOutDate || globalCheckOut;
      if (inDate && outDate) nights = diffNights(inDate, outDate);
    }
    if (!nights || nights <= 0) nights = 1; // fallback minimal to avoid zeroing when data incomplete
    const subtotal = price * item.quantity * nights;
    if (!isFinite(subtotal) || subtotal < 0) return acc;
    return acc + subtotal;
  }, 0);
}

// Utility to format currency consistently (can be expanded later for locale)
export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'es-ES'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return value.toFixed(2);
  }
}
