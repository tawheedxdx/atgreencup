import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { entrySchema, type EntryFormData } from './entrySchema';
import { useAuthStore } from '../../store/authStore';
import { getEntryById, updateEntry } from '../../services/entries.service';
import { uploadEntryImage, deleteEntryImage } from '../../services/storage.service';
import { getProducts, getMachines, getUnits, getShifts } from '../../services/entries.service';
import { compressImage } from '../../utils/helpers';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { LoadingView } from '../../components/feedback/LoadingView';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Toast } from '../../components/feedback/Toast';
import type { ProductionEntry, Product, Machine, Unit, Shift } from '../../types';

export const EditEntryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [entry, setEntry] = useState<ProductionEntry | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
  });

  useEffect(() => {
    const load = async () => {
      if (!id || !profile) return;
      try {
        const [entryData, p, m, u, s] = await Promise.all([
          getEntryById(id),
          getProducts(), getMachines(), getUnits(), getShifts(),
        ]);
        if (!entryData || entryData.operatorUid !== profile.uid) {
          setPageError('Entry not found');
          return;
        }
        if (entryData.status === 'approved') {
          setPageError('Approved entries cannot be edited');
          return;
        }
        setEntry(entryData);
        setProducts(p);
        setMachines(m);
        setUnits(u);
        setShifts(s);
        setExistingImageUrl(entryData.imageUrl);
        reset({
          machineNo: entryData.machineNo,
          productId: entryData.productId,
          productName: entryData.productName,
          quantity: entryData.quantity,
          unit: 'BOX',
          quantity2: entryData.quantity2,
          unit2: 'PCS',
          shift: entryData.shift,
          productionDate: entryData.productionDate,
          notes: entryData.notes,
        });
      } catch (err: any) {
        setPageError(err.message || 'Failed to load entry');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, profile, reset]);

  const onSubmit = useCallback(async (data: EntryFormData) => {
    if (submitting || !entry?.id) return;
    setSubmitting(true);

    try {
      let imageUrl = existingImageUrl;
      let imagePath = entry.imagePath;

      if (imageFile) {
        const compressed = await compressImage(imageFile);
        if (entry.imagePath) await deleteEntryImage(entry.imagePath);
        const result = await uploadEntryImage(entry.id, compressed, setUploadProgress);
        imageUrl = result.url;
        imagePath = result.path;
      }

      await updateEntry(entry.id, {
        ...data,
        imageUrl,
        imagePath,
        status: 'pending',
      });

      setToast({ message: 'Production updated successfully!', type: 'success' });
      setTimeout(() => navigate(`/entries/${entry.id}`, { replace: true }), 1500);
    } catch (err: any) {
      setToast({ message: 'Failed to update entry', type: 'error' });
      setSubmitting(false);
    }
  }, [submitting, entry, imageFile, existingImageUrl, navigate]);

  if (pageLoading) return <LoadingView message="Loading entry..." />;
  if (pageError) return <ErrorState message={pageError} onRetry={() => navigate(-1)} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Edit Production" onBack={() => navigate(-1)} />

      <div className="px-5 py-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Operator</p>
            <p className="text-sm font-bold text-gray-900">{profile?.name}</p>
          </div>

          <Input label="Production Date" type="date" {...register('productionDate')} error={errors.productionDate?.message} />

          <Select
            label="Machine"
            placeholder="Select machine"
            options={machines.map(m => ({ value: m.machineNo, label: `${m.machineNo} — ${m.label}` }))}
            {...register('machineNo')}
            error={errors.machineNo?.message}
          />

          <Select
            label="Product"
            placeholder="Select product"
            options={products.map(p => ({ value: p.id, label: p.name }))}
            {...register('productId')}
            error={errors.productId?.message}
          />

          {/* Main Quantity Row */}
          <div>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  label="Quantity (BOX)"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  error={errors.quantity?.message}
                  rightIcon={<span className="text-sm font-semibold text-gray-400 pr-3">BOX</span>}
                />
              )}
            />
          </div>

          {/* Secondary Quantity Row */}
          <div>
            <Controller
              name="quantity2"
              control={control}
              render={({ field }) => (
                <Input
                  label="Quantity (PCS)"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  error={errors.quantity2?.message}
                  rightIcon={<span className="text-sm font-semibold text-gray-400 pr-3">PCS</span>}
                />
              )}
            />
          </div>

          <Select
            label="Shift"
            placeholder="Select shift"
            options={shifts.map(s => ({ value: s.code || s.name, label: s.name }))}
            {...register('shift')}
            error={errors.shift?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Optional notes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <ImageUpload
            value={imageFile}
            previewUrl={existingImageUrl}
            onChange={(file) => setImageFile(file)}
          />

          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="pt-2 pb-6">
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
