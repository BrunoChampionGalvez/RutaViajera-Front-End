"use client"

import TypesRegister from "@/components/PostHotelTypes";
import { useParams } from "next/navigation";

export default function PostHotelTypes() {
  const { hotelId } = useParams()

  return (
    <div>
      <TypesRegister hotelId={hotelId} />
    </div>
  );
}
