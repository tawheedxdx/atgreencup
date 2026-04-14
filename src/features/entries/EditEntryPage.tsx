import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { entrySchema, type EntryFormData } from './entrySchema';
import { useAuthStore } from '../../store/authStore';
import { getEntryById, updateEntry, validateImageFile, getProducts, getMachines, getUnits, getShifts } from '../../services/entries.service';
import { uploadEntryImage, deleteEntryImage } from '../../services/storage.service';
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
  const { t } = useTranslation();
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
          setPageError(t('history.not_found') || 'Entry not found');
          return;
        }
        if (entryData.status === 'approved') {
          setPageError(t('history.approved_edit_error') || 'Approved entries cannot be edited');
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
        setPageError(err.message || t('common.error'));
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, profile, reset, t]);

  const onSubmit = useCallback(async (data: EntryFormData) => {
    if (submitting || !entry?.id) return;

    // Validate new file if one was selected
    if (imageFile) {
      try {
        validateImageFile(imageFile);
      } catch (validationErr: any) {
        setToast({ message: validationErr.message, type: 'error' });
        return;
      }
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrl = existingImageUrl;
      let imagePath = entry.imagePath;

      if (imageFile) {
        const compressed = await compressImage(imageFile);
        // Upload the new image FIRST — do NOT delete the old one until upload succeeds
        const result = await uploadEntryImage(entry.id, compressed, setUploadProgress);
        imageUrl = result.url;
        imagePath = result.path;
        // Only delete the old image after successful upload
        if (entry.imagePath && entry.imagePath !== imagePath) {
          await deleteEntryImage(entry.imagePath);
        }
      }

      // Safety guard — never update entry without a valid imageUrl
      if (!imageUrl || !imagePath) {
        throw new Error('Image is required. Please select a valid image before saving.');
      }

      await updateEntry(entry.id, {
        ...data,
        imageUrl,
        imagePath,
        status: 'pending',
      });

      setToast({ message: t('history.update_success') || 'Updated successfully!', type: 'success' });
      setTimeout(() => navigate(`/entries/${entry.id}`, { replace: true }), 1500);
    } catch (err: any) {
      const isUploadError =
        err?.message?.toLowerCase().includes('upload') ||
        err?.code === 'storage/unauthorized' ||
        err?.code === 'storage/canceled';
      const message = isUploadError
        ? 'Image upload failed. Entry was NOT saved. Please try again.'
        : err?.message || t('common.error');
      setToast({ message, type: 'error' });
      // DO NOT clear form — allow user to retry
      setSubmitting(false);
    }
  }, [submitting, entry, imageFile, existingImageUrl, navigate, t]);

  if (pageLoading) return <LoadingView message={t('common.loading')} />;
  if (pageError) return <ErrorState message={pageError} onRetry={() => navigate(-1)} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title={t('entry.edit_title')} onBack={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Operator Info */}
          <div className="bg-emerald-50 dark:bg-dark-surface/40 rounded-[1.5rem] p-5 border border-emerald-100 dark:border-dark-border shadow-sm">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.2em] mb-1.5">Operator</p>
            <p className="text-base font-black text-gray-900 dark:text-emerald-50">{profile?.name}</p>
          </div>

          <Input 
            label={t('entry.date')} 
            type="date" 
            {...register('productionDate')} 
            error={errors.productionDate?.message} 
          />

          <Select
            label={t('entry.machine')}
            placeholder={t('entry.machine')}
            options={machines.map(m => ({ value: m.machineNo, label: `${m.machineNo} — ${m.label}` }))}
            {...register('machineNo')}
            error={errors.machineNo?.message}
          />

          <Select
            label={t('entry.product')}
            placeholder={t('entry.product')}
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
                  label={t('entry.quantity_box')}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  error={errors.quantity?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('common.box')}</span>}
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
                  label={t('entry.quantity_pcs')}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  error={errors.quantity2?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('common.pcs')}</span>}
                />
              )}
            />
          </div>

          <Select
            label={t('entry.shift')}
            placeholder={t('entry.shift')}
            options={shifts.map(s => ({ value: s.code || s.name, label: s.name }))}
            {...register('shift')}
            error={errors.shift?.message}
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-2 px-1 tracking-tight">
              {t('entry.notes')}
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder={t('entry.placeholder_notes')}
              className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl px-4 py-4 text-gray-900 dark:text-emerald-50 text-base placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium"
            />
          </div>

          <ImageUpload
            value={imageFile}
            previewUrl={existingImageUrl}
            onChange={(file) => setImageFile(file)}
          />

          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 dark:bg-dark-surface rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="pt-4 pb-10">
            <Button type="submit" fullWidth size="lg" loading={submitting} className="!rounded-2xl shadow-xl shadow-emerald-500/10">
              {submitting ? t('common.save') : t('common.save_changes') || "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
