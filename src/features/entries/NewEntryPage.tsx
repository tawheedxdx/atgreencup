import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { entrySchema, type EntryFormData } from './entrySchema';
import { useAuthStore } from '../../store/authStore';
import { createProductionEntry, validateImageFile, getProducts, getMachines, getUnits, getShifts, checkDuplicateMachineEntry, getMachineByNo } from '../../services/entries.service';
import { todayISO } from '../../utils/helpers';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Toast } from '../../components/feedback/Toast';
import type { Product, Machine, Unit, Shift } from '../../types';

export const NewEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);

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
      machineId: '',
      productId: '',
      productName: '',
      boxQuantity: undefined,
      totalPackets: undefined,
      counting: undefined,
      pcs: undefined,
      shift: '',
      productionDate: todayISO(),
      notes: '',
    },
  });

  const watchMachineNo = watch('machineNo');
  const watchProductName = watch('productName');
  const watchTotalPackets = watch('totalPackets');
  const watchCounting = watch('counting');
  const watchPcs = watch('pcs');
  const [machineError, setMachineError] = useState<string | null>(null);
  const [loadingMachine, setLoadingMachine] = useState(false);

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
    if (!watchMachineNo) {
      setValue('productId', '');
      setValue('productName', '');
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
          } else {
            setValue('productId', '');
            setValue('productName', '');
            setMachineError('No product assigned to this machine. Please contact admin.');
          }
        } else {
          setValue('productId', '');
          setValue('productName', '');
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
  }, [watchMachineNo, setValue]);

  const onSubmit = useCallback(async (data: EntryFormData) => {
    // Prevent double-submit
    if (submitting) return;

    // ── Step 1: Image presence check ──────────────────────────────
    if (!imageFile) {
      setImageError(t('entry.error_image_mandatory') || 'Image proof is required');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    // ── Step 2: Client-side file validation (type + size) ─────────
    try {
      validateImageFile(imageFile);
    } catch (validationErr: any) {
      setImageError(validationErr.message);
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setImageError('');

    try {
      // ── Duplicate Check ──
      const isDuplicate = await checkDuplicateMachineEntry(profile!.uid, data.productionDate, data.machineNo);
      if (isDuplicate) {
        setDuplicateError(true);
        setSubmitting(false);
        return;
      }

      // ── Step 3 + 4 + 5: Upload → get URL → save (all-or-nothing) ──
      // createProductionEntry does NOT touch Firestore until image upload succeeds.
      await createProductionEntry(
        {
          ...data,
          operatorUid: profile!.uid,
          operatorName: profile!.name,
          employeeId: profile!.employeeId || '',
          quantity: data.boxQuantity,
          unit: 'BOX',
          quantity2: data.pcs,
          unit2: 'PCS',
        },
        imageFile,
        setUploadProgress
      );

      setSubmitting(false);
      setToast({ message: t('common.success'), type: 'success' });
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      // Distinguish upload errors from other errors for a clearer message
      const isUploadError =
        err?.message?.toLowerCase().includes('upload') ||
        err?.code === 'storage/unauthorized' ||
        err?.code === 'storage/canceled';
      const message = isUploadError
        ? 'Image upload failed. Entry was NOT saved. Please try again.'
        : err?.message || t('common.error');
      setToast({ message, type: 'error' });
      // DO NOT clear form or image — allow user to retry
      setSubmitting(false);
    }
  }, [submitting, imageFile, profile, navigate, t]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title={t('entry.new_title')} onBack={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Operator Info (read-only) */}
          <div className="bg-emerald-50 dark:bg-dark-surface/40 rounded-[1.5rem] p-5 border border-emerald-100 dark:border-dark-border shadow-sm">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.2em] mb-1.5">Operator</p>
            <p className="text-base font-black text-gray-900 dark:text-emerald-50">{profile?.name}</p>
            {profile?.employeeId && (
              <p className="text-xs font-bold text-gray-400 mt-1">ID: {profile.employeeId}</p>
            )}
          </div>

          {/* Date */}
          <Input
            label={t('entry.date')}
            type="date"
            {...register('productionDate')}
            error={errors.productionDate?.message}
          />

          {/* Machine */}
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

          {/* Total Packets */}
          <div>
            <Controller
              name="totalPackets"
              control={control}
              render={({ field }) => (
                <Input
                  label="Total Packets"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : Number(val));
                  }}
                  error={errors.totalPackets?.message}
                  rightIcon={<span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">PACKETS</span>}
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
          {watchTotalPackets !== undefined && watchCounting !== undefined && !errors.totalPackets && !errors.counting && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] mb-1">Calculation Preview</p>
                <p className="text-lg font-black text-gray-900 dark:text-emerald-50">
                  {watchTotalPackets} <span className="text-emerald-500 font-normal">×</span> {watchCounting} = {watchPcs ?? '—'} <span className="text-xs font-bold text-gray-400 dark:text-gray-500">PCS</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                🧮
              </div>
            </div>
          )}

          {/* Shift */}
          <Select
            label={t('entry.shift')}
            placeholder={t('entry.shift')}
            options={shifts.map(s => ({ value: s.code || s.name, label: s.name }))}
            {...register('shift')}
            error={errors.shift?.message}
          />

          {/* Notes */}
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

          {/* Image Upload */}
          <ImageUpload
            value={imageFile}
            onChange={(file) => { setImageFile(file); setImageError(''); }}
            error={imageError}
          />

          {/* Upload progress */}
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 dark:bg-dark-surface rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 pb-10">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              disabled={!!machineError || loadingMachine || !watchMachineNo}
              className="!rounded-2xl shadow-xl shadow-emerald-500/10"
            >
              {submitting ? t('entry.submitting') : t('common.submit')}
            </Button>
          </div>
        </form>
      </div>

      {/* Duplicate Error Splash */}
      {duplicateError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-3">Entry Already Exists</h3>
            <p className="text-center text-base font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              You cannot make the same entry two times in a day for the same machine.
            </p>
            <Button fullWidth size="lg" onClick={() => setDuplicateError(false)} className="!bg-red-500 hover:!bg-red-600 text-white !rounded-2xl shadow-xl shadow-red-500/20">
              OK
            </Button>
          </div>
        </div>
      )}

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
