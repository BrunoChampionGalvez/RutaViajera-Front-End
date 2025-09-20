import Bookings from "@/components/Bookings";

// Esta página depende de estado cliente (token, context) y no debe prerenderse estaticamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function BookingsPage() {
  return (
    <div>
      <Bookings />
    </div>
  );
}

export default BookingsPage;
