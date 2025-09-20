"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import TypesRegister from "@/components/PostHotelTypes";
import RoomNumberForm from "@/components/NumberOfRooms";
import HotelRegister from "@/components/PostHotel";
import { IAdminHotel, IRoomTypeRegister } from "@/interfaces";

// Carga diferida para evitar problemas de SSR si existieran dependencias del window
const steps = ["Hotel", "Tipos", "Habitaciones"] as const;

type Step = typeof steps[number];

interface HotelCreationWizardProps {
  onFinished?: () => void;
}

export default function HotelCreationWizard({ onFinished }: HotelCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("Hotel");
  const [createdHotel, setCreatedHotel] = useState<IAdminHotel | null>(null);
  const [savedRoomTypes, setSavedRoomTypes] = useState<Partial<IRoomTypeRegister>[]>([]);

  const goNext = () => {
    setCurrentStep(prev => {
      const idx = steps.indexOf(prev);
      const nextIdx = Math.min(idx + 1, steps.length - 1);
      return steps[nextIdx];
    });
  };

  const reset = () => {
    setCurrentStep("Hotel");
    setCreatedHotel(null);
    setSavedRoomTypes([]);
  };

  const canAccessStep = (step: Step) => {
    if (step === "Hotel") return true;
    if (step === "Tipos") return !!createdHotel;
    if (step === "Habitaciones") return !!createdHotel && savedRoomTypes.length > 0;
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case "Hotel":
        return <HotelRegister suppressRedirect onHotelCreated={(hotel) => { setCreatedHotel(hotel); goNext(); }} />;
      case "Tipos":
        return <TypesRegister suppressStandaloneNav hotelId={createdHotel?.id} onRoomTypesSaved={(rts) => { setSavedRoomTypes(rts); goNext(); }} />;
      case "Habitaciones":
        return (
          <RoomNumberForm
            hotelIdOverride={createdHotel?.id}
            onRoomsCreated={() => {
              // Cierra el asistente automáticamente cuando todas las habitaciones del batch se crean con éxito
              if (onFinished) onFinished();
            }}
          />
        ); // Usa context existente para roomType actual; ahora también recibe override y callback
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-2xl font-bold">Publicar Hotel - Asistente</h2>
        <div className="flex gap-2">
          <button onClick={reset} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Reiniciar</button>
          <button onClick={onFinished} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Cerrar</button>
        </div>
      </div>
      <div className="px-6 py-3 flex gap-4">
        {steps.map(step => {
          const active = step === currentStep;
          const enabled = canAccessStep(step);
          return (
            <button
              key={step}
              disabled={!enabled}
              onClick={() => enabled && setCurrentStep(step)}
              className={`text-sm font-medium px-4 py-2 rounded-full border transition ${active ? 'bg-red-500 border-red-500 text-white' : enabled ? 'border-gray-400 text-gray-700 hover:bg-gray-100' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {step}
            </button>
          );
        })}
      </div>
      <div className="p-6">
        {renderStep()}
      </div>
      {currentStep === "Habitaciones" && (
        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={() => { onFinished && onFinished(); }}
            className="btn-secondary"
          >Finalizar</button>
        </div>
      )}
    </div>
  );
}
