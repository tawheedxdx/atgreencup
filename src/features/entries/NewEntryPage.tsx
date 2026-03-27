import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { entrySchema, type EntryFormData } from './entrySchema';
import { useAuthStore } from '../../store/authStore';
import { createEntry, updateEntry } from '../../services/entries.service';
import { uploadEntryImage } from '../../services/storage.service';
import { getProducts, getMachines, getUnits, getShifts } from '../../services/entries.service';
import { compressImage, todayISO } from '../../utils/helpers';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Toast } from '../../components/feedback/Toast';
import type { Product, Machine, Unit, Shift } from '../../types';

export const NewEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reference data
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, m, u, s] = await Promise.all([getProducts(), getMachines(), getUnits(), getShifts()]);
        setProducts(p);
        setMachines(m);
        setUnits(u);
        setShifts(s);
      } catch (err) {
        console.error('Error loading reference data:', err);
      }
    };
    load();
  }, []);

  const {
    register, handleSubmit, control, setValue, watch, formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      machineNo: '',
      productId: '',
      productName: '',
      quantity: undefined,
      unit: 'BOX',
      quantity2: undefined,
      unit2: 'PCS',
      shift: '',
      productionDate: todayISO(),
      notes: '',
    },
  });

  // Auto-set product name when product is selected
  const watchProductId = watch('productId');
  useEffect(() => {
    const product = products.find(p => p.id === watchProductId);
    if (product) {
      setValue('productName', product.name);
    }
  }, [watchProductId, products, setValue]);

  const onSubmit = useCallback(async (data: EntryFormData) => {
    if (submitting) return;

    setSubmitting(true);
    setImageError('');

    try {
      // Create entry first to get ID
      const entryId = await createEntry({
        ...data,
        operatorUid: profile!.uid,
        operatorName: profile!.name,
        employeeId: profile!.employeeId || '',
        imageUrl: '',
        imagePath: '',
      });

      // Upload image only if provided
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          const { url, path } = await uploadEntryImage(entryId, compressed, setUploadProgress);
          await updateEntry(entryId, { imageUrl: url, imagePath: path });
        } catch (imgErr) {
          console.warn('Image upload failed, entry saved without image:', imgErr);
        }
      }

      setSubmitting(false);
      setToast({ message: 'Production submitted successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      setToast({ message: 'Failed to submit production. Please try again.', type: 'error' });
      setSubmitting(false);
    }
  }, [submitting, imageFile, profile, navigate]);


  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="New Production" onBack={() => navigate(-1)} />

      <div className="px-5 py-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Operator Info (read-only) */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Operator</p>
            <p className="text-sm font-bold text-gray-900">{profile?.name}</p>
            {profile?.employeeId && (
              <p className="text-xs text-gray-500">ID: {profile.employeeId}</p>
            )}
          </div>

          {/* Date */}
          <Input
            label="Production Date"
            type="date"
            {...register('productionDate')}
            error={errors.productionDate?.message}
          />

          {/* Machine */}
          <Select
            label="Machine"
            placeholder="Select machine"
            options={machines.map(m => ({ value: m.machineNo, label: `${m.machineNo} — ${m.label}` }))}
            {...register('machineNo')}
            error={errors.machineNo?.message}
          />

          {/* Product */}
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

          {/* Shift */}
          <Select
            label="Shift"
            placeholder="Select shift"
            options={shifts.map(s => ({ value: s.code || s.name, label: s.name }))}
            {...register('shift')}
            error={errors.shift?.message}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes / Remarks</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Optional notes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Image Upload */}
          <ImageUpload
            value={imageFile}
            onChange={(file) => { setImageFile(file); setImageError(''); }}
            error={imageError}
          />

          {/* Upload progress */}
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 pb-6">
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              {submitting ? 'Submitting...' : 'Submit Production'}
            </Button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
