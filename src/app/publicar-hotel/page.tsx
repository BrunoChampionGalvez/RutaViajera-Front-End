"use client";
import HotelCreationWizard from "@/components/HotelCreationWizard";
import { useRouter } from "next/navigation";

export default function PublicarHotelPage() {
  const router = useRouter();
  return (
    <div className="min-h-full">
      <HotelCreationWizard asPage onFinished={() => router.push('/dashboard/myhotels' /* adjust if a specific dashboard route */)} />
    </div>
  );
}
