"use client";
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { showToast } from '@/lib/toast';
import {
  IAdminHotel,
  IRoomTypeRegister,
  IRoomType,
} from '@/interfaces';
import {
  updateHotel,
  postRoomType,
  getRoomTypesByHotelId,
  updateRoomType,
  deleteRoomType,
  postRoom,
  getRoomsByRoomTypeIdForAdmin,
  updateRoom,
  deleteRoom,
  uploadRoomTypeImages,
} from '@/lib/server/fetchHotels';

interface HotelFullEditorProps {
  hotel: IAdminHotel | null;
  onClose: () => void;
  onUpdated?: (hotel: Partial<IAdminHotel>) => void; // notify parent to refetch list
  onDeleted?: (hotelId: string) => void;
  refreshHotels: () => void; // parent fetch
}

type TabKey = 'hotel' | 'roomTypes' | 'rooms';

interface LocalRoomType extends IRoomTypeRegister { }

interface LocalRoom {
  id: string;
  roomNumber: string;
  isDeleted?: boolean;
}

interface RoomTypeCreateFormProps {
  rtName: string; setRtName: (v: string)=>void;
  rtCapacity: string; setRtCapacity: (v: string)=>void;
  rtBeds: string; setRtBeds: (v: string)=>void;
  rtBaths: string; setRtBaths: (v: string)=>void;
  rtPrice: string; setRtPrice: (v: string)=>void;
  rtImages: string; setRtImages: (v: string)=>void;
  rtImageFiles: File[]; setRtImageFiles: (files: File[])=>void;
  rtUploading: boolean; handleUploadNewRtImages: ()=>void;
  rtUploadedUrls: string[]; removePendingUploadedUrl: (u:string)=>void;
  handleAddRoomType: ()=>void;
}

// Reusable fallback image component to handle legacy relative paths or minor path variations
function FallbackImg({ original, className }: { original: string; className?: string }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
  // Build candidate URL permutations
  const raw = original.trim();
  const candidates: string[] = [];
  const isAbs = /^https?:\/\//i.test(raw);
  if (isAbs) {
    candidates.push(raw);
  } else {
    // as-is (relative) for same-origin dev
    if (raw.startsWith('/')) candidates.push(raw);
    else candidates.push('/' + raw);
    // prefixed with api base
    const normalized = raw.startsWith('/') ? raw : '/' + raw;
    candidates.push(apiBase + normalized);
    // ensure /uploads prefix if missing
    if (!/\/uploads\//.test(raw)) {
      const withUploads = '/uploads/' + raw.replace(/^\/+/, '');
      candidates.push(withUploads);
      candidates.push(apiBase + withUploads);
    }
    // roomtypes vs roomstype typo variants
    if (/roomtypes\//.test(raw)) {
      const alt = raw.replace(/roomtypes\//, 'roomstype/');
      const altNorm = alt.startsWith('/') ? alt : '/' + alt;
      candidates.push(altNorm);
      candidates.push(apiBase + altNorm);
    } else if (/roomstype\//.test(raw)) {
      const alt = raw.replace(/roomstype\//, 'roomtypes/');
      const altNorm = alt.startsWith('/') ? alt : '/' + alt;
      candidates.push(altNorm);
      candidates.push(apiBase + altNorm);
    }
  }
  // Deduplicate
  const uniq = Array.from(new Set(candidates));
  const [idx, setIdx] = useState(0);
  const src = uniq[idx];
  return <img src={src} alt="img" className={className} onError={()=>{ if (idx < uniq.length-1) setIdx(i=>i+1); }} />;
}

function RoomTypeCreateForm({ rtName, setRtName, rtCapacity, setRtCapacity, rtBeds, setRtBeds, rtBaths, setRtBaths, rtPrice, setRtPrice, rtImages, setRtImages, rtImageFiles, setRtImageFiles, rtUploading, handleUploadNewRtImages, rtUploadedUrls, removePendingUploadedUrl, handleAddRoomType }: RoomTypeCreateFormProps) {
  // Build preview list: local object URLs (not yet uploaded) + uploaded URLs (absolute if needed)
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
  const uploadedPreviews = rtUploadedUrls.map(u => {
    // If already absolute (http/https) leave, else prefix api base
    if (/^https?:\/\//i.test(u)) return u;
    // If it already starts with /uploads ensure api base added
    return apiBase + (u.startsWith('/') ? u : '/' + u);
  });
  const localPreviews = rtImageFiles.map(f => ({ url: URL.createObjectURL(f), name: f.name, local: true }));
  return (
    <div>
      <h3 className="font-semibold mb-2">Crear nuevo tipo de habitación</h3>
      <div className="grid gap-2 md:grid-cols-3 text-sm" data-form="roomtype-create">
  <input placeholder="Nombre" value={rtName} onChange={e=>setRtName(e.target.value)} className="border rounded px-2 py-1 h-9 text-sm" />
  <input placeholder="Capacidad" type="number" value={rtCapacity} onChange={e=>setRtCapacity(e.target.value)} className="border rounded px-2 py-1 h-9 text-sm" />
  <input placeholder="Camas" type="number" value={rtBeds} onChange={e=>setRtBeds(e.target.value)} className="border rounded px-2 py-1 h-9 text-sm" />
  <input placeholder="Baños" type="number" value={rtBaths} onChange={e=>setRtBaths(e.target.value)} className="border rounded px-2 py-1 h-9 text-sm" />
  <input placeholder="Precio" type="number" value={rtPrice} onChange={e=>setRtPrice(e.target.value)} className="border rounded px-2 py-1 h-9 text-sm" />
        <div className="md:col-span-3 flex flex-col gap-2 border rounded p-2 bg-gray-50">
          <label className="text-xs font-medium">Subir imágenes (hasta 10)</label>
          <input type="file" multiple accept="image/*" onChange={e=>{ const files = Array.from(e.target.files||[]); setRtImageFiles(files); }} className="text-xs" />
          {(localPreviews.length > 0 || uploadedPreviews.length > 0) && (
            <div className="flex flex-wrap gap-2 items-center">
              {localPreviews.map(p => (
                <div key={p.url} className="relative group">
                  <img src={p.url} alt={p.name} className="w-16 h-16 object-cover rounded border" />
                  <span className="absolute bottom-0 left-0 bg-black/50 text-white px-1 text-[9px] rounded-br rounded-tl">new</span>
                </div>
              ))}
              {uploadedPreviews.map(u => (
                <div key={u} className="relative group">
                  <img src={u} alt="img" className="w-16 h-16 object-cover rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.opacity='0.3';}} />
                <button
                    type="button"
                    onClick={() => removePendingUploadedUrl(u.replace(apiBase, ''))}
                    className="hidden group-hover:flex absolute -top-0 -right-0 bg-black/60 text-white text-sm h-4 w-4 rounded-tr-xs rounded-tr-md items-center justify-center"
                >
                    x
                </button>
                </div>
              ))}
              {rtImageFiles.length > 0 && (
                <button disabled={rtUploading} onClick={handleUploadNewRtImages} className="px-2 py-1 bg-red-600 text-white rounded text-[10px] disabled:opacity-50 self-start">{rtUploading ? 'Subiendo...' : 'Subir'}</button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center w-full pt-4">
            <button onClick={handleAddRoomType} className="bg-red-500 text-white rounded px-3 py-1 text-sm hover:bg-red-600">Crear</button>
        </div>
    </div>
  );
}

export default function HotelFullEditor({ hotel, onClose, onUpdated, onDeleted, refreshHotels }: HotelFullEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('hotel');
    const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hotel basic fields
  const [name, setName] = useState(hotel?.name || '');
  const [description, setDescription] = useState(hotel?.description || '');
  const [email, setEmail] = useState(hotel?.email || '');
  const [address, setAddress] = useState(hotel?.address || '');
  const [city, setCity] = useState(hotel?.city || '');
  const [country, setCountry] = useState(hotel?.country || '');
  const [services, setServices] = useState((hotel?.services || []).join(', '));

  // Room types & rooms state
  const [roomTypes, setRoomTypes] = useState<LocalRoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<LocalRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Forms for adding room type
  const [rtName, setRtName] = useState('');
  // Mantener estos como strings para no forzar normalizaciones numéricas en cada keypress.
  const [rtCapacity, setRtCapacity] = useState('');
  const [rtBeds, setRtBeds] = useState('');
  const [rtBaths, setRtBaths] = useState('');
  const [rtPrice, setRtPrice] = useState('');
  const [rtImages, setRtImages] = useState('');
  const [rtImageFiles, setRtImageFiles] = useState<File[]>([]);
  const [rtUploading, setRtUploading] = useState(false);
  const [rtUploadedUrls, setRtUploadedUrls] = useState<string[]>([]);
  const [editingUploadFiles, setEditingUploadFiles] = useState<File[]>([]);
  const [editingUploading, setEditingUploading] = useState(false);

  // Editing room type inline
  const [editingRoomTypeId, setEditingRoomTypeId] = useState<string | null>(null);
  const [editingRoomTypeDraft, setEditingRoomTypeDraft] = useState<Partial<IRoomType>>({});

  // (legacy batch state removed)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomNumber, setEditingRoomNumber] = useState('');
  // Incremental room add state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [pendingRooms, setPendingRooms] = useState<string[]>([]);

  // Reset when hotel changes
  useEffect(() => {
    if (hotel) {
      setName(hotel.name);
      setDescription(hotel.description);
      setEmail(hotel.email);
      setAddress(hotel.address);
      setCity(hotel.city);
      setCountry(hotel.country);
      setServices(hotel.services.join(', '));
      // Reset room types / rooms related state when hotel changes so we don't leak previous hotel's data.
      setRoomTypes([]);
      setSelectedRoomTypeId(null);
      setRooms([]);
      setPendingRooms([]);
      setEditingRoomTypeId(null);
      setEditingRoomTypeDraft({});
      setEditingRoomId(null);
      setEditingRoomNumber('');
      // Also clear creation / upload forms to avoid accidental reuse.
      setRtName('');
      setRtCapacity('');
      setRtBeds('');
      setRtBaths('');
      setRtPrice('');
      setRtImages('');
      setRtUploadedUrls([]);
      setRtImageFiles([]);
      setEditingUploadFiles([]);
      setRtUploading(false);
      setEditingUploading(false);
    }
  }, [hotel]);

  const loadRoomTypes = useCallback(async () => {
    if (!hotel) return;
    setRoomTypesLoading(true);
    try {
      const data = await getRoomTypesByHotelId(hotel.id);
      setRoomTypes(data || []);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err.message || 'No se pudieron cargar los tipos de habitación', 'error');
    } finally {
      setRoomTypesLoading(false);
    }
  }, [hotel]);

  const loadRooms = useCallback(async (roomTypeId: string) => {
    if (!roomTypeId) return;
    setRoomsLoading(true);
    try {
      const data = await getRoomsByRoomTypeIdForAdmin(roomTypeId);
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (data && Array.isArray((data as any).rooms)) {
        setRooms((data as any).rooms);
      } else {
        setRooms([]);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      // Treat 404 / not found as empty list (no alert)
      if (/404/.test(msg) || /not\s*found/i.test(msg)) {
        console.warn('[loadRooms] No rooms found for roomType', roomTypeId);
        setRooms([]);
      } else {
        console.error(err);
        Swal.fire('Error', msg || 'No se pudieron cargar las habitaciones', 'error');
      }
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'roomTypes') {
      loadRoomTypes();
    }
  }, [activeTab, loadRoomTypes]);

  useEffect(() => {
    if (activeTab === 'rooms' && selectedRoomTypeId) {
      loadRooms(selectedRoomTypeId);
    }
  }, [activeTab, selectedRoomTypeId, loadRooms]);

  if (!hotel) return null;

  const handleSaveHotel = async () => {
    if (!hotel) return;
    setLoading(true);
    try {
      const updated = {
        name,
        description,
        email,
        address,
        city,
        country,
        services: services.split(',').map(s => s.trim()).filter(Boolean),
      } as Partial<IAdminHotel>;
      await updateHotel(hotel.id, updated);
  showToast('success', <p>Hotel actualizado</p>);
      onUpdated?.(updated);
      refreshHotels();
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudo actualizar el hotel'}</p>, { autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!hotel) return;
    const res = await Swal.fire({
      title: 'Eliminar hotel',
      text: 'Esta acción no se puede deshacer. ¿Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d1d5db' // light gray (Tailwind gray-300)
    });
    if (!res.isConfirmed) return;
    try {
      if (deleting) return;
      setDeleting(true);
      // We already have deleteHotel in parent MyHotels logic; reuse updateHotel? We'll call fetch directly through updateHotel? Simpler: use fetch inside here.
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotel.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      // Optimistic removal + toast
      onDeleted?.(hotel.id);
      refreshHotels();
      showToast('success', <p>Hotel eliminado</p>);
      onClose();
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudo eliminar'}</p>, { autoClose: 4000 });
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadNewRtImages = async () => {
    if (!rtImageFiles.length) return;
    setRtUploading(true);
    try {
      const urls = await uploadRoomTypeImages(rtImageFiles);
      setRtUploadedUrls(prev => [...prev, ...urls]);
      setRtImageFiles([]);
    } catch (err: any) {
      showToast('error', <p>{err.message || 'Fallo la subida de imágenes'}</p>, { autoClose: 4000 });
    } finally {
      setRtUploading(false);
    }
  };

  const removePendingUploadedUrl = (url: string) => {
    setRtUploadedUrls(prev => prev.filter(u => u !== url));
  };

  const handleAddRoomType = async () => {
    if (!hotel) return;
    if (!rtName || !rtPrice) {
      showToast('warning', <p>Nombre y precio son obligatorios</p>, { autoClose: 2500 });
      return;
    }
    try {
      const payload: Partial<IRoomType> = {
        name: rtName,
        price: Number(rtPrice),
        capacity: rtCapacity ? Number(rtCapacity) : 1,
        totalBeds: rtBeds ? Number(rtBeds) : 1,
        totalBathrooms: rtBaths ? Number(rtBaths) : 1,
        images: [
          ...rtImages.split(',').map(i => i.trim()).filter(Boolean),
          ...rtUploadedUrls
        ],
        hotelId: hotel.id as any,
      } as any;
      await postRoomType(payload);
  showToast('success', <p>Tipo de habitación creado</p>);
      setRtName(''); setRtPrice(''); setRtCapacity(''); setRtBeds(''); setRtBaths(''); setRtImages(''); setRtUploadedUrls([]);
      loadRoomTypes();
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudo crear el tipo de habitación'}</p>, { autoClose: 4000 });
    }
  };

  const handleAddPendingRoom = () => {
    const trimmed = newRoomNumber.trim();
    if (!trimmed) return;
    if (rooms.some(r => r.roomNumber === trimmed) || pendingRooms.includes(trimmed)) {
      showToast('info', <p>Ese número de habitación ya existe o está pendiente.</p>, { autoClose: 2500 });
      return;
    }
    setPendingRooms(pr => [...pr, trimmed]);
    setNewRoomNumber('');
  };

  const removePendingRoom = (num: string) => {
    setPendingRooms(pr => pr.filter(r => r !== num));
  };
  // (removed stray fragment from corrupted patch)

  const startEditRoomType = (rt: LocalRoomType) => {
    setEditingRoomTypeId(String(rt.id));
    setEditingRoomTypeDraft({
      name: rt.name,
      price: rt.price,
      capacity: rt.capacity,
      totalBeds: rt.totalBeds,
      totalBathrooms: rt.totalBathrooms,
      images: rt.images,
    });
  };

  const cancelEditRoomType = () => {
    setEditingRoomTypeId(null);
    setEditingRoomTypeDraft({});
  };

  const saveEditRoomType = async () => {
    if (!editingRoomTypeId) return;
    try {
      await updateRoomType(editingRoomTypeId, editingRoomTypeDraft as any);
  showToast('success', <p>Tipo de habitación actualizado</p>);
      cancelEditRoomType();
      loadRoomTypes();
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudo actualizar'}</p>, { autoClose: 4000 });
    }
  };

  const handleUploadEditingImages = async () => {
    if (!editingUploadFiles.length) return;
    setEditingUploading(true);
    try {
      const urls = await uploadRoomTypeImages(editingUploadFiles);
      setEditingRoomTypeDraft(d => ({ ...d, images: [ ...(d.images||[]), ...urls ] }));
      setEditingUploadFiles([]);
    } catch (err: any) {
      showToast('error', <p>{err.message || 'Fallo la subida de imágenes'}</p>, { autoClose: 4000 });
    } finally {
      setEditingUploading(false);
    }
  };

  const removeEditingImage = (url: string) => {
    setEditingRoomTypeDraft(d => ({ ...d, images: (d.images||[]).filter(i => i !== url) }));
  };

  const handleDeleteRoomType = async (roomTypeId: string) => {
    const res = await Swal.fire({
      title: 'Eliminar Tipo de Habitación',
      text: '¿Seguro? Se eliminarán sus habitaciones asociadas (lógica backend).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar'
    });
    if (!res.isConfirmed) return;
    try {
      // Optimistic UI: remove immediately
      setRoomTypes(prev => prev.filter(rt => String(rt.id) !== roomTypeId));
      const selectedWasDeleted = selectedRoomTypeId === roomTypeId;
      if (selectedWasDeleted) {
        setSelectedRoomTypeId(null);
        setRooms([]);
      }
      const result = await deleteRoomType(roomTypeId);
      // Some backends may return just true or the id; ensure state consistent afterwards
      // Optionally re-fetch to stay in sync, but keep it light unless needed
      // If server performed a soft delete (isDeleted flag), our list fetch should exclude it; schedule a silent refresh
      loadRoomTypes();
      showToast('success', <p>Tipo de habitación eliminado</p>);
    } catch (err: any) {
      loadRoomTypes();
      showToast('error', <p>{err.message || 'No se pudo eliminar'}</p>, { autoClose: 4000 });
    }
  };

  const handleSelectRoomType = (roomTypeId: string) => {
    // Clear stale rooms immediately, then navigate to rooms tab
    setRooms([]);
    setSelectedRoomTypeId(roomTypeId);
    setActiveTab('rooms');
  };

  const savePendingRooms = async () => {
  if (!selectedRoomTypeId) { showToast('info', <p>Selecciona un tipo de habitación</p>); return; }
  if (pendingRooms.length === 0) { showToast('info', <p>Agrega al menos una habitación</p>); return; }
    try {
      const result = await postRoom(pendingRooms, selectedRoomTypeId);
      let msg = `${result.successes.length} creadas`;
      if (result.failures.length) {
        const failedList = result.failures.slice(0,5).map(f=>f.roomNumber).join(', ');
        msg += `, ${result.failures.length} fallidas (${failedList}${result.failures.length>5?'...':''})`;
      }
  showToast(result.failures.length ? 'warning' : 'success', <p>{msg}</p>, { autoClose: 4000 });
      setPendingRooms([]);
      loadRooms(selectedRoomTypeId);
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudieron crear las habitaciones'}</p>, { autoClose: 4000 });
    }
  };

  const startEditRoom = (room: LocalRoom) => {
    setEditingRoomId(room.id);
    setEditingRoomNumber(room.roomNumber);
  };
  const cancelEditRoom = () => { setEditingRoomId(null); setEditingRoomNumber(''); };
  const saveEditRoom = async () => {
    if (!editingRoomId) return;
    try {
      await updateRoom(editingRoomId, { roomNumber: editingRoomNumber });
  showToast('success', <p>Habitación actualizada</p>);
      cancelEditRoom();
      if (selectedRoomTypeId) loadRooms(selectedRoomTypeId);
    } catch (err: any) {
      showToast('error', <p>{err.message || 'No se pudo actualizar'}</p>, { autoClose: 4000 });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const res = await Swal.fire({
      title: 'Eliminar habitación',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar'
    });
    if (!res.isConfirmed) return;
    try {
      await deleteRoom(roomId);
      Swal.fire('Eliminada', 'Habitación eliminada', 'success');
      if (selectedRoomTypeId) loadRooms(selectedRoomTypeId);
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo eliminar', 'error');
    }
  };

  const renderTabs = () => (
    <div className="flex gap-2 border-b mb-4 text-sm">
      {[
        { key: 'hotel', label: 'Hotel' },
        { key: 'roomTypes', label: 'Tipos de habitación' },
        { key: 'rooms', label: 'Habitaciones' },
      ].map(t => (
        <button
          key={t.key}
          onClick={() => setActiveTab(t.key as TabKey)}
          className={`px-3 py-2 rounded-t-md ${activeTab === t.key ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  // Render helpers (lowercase to avoid being treated as dynamic component types each render)
  const renderHotelTab = () => (
    <div className="space-y-4" data-section="hotel-tab">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block font-medium text-sm">Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block font-medium text-sm">E-mail</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block font-medium text-sm">Descripción</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block font-medium text-sm">Dirección</label>
          <input value={address} onChange={e=>setAddress(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block font-medium text-sm">Ciudad</label>
          <input value={city} onChange={e=>setCity(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block font-medium text-sm">País</label>
          <input value={country} onChange={e=>setCountry(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block font-medium text-sm">Servicios (separados por coma)</label>
          <input value={services} onChange={e=>setServices(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={handleDeleteHotel} disabled={deleting} className="text-red-600 text-sm disabled:opacity-50">
          {deleting ? 'Eliminando...' : 'Eliminar hotel'}
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
          <button disabled={loading} onClick={handleSaveHotel} className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );

  const renderRoomTypesTab = () => (
    <div className="space-y-6" data-section="roomtypes-tab">
      <RoomTypeCreateForm
        rtName={rtName} setRtName={setRtName}
        rtCapacity={rtCapacity} setRtCapacity={setRtCapacity}
        rtBeds={rtBeds} setRtBeds={setRtBeds}
        rtBaths={rtBaths} setRtBaths={setRtBaths}
        rtPrice={rtPrice} setRtPrice={setRtPrice}
        rtImages={rtImages} setRtImages={setRtImages}
        rtImageFiles={rtImageFiles} setRtImageFiles={setRtImageFiles}
        rtUploading={rtUploading} handleUploadNewRtImages={handleUploadNewRtImages}
        rtUploadedUrls={rtUploadedUrls} removePendingUploadedUrl={removePendingUploadedUrl}
        handleAddRoomType={handleAddRoomType}
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Tipos de habitación existentes</h3>
          <button onClick={loadRoomTypes} className="text-xs underline">Refrescar</button>
        </div>
        {roomTypesLoading ? <p className="text-sm">Cargando...</p> : (
          <ul className="overflow-auto pr-2 flex flex-col gap-2">
            {roomTypes.map(rt => {
              const rtIdStr = String(rt.id);
              return (
              <li key={rtIdStr} className="border rounded text-xs flex flex-col gap-1 p-2 pr-4 bg-white">
                {editingRoomTypeId === rtIdStr ? (
                  <div className="grid gap-1 md:grid-cols-6">
                    <input value={editingRoomTypeDraft.name || ''} onChange={e=>setEditingRoomTypeDraft(d=>({...d, name:e.target.value}))} placeholder="Nombre" className="border rounded px-2 py-1 h-9 text-sm" />
                    <input value={editingRoomTypeDraft.capacity as any || ''} onChange={e=>setEditingRoomTypeDraft(d=>({...d, capacity:Number(e.target.value)}))} placeholder="Capacidad" type="number" className="border rounded px-2 py-1 h-9 text-sm" />
                    <input value={editingRoomTypeDraft.totalBeds as any || ''} onChange={e=>setEditingRoomTypeDraft(d=>({...d, totalBeds:Number(e.target.value)}))} placeholder="Camas" type="number" className="border rounded px-2 py-1 h-9 text-sm" />
                    <input value={editingRoomTypeDraft.totalBathrooms as any || ''} onChange={e=>setEditingRoomTypeDraft(d=>({...d, totalBathrooms:Number(e.target.value)}))} placeholder="Baños" type="number" className="border rounded px-2 py-1 h-9 text-sm" />
                    <input value={editingRoomTypeDraft.price as any || ''} onChange={e=>setEditingRoomTypeDraft(d=>({...d, price:Number(e.target.value)}))} placeholder="Precio" type="number" className="border rounded px-2 py-1 h-9 text-sm" />
                    <div className="flex gap-1 justify-end">
                      <button onClick={saveEditRoomType} className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Aceptar</button>
                      <button onClick={cancelEditRoomType} className="bg-gray-300 px-4 rounded">Cerrar</button>
                    </div>
                    <div className="md:col-span-6 space-y-1">
                      <div className="border rounded p-1 flex flex-col gap-1 bg-gray-50">
                        <label className="text-[10px] font-medium">Agregar nuevas imágenes</label>
                        <input type="file" multiple accept="image/*" onChange={e=>{ const files = Array.from(e.target.files||[]); setEditingUploadFiles(files); }} className="text-[10px]" />
                        {editingUploadFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            {editingUploadFiles.map((f,i)=>(<span key={i} className="text-[10px] bg-gray-200 px-1 rounded">{f.name}</span>))}
                            <button disabled={editingUploading} onClick={handleUploadEditingImages} className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] disabled:opacity-50">{editingUploading ? 'Subiendo...' : 'Subir'}</button>
                          </div>
                        )}
                        {(((editingRoomTypeDraft.images)||[]).length > 0 || editingUploadFiles.length > 0) && (
                          <div className="flex flex-wrap gap-2">
                            {editingUploadFiles.map(f => {
                              const url = URL.createObjectURL(f);
                              return (
                                <div key={url} className="relative group">
                                  <img src={url} alt={f.name} className="w-14 h-14 object-cover rounded border" />
                                  <span className="absolute bottom-0 left-0 bg-black/50 text-white px-1 text-[8px] rounded-br rounded-tl">new</span>
                                </div>
                              )
                            })}
                            {(editingRoomTypeDraft.images||[]).map(img => (
                              <div key={img} className="relative group">
                                <FallbackImg original={img} className="w-14 h-14 object-cover rounded border" />
                                <button type="button" onClick={()=>removeEditingImage(img)} className="hidden group-hover:block absolute -top-1 -right-1 bg-black/60 text-white rounded-full px-1 text-[9px]">x</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1 text-[11px] leading-tight">
                      <p className="font-semibold">{rt.name}</p>
                      <p>Capacidad: {rt.capacity}, Camas: {rt.totalBeds}, Baños: {rt.totalBathrooms}, Precio: {rt.price}</p>
                      <p className="truncate">Imgs: {rt.images?.length || 0}</p>
                    </div>
                    <div className="flex gap-1 text-xs">
                      <button onClick={()=>startEditRoomType(rt)} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Editar</button>
                      <button onClick={()=>handleDeleteRoomType(rtIdStr)} className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white">Eliminar</button>
                      <button onClick={()=>handleSelectRoomType(rtIdStr)} className="px-2 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white">Habitaciones</button>
                    </div>
                  </div>
                )}
              </li>
              );
            })}
            {roomTypes.length === 0 && !roomTypesLoading && <li className="text-xs">No hay tipos de habitación.</li>}
          </ul>
        )}
      </div>
    </div>
  );

  const renderRoomsTab = () => (
    <div className="space-y-4" data-section="rooms-tab">
      {!selectedRoomTypeId && <p className="text-sm">Selecciona un tipo de habitación primero (pestaña Tipos de Habitación).</p>}
      {selectedRoomTypeId && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Habitaciones</h3>
            <button onClick={()=> selectedRoomTypeId && loadRooms(selectedRoomTypeId)} className="text-xs underline">Refrescar</button>
          </div>
          {roomsLoading ? <p className="text-sm">Cargando...</p> : (
            rooms.length > 0 ? (
              <ul className="space-y-1 max-h-64 overflow-auto pr-2 text-xs">
                {rooms.map(r => (
                  <li key={r.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
                    {editingRoomId === r.id ? (
                      <div className="flex gap-2 w-full">
                          <input
                              value={editingRoomNumber}
                              onChange={e => setEditingRoomNumber(e.target.value)}
                              className="rounded px-1 flex-1 focus:outline-none"
                          />
                          <button onClick={saveEditRoom} className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Aceptar</button>
                          <button onClick={cancelEditRoom} className="bg-gray-300 hover:bg-gray-400 py-1 px-2 rounded">Cerrar</button>
                      </div>
                    ) : (
                      <>
                        <span>{r.roomNumber}</span>
                        <div className="flex gap-1">
                          <button onClick={()=>startEditRoom(r)} className="px-2 py-1 rounded bg-gray-200">Editar</button>
                          <button onClick={()=>handleDeleteRoom(r.id)} className="px-2 py-1 rounded bg-red-500 text-white">Eliminar</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-600 border rounded p-3 bg-gray-50">Este tipo de habitación aún no tiene habitaciones. Agrega números debajo.</div>
            )
          )}
          <div className="pt-4 space-y-2 text-xs">
            <h4 className="font-semibold">Agregar nueva habitación</h4>
            <div className="flex gap-2 items-center">
              <input
                value={newRoomNumber}
                onChange={e=>setNewRoomNumber(e.target.value)}
                placeholder="Número"
                className="border rounded px-2 py-1 h-9 text-sm w-32"
                onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); handleAddPendingRoom(); } }}
              />
              <button onClick={handleAddPendingRoom} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">+ Añadir habitación</button>
              <button onClick={savePendingRooms} className="bg-red-500 text-white px-3 py-1 rounded text-sm" disabled={pendingRooms.length===0}>Guardar</button>
            </div>
            {pendingRooms.length > 0 && (
              <div className="border rounded p-2 bg-gray-50 flex flex-wrap gap-2">
                {pendingRooms.map(r => (
                  <span key={r} className="flex items-center gap-1 bg-white border rounded px-2 py-0.5">
                    {r}
                    <button type="button" onClick={()=>removePendingRoom(r)} className="text-[10px] text-red-600">x</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cerrar</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto bg-black/50 p-4">
      {/* Added top margin on small screens so the modal isn't hidden under sticky nav; center on md+ */}
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-lg p-6 relative animate-fade-in mt-16 md:mt-0">
        <h2 className="text-2xl font-bold mb-2">Editar Hotel: <span className="text-red-600">{hotel.name}</span></h2>
        {renderTabs()}
        <div className="min-h-[300px]">
          {activeTab === 'hotel' && renderHotelTab()}
          {activeTab === 'roomTypes' && renderRoomTypesTab()}
          {activeTab === 'rooms' && renderRoomsTab()}
        </div>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" aria-label="Cerrar">✕</button>
      </div>
    </div>
  );
}
