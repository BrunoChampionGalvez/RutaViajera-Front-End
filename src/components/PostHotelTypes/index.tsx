"use client";

import { IRoomTypeRegister, RoomTypesRegisterProps } from "@/interfaces";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import Image from "next/image";
import { getRoomTypesByHotelId, postRoomType } from "@/lib/server/fetchHotels";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { UserContext } from "@/context/userContext";
import { HotelContext } from "@/context/hotelContext";
import { FaArrowDown } from "react-icons/fa";
import { CiSaveUp2 } from "react-icons/ci";
import { IconContext } from "react-icons";

interface ExtendedRoomTypesRegisterProps extends RoomTypesRegisterProps {
  onRoomTypesSaved?: (roomTypes: Partial<IRoomTypeRegister>[]) => void;
  suppressStandaloneNav?: boolean;
  draftList?: Partial<IRoomTypeRegister>[];
  onDraftListChange?: (list: Partial<IRoomTypeRegister>[]) => void;
}

export default function TypesRegister({ hotelId, onRoomTypesSaved, suppressStandaloneNav = false, draftList, onDraftListChange }: ExtendedRoomTypesRegisterProps) {
  const { isAdmin } = useContext(UserContext);
  const { setRoomTypeIdBeingCreated } = useContext(HotelContext);
  const router = useRouter();

  const [savedRoomTypes, setSavedRoomTypes] = useState<Partial<IRoomTypeRegister>[]>([]);
  const [draftRoomTypes, setDraftRoomTypes] = useState<Partial<IRoomTypeRegister>[]>(draftList || []);
  // Start counter at 1 so we never have a temporary id of 0 (which caused toggle issues)
  const [counter, setCounter] = useState(1);
  const [selectedBuffers, setSelectedBuffers] = useState<Uint8Array[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');

  const initialValues: Omit<IRoomTypeRegister, 'id'> = { name: "", capacity: 0, totalBathrooms: 0, totalBeds: 0, images: [], price: 0 };

  // Fetch existing saved room types
  useEffect(() => {
    if (!hotelId) return;
    (async () => {
      try {
        const existing = await getRoomTypesByHotelId(hotelId);
        setSavedRoomTypes(existing);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [hotelId]);

  // Sync incoming draft list from parent if provided
  useEffect(() => {
    if (draftList) setDraftRoomTypes(draftList);
  }, [draftList]);

  const handleImagesSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      const buf = new Uint8Array(await f.arrayBuffer());
      setSelectedBuffers(prev => [...prev, buf]);
    }
  };

  const addDraft = (vals: Omit<IRoomTypeRegister, 'id'>, reset: () => void) => {
    setAdding(true);
    const exists = [...draftRoomTypes, ...savedRoomTypes].some(r => r.name?.trim().toLowerCase() === vals.name.trim().toLowerCase());
    if (exists) {
      Swal.fire({ icon: 'error', title: 'Nombre duplicado', text: 'Ese nombre ya existe' });
      setAdding(false);
      return;
    }
    const draft: Partial<IRoomTypeRegister> = {
      id: counter,
      ...vals,
      images: selectedBuffers.map(b => Array.from(b))
    } as any;
    const updated = [...draftRoomTypes, draft];
    setDraftRoomTypes(updated);
    onDraftListChange?.(updated);
    setCounter(c => c + 1);
    setSelectedBuffers([]);
    reset();
    setAdding(false);
    // Removed automatic switch to 'list' to allow adding multiple without losing context
  };

  const deleteDraft = (id: number | undefined) => {
    const updated = draftRoomTypes.filter(r => r.id !== id);
    setDraftRoomTypes(updated);
    onDraftListChange?.(updated);
  };

  const toggleExpand = (id: number | undefined) => {
    if (typeof id !== 'number') return; // ignore drafts without ids
    setExpandedId(prev => (prev === id ? null : id));
  };

  const persistAll = async () => {
    if (!hotelId) {
      router.push('/post-hotel');
      return;
    }
    if (!draftRoomTypes.length) return;
    setSaving(true);
    const saved: IRoomTypeRegister[] = [];
    for (const d of draftRoomTypes) {
      try {
        let uploaded: string[] = [];
        if (Array.isArray(d.images) && d.images.length) {
          try {
            const resp = await fetch('/api/upload-hotel-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ arraysOfBuffers: d.images })
            });
            if (resp.ok) uploaded = await resp.json();
          } catch (e) {
            console.warn('Upload fallo', e);
          }
        }
        const { id: _tmp, ...rest } = d as any; // remove temporary id
        const payload = { ...rest, images: uploaded, hotelId } as any;
        const res = await postRoomType(payload);
        saved.push(res);
      } catch (e) {
        console.error('Error guardando tipo', e);
      }
    }
    if (saved.length) {
      setSavedRoomTypes(r => [...r, ...saved]);
      setDraftRoomTypes([]);
      if (saved[0]?.id) setRoomTypeIdBeingCreated(String((saved[0] as any).id));
      onRoomTypesSaved?.(saved);
      Swal.fire({ icon: 'success', title: 'Tipos guardados', timer: 2200, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'info', title: 'Nada guardado', timer: 1600, showConfirmButton: false });
    }
    setSaving(false);
    setActiveTab('list');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center w-full bg-gray-100 min-h-[60vh] p-4">
        <div className="max-w-md bg-white shadow-md rounded-md p-4 text-center">
          <Image src="/logo.png" alt="Acceso Denegado" width={100} height={100} className="mb-4 mx-auto" />
          <h1 className="text-2xl font-semibold mb-2">Acceso Denegado</h1>
            <p className="mb-4">No tienes permiso para acceder a esta página.</p>
            <Link href="/" className="btn-secondary">Regresar a la página principal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-2 md:px-6">
      <div className="w-full max-w-5xl mx-auto">
        {/* Always show tabs regardless of suppressStandaloneNav */}
        <div className="flex gap-2 mb-4 border-b justify-center items-center">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border ${activeTab === 'add' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-300'}`}
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border ${activeTab === 'list' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-300'}`}
          >
            Lista
          </button>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center">Tipos de Habitación</h2>

        {activeTab === 'add' && (
          <>
            {draftRoomTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {draftRoomTypes.map(rt => (
                  <span key={rt.id} className="px-3 py-1 rounded-full bg-gray-100 text-sm flex items-center gap-1">
                    {rt.name}
                    <button
                      type="button"
                      onClick={() => deleteDraft(rt.id)}
                      className="text-red-500 hover:text-red-600 leading-none"
                      aria-label="Eliminar borrador"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Formik
              initialValues={initialValues}
              onSubmit={(vals, { resetForm }) => addDraft(vals, resetForm)}
            >
              <Form className="w-full max-w-xl mx-auto flex flex-col gap-4 p-4 md:p-6 bg-white rounded-md">
                <div className="text-center mb-1">
                  <h3 className="text-lg md:text-xl font-semibold">Agregar nuevo tipo</h3>
                  <p className="text-xs text-gray-600">Llena los campos y presiona Agregar. Puedes agregar varios antes de guardar.</p>
                </div>
                <div>
                  <label className="formLabel" htmlFor="name">Tipo de habitación</label>
                  <Field name="name" type="text" className="formInput" />
                  <ErrorMessage name="name" component="div" className="text-red-600 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="formLabel" htmlFor="capacity">Capacidad</label>
                    <Field name="capacity" type="number" className="formInput" />
                    <ErrorMessage name="capacity" component="div" className="text-red-600 text-sm" />
                  </div>
                  <div>
                    <label className="formLabel" htmlFor="totalBathrooms">Baños</label>
                    <Field name="totalBathrooms" type="number" className="formInput" />
                    <ErrorMessage name="totalBathrooms" component="div" className="text-red-600 text-sm" />
                  </div>
                  <div>
                    <label className="formLabel" htmlFor="totalBeds">Camas</label>
                    <Field name="totalBeds" type="number" className="formInput" />
                    <ErrorMessage name="totalBeds" component="div" className="text-red-600 text-sm" />
                  </div>
                  <div>
                    <label className="formLabel" htmlFor="price">Precio (USD)</label>
                    <Field name="price" type="number" className="formInput" />
                    <ErrorMessage name="price" component="div" className="text-red-600 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="formLabel" htmlFor="images">Imágenes</label>
                  <input type="file" multiple name="images" onChange={handleImagesSelection} />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 rounded-md border text-sm font-medium bg-white hover:bg-gray-100"
                  >
                    Ver Lista
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className={`py-2 px-5 rounded-md text-white bg-black hover:bg-gray-800 text-sm font-medium ${adding && 'opacity-60 cursor-not-allowed'}`}
                  >
                    {adding ? 'Agregando...' : 'Agregar'}
                  </button>
                </div>
              </Form>
            </Formik>
          </>
        )}

        {activeTab === 'list' && (
          <div className="mt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <p className="text-sm text-gray-600 text-center md:text-left flex-1">
                Revisa los tipos agregados. Presiona Guardar para persistirlos. (Guardados debajo)
              </p>
              <button
                type="button"
                disabled={!draftRoomTypes.length || saving}
                onClick={persistAll}
                className={`btn-secondary w-full md:w-auto flex items-center justify-center ${(!draftRoomTypes.length || saving) && '!bg-gray-300 hover:!bg-gray-300 cursor-not-allowed'}`}
              >
                {saving ? 'Guardando...' : 'Guardar'}
                <IconContext.Provider value={{ size: '1.4em', className: 'ml-2' }}>
                  <CiSaveUp2 />
                </IconContext.Provider>
              </button>
            </div>

            {!draftRoomTypes.length && !savedRoomTypes.length && (
              <p className="text-center text-sm text-gray-500 py-8">
                No has agregado ningún tipo todavía. Usa la pestaña Agregar.
              </p>
            )}

            {draftRoomTypes.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold mb-2 text-gray-800">Pendientes (no guardados)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftRoomTypes.map(rt => (
                    <div key={rt.id} className="relative border rounded-md p-3 bg-white shadow-sm">
                      <button
                        onClick={() => deleteDraft(rt.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-600 text-sm"
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                      <h5 className="font-semibold mb-1 text-gray-900">{rt.name}</h5>
                      <button
                        type="button"
                        aria-expanded={expandedId === rt.id}
                        onClick={() => toggleExpand(rt.id)}
                        className="text-xs text-gray-600 flex items-center gap-1 mb-2 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                      >
                        Ver detalles <FaArrowDown className={`transition-transform duration-300 ${expandedId === rt.id ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`text-xs space-y-1 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out will-change-[max-height] ${expandedId === rt.id ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p><b>Capacidad:</b> {rt.capacity}</p>
                        <p><b>Baños:</b> {rt.totalBathrooms}</p>
                        <p><b>Camas:</b> {rt.totalBeds}</p>
                        <p><b>Precio:</b> ${rt.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedRoomTypes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">Guardados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedRoomTypes.map(rt => (
                    <div key={rt.id} className="border rounded-md p-3 bg-white shadow-sm">
                      <h5 className="font-semibold mb-1 text-gray-900">{rt.name}</h5>
                      <div className="text-xs space-y-1">
                        <p><b>Capacidad:</b> {rt.capacity}</p>
                        <p><b>Baños:</b> {rt.totalBathrooms}</p>
                        <p><b>Camas:</b> {rt.totalBeds}</p>
                        <p><b>Precio:</b> {rt.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
