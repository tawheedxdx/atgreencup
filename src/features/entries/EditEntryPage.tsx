import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { entrySchema, type EntryFormData } from './entrySchema';
import { useAuthStore } from '../../store/authStore';
import { getEntryById, updateEntry, validateImageFile, getProducts, getMachines, getUnits, getShifts, getMachineByNo, getProductById } from '../../services/entries.service';
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

  const { register, handleSubmit, control, setValue, reset, watch, formState: { errors } } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      machineNo: '',
      machineId: '',
      productId: '',
      productName: '',
      packetsPerBox: undefined,
      boxQuantity: undefined,
      totalPackets: undefined,
      counting: undefined,
      pcs: undefined,
      shift: '',
      productionDate: '',
      notes: '',
    },
  });

  const watchMachineNo = watch('machineNo');
  const watchProductName = watch('productName');
  const watchPacketsPerBox = watch('packetsPerBox');
  const watchBoxQuantity = watch('boxQuantity');
  const watchTotalPackets = watch('totalPackets');
  const watchCounting = watch('counting');
  const watchPcs = watch('pcs');
  const [machineError, setMachineError] = useState<string | null>(null);
  const [loadingMachine, setLoadingMachine] = useState(false);

  useEffect(() => {
    const box = Number(watchBoxQuantity);
    const ppb = Number(watchPacketsPerBox);
    if (!isNaN(box) && !isNaN(ppb) && Number.isInteger(box) && Number.isInteger(ppb) && box > 0 && ppb > 0) {
      setValue('totalPackets', box * ppb, { shouldValidate: true });
    } else {
      setValue('totalPackets', undefined as any, { shouldValidate: true });
    }
  }, [watchBoxQuantity, watchPacketsPerBox, setValue]);

  useEffect(() => {
    const tp = Number(watchTotalPackets);
    const c = Number(watchCounting);
    if (!isNaN(tp) && !isNaN(c) && Number.isInteger(tp) && Number.isInteger(c) && tp > 0 && c > 0) {
      setValue('pcs', tp * c, { shouldValidate: true });
    } else {
      setValue('pcs', undefined as any, { shouldValidate: true });
    }
  }, [watchTotalPackets, watchCounting, setValue]);

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
        
        let ppb: number | undefined = entryData.packetsPerBox;
        if (ppb === undefined || ppb === null) {
          const selectedProduct = p.find(item => item.id === entryData.productId);
          ppb = selectedProduct?.packetsPerBox;
          if (ppb === undefined) {
            try {
              const fetchedProd = await getProductById(entryData.productId);
              ppb = fetchedProd?.packetsPerBox;
            } catch (e) {
              console.error('Failed to fetch product packetsPerBox:', e);
            }
          }
        }

        const selectedMachine = m.find(item => item.machineNo === entryData.machineNo);
        reset({
          machineNo: entryData.machineNo,
          machineId: entryData.machineId || selectedMachine?.id || '',
          productId: entryData.productId,
          productName: entryData.productName,
          packetsPerBox: ppb,
          boxQuantity: entryData.boxQuantity ?? entryData.quantity,
          totalPackets: entryData.totalPackets,
          counting: entryData.counting,
          pcs: entryData.pcs ?? entryData.quantity2,
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

  useEffect(() => {
    if (!watchMachineNo) {
      setValue('productId', '');
      setValue('productName', '');
      setValue('packetsPerBox', undefined as any);
      setValue('machineId', '');
      setMachineError(null);
      return;
    }

    const fetchMachineInfo = async () => {
      setLoadingMachine(true);
      setMachineError(null);
      try {
        const machine = await getMachineByNo(watchMachineNo);
        if (machine) {
          setValue('machineId', machine.id);
          if (machine.assignedProductId && machine.assignedProductName) {
            setValue('productId', machine.assignedProductId);
            setValue('productName', machine.assignedProductName);

            const foundProd = products.find(p => p.id === machine.assignedProductId);
            let ppb = foundProd?.packetsPerBox;
            if (ppb === undefined) {
              const fetchedProd = await getProductById(machine.assignedProductId);
              ppb = fetchedProd?.packetsPerBox;
            }
            if (ppb !== undefined && ppb > 0) {
              setValue('packetsPerBox', ppb, { shouldValidate: true });
            } else {
              setMachineError('Assigned product has no valid Packets Per Box. Please contact admin.');
            }
          } else {
            setValue('productId', '');
            setValue('productName', '');
            setValue('packetsPerBox', undefined as any);
            setMachineError('No product assigned to this machine. Please contact admin.');
          }
        } else {
          setValue('productId', '');
          setValue('productName', '');
          setValue('packetsPerBox', undefined as any);
          setMachineError('Selected machine could not be found.');
        }
      } catch (err) {
        console.error('Error fetching machine details:', err);
        setMachineError('Error loading machine assignment.');
      } finally {
        setLoadingMachine(false);
      }
    };

    fetchMachineInfo();
  }, [watchMachineNo, setValue, products]);

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
        quantity: data.boxQuantity,
        unit: 'BOX',
        quantity2: data.pcs,
        unit2: 'PCS',
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

          {/* Product */}
          <div className="relative pb-3">
            <Input
              label={t('entry.product')}
              value={watchProductName || ''}
              readOnly
              disabled
              placeholder={loadingMachine ? 'Loading assigned product...' : 'Product will be auto-filled'}
              error={errors.productId?.message || errors.productName?.message || machineError || undefined}
              rightIcon={
                watchProductName ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
                    🔒 Auto-filled
                  </span>
                ) : undefined
              }
              className="!bg-gray-100/70 dark:!bg-dark-surface/30 cursor-not-allowed select-none"
            />
            {watchProductName && !machineError && (
              <span className="block mt-1 px-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                Auto-filled from selected machine
              </span>
            )}
          </div>

          {/* Packets Per Box */}
          <div className="relative pb-3">
            <Controller
              name="packetsPerBox"
              control={control}
              render={({ field }) => (
                <Input
                  label="Packets Per Box"
                  type="number"
                  readOnly
                  disabled
                  placeholder={loadingMachine ? 'Loading...' : 'Packets Per Box will be auto-filled'}
                  value={field.value ?? ''}
                  error={errors.packetsPerBox?.message}
                  rightIcon={
                    field.value ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
                        🔒 Auto-filled
                      </span>
                    ) : undefined
                  }
                  className="!bg-gray-100/70 dark:!bg-dark-surface/30 cursor-not-allowed select-none"
                />
              )}
            />
          </div>

          <input type="hidden" {...register('machineId')} />
          <input type="hidden" {...register('productId')} />
          <input type="hidden" {...register('productName')} />

          {/* BOX */}
          <div>
            <Controller
              name="boxQuantity"
              control={control}
              render={({ field }) => (
                <Input
                  label="BOX"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : Number(val));
                  }}
                  error={errors.boxQuantity?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('common.box')}</span>}
                />
              )}
            />
          </div>

          {/* Total Packets (Auto Calculated / Read Only) */}
          <div>
            <Controller
              name="totalPackets"
              control={control}
              render={({ field }) => (
                <Input
                  label="Total Packets"
                  type="number"
                  readOnly
                  disabled
                  placeholder="Auto Calculated"
                  value={field.value ?? ''}
                  error={errors.totalPackets?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">PACKETS</span>}
                  className="!bg-gray-100/70 dark:!bg-dark-surface/30 cursor-not-allowed select-none"
                />
              )}
            />
          </div>

          {/* Counting */}
          <div>
            <Controller
              name="counting"
              control={control}
              render={({ field }) => (
                <Input
                  label="Counting"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : Number(val));
                  }}
                  error={errors.counting?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">PCS/PKT</span>}
                />
              )}
            />
          </div>

          {/* PCS (Auto Calculated / Read Only) */}
          <div>
            <Controller
              name="pcs"
              control={control}
              render={({ field }) => (
                <Input
                  label="PCS"
                  type="number"
                  readOnly
                  disabled
                  placeholder="Auto Calculated"
                  value={field.value ?? ''}
                  error={errors.pcs?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('common.pcs')}</span>}
                  className="!bg-gray-100/70 dark:!bg-dark-surface/30 cursor-not-allowed select-none"
                />
              )}
            />
          </div>

          {/* Calculation Preview Card */}
          {watchBoxQuantity !== undefined && watchPacketsPerBox !== undefined && watchCounting !== undefined &&
           !errors.boxQuantity && !errors.counting && watchTotalPackets !== undefined && watchPcs !== undefined && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-5 border border-emerald-100/60 dark:border-emerald-900/30 space-y-3 shadow-sm">
              <div>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] mb-2">Calculation Preview</p>
                <div className="space-y-2 font-black text-gray-900 dark:text-emerald-50">
                  <p className="text-base">
                    {watchBoxQuantity} <span className="text-emerald-500 font-normal">×</span> {watchPacketsPerBox} = {watchTotalPackets} <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Packets</span>
                  </p>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Then:</p>
                  <p className="text-lg">
                    {watchTotalPackets} <span className="text-emerald-500 font-normal">×</span> {watchCounting} = {watchPcs} <span className="text-xs font-bold text-gray-400 dark:text-gray-500">PCS</span>
                  </p>
                </div>
              </div>
            </div>
          )}

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
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              disabled={!!machineError || loadingMachine || !watchMachineNo || !watchProductName || !watchPacketsPerBox || !watchBoxQuantity || !watchCounting || !watchPcs || submitting}
              className="!rounded-2xl shadow-xl shadow-emerald-500/10"
            >
              {submitting ? t('common.save') : t('common.save_changes') || "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
