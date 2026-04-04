import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { issueSchema, type IssueFormData } from './issueSchema';
import { useAuthStore } from '../../store/authStore';
import { getIssueById, createIssueReport, updateIssueReport } from '../../services/issues.service';
import { uploadIssuePhoto } from '../../services/storage.service';
import { getMachines } from '../../services/entries.service';
import { compressImage } from '../../utils/helpers';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Toast } from '../../components/feedback/Toast';
import {
  ISSUE_TYPE_CONFIG,
  ISSUE_PRIORITY_CONFIG,
  type IssueType,
  type IssuePriority,
  type Machine,
} from '../../types';

const ISSUE_TYPES: IssueType[] = [
  'machine_issue',
  'production_defect',
  'raw_material_shortage',
  'maintenance_need',
];

const PRIORITIES: IssuePriority[] = ['low', 'medium', 'high', 'urgent'];

export const ReportIssuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [useManualMachine, setUseManualMachine] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [existingIssue, setExistingIssue] = useState<any>(null);
  const [showUrgentModal, setShowUrgentModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueType: undefined,
      machineNo: '',
      description: '',
      priority: undefined,
    },
  });

  const selectedType = watch('issueType');
  const selectedPriority = watch('priority');

  // Load existing issue for edit
  useEffect(() => {
    if (!isEdit || !profile) return;
    const fetch = async () => {
      try {
        const issue = await getIssueById(id!);
        if (!issue || issue.operatorUid !== profile.uid) {
          setToast({ message: t('issue.not_found'), type: 'error' });
          setTimeout(() => navigate('/issues'), 2000);
          return;
        }
        if (issue.status !== 'open') {
          setToast({ message: t('issue.edit_forbidden_status'), type: 'error' });
          setTimeout(() => navigate(`/issues/${id}`), 2000);
          return;
        }
        setExistingIssue(issue);
        reset({
          issueType: issue.issueType,
          machineNo: issue.machineNo,
          description: issue.description,
          priority: issue.priority,
        });
        // If the machine is not in the assigned list, trigger manual mode
        // Wait for machines to load first though
      } catch (err) {
        setToast({ message: t('common.error'), type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, isEdit, profile, reset, t, navigate]);

  // Load machines — prefer assigned machines from profile, else load all
  useEffect(() => {
    const load = async () => {
      try {
        const all = await getMachines();
        const assigned = profile?.assignedMachines ?? [];
        const filtered = assigned.length > 0
          ? all.filter(m => assigned.includes(m.machineNo))
          : all;
        setMachines(filtered);

        // If editing and current machine isn't in filtered list, enable manual mode
        if (isEdit && existingIssue) {
          const isInList = filtered.some(m => m.machineNo === existingIssue.machineNo);
          if (!isInList) setUseManualMachine(true);
        }
      } catch {
        setMachines([]);
      }
    };
    load();
  }, [profile, isEdit, existingIssue]);

  const onSubmit = useCallback(
    async (data: IssueFormData) => {
      if (submitting) return;
      setSubmitting(true);

      try {
        let issueId = id;

        if (isEdit) {
          // Update existing
          await updateIssueReport(id!, {
            issueType: data.issueType,
            machineNo: data.machineNo,
            description: data.description,
            priority: data.priority,
          });
        } else {
          // 1. Write Firestore document (no photo yet)
          issueId = await createIssueReport({
            operatorUid: profile!.uid,
            operatorName: profile!.name,
            employeeId: profile!.employeeId || '',
            issueType: data.issueType,
            machineNo: data.machineNo,
            description: data.description,
            priority: data.priority,
            photoUrl: '',
            photoPath: '',
          });
        }

        // 2. Upload photo if provided
        if (imageFile) {
          try {
            const compressed = await compressImage(imageFile);
            const { url, path } = await uploadIssuePhoto(issueId!, compressed, setUploadProgress);
            await updateIssueReport(issueId!, { photoUrl: url, photoPath: path });
          } catch (imgErr) {
            console.warn('Photo upload failed, report saved without new photo:', imgErr);
          }
        }

        setSubmitting(false);
        setToast({
          message: isEdit ? t('issue.update_success') : t('issue.submit_success'),
          type: 'success'
        });
        
        // Show urgent call modal if priority is urgent
        if (data.priority === 'urgent') {
          setShowUrgentModal(true);
        } else {
          setTimeout(() => navigate(isEdit ? `/issues/${id}` : '/issues', { replace: true }), 1500);
        }
      } catch (err) {
        console.error('Issue save error:', err);
        setToast({ message: t('common.error'), type: 'error' });
        setSubmitting(false);
      }
    },
    [submitting, imageFile, profile, navigate, t, isEdit, id]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader
        title={isEdit ? t('issue.edit_title') : t('issue.report_title')}
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

          {/* ── Operator Info ── */}
          <div className="bg-red-50 dark:bg-dark-surface/40 rounded-[1.5rem] p-5 border border-red-100 dark:border-dark-border shadow-sm">
            <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-[0.2em] mb-1.5">
              {t('issue.operator_label')}
            </p>
            <p className="text-base font-black text-gray-900 dark:text-emerald-50">{profile?.name}</p>
            {profile?.employeeId && (
              <p className="text-xs font-bold text-gray-400 mt-1">{t('profile.emp_id')}: {profile.employeeId}</p>
            )}
          </div>

          {/* ── Issue Type ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-3 px-1 tracking-tight">
              {t('issue.type_label')} <span className="text-red-500">*</span>
            </p>
            <Controller
              name="issueType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {ISSUE_TYPES.map((type) => {
                    const cfg = ISSUE_TYPE_CONFIG[type];
                    const isSelected = field.value === type;
                    return (
                      <motion.button
                        key={type}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => field.onChange(type)}
                        className={`
                          relative p-4 rounded-2xl border-2 text-left transition-all
                          ${isSelected
                            ? 'shadow-md'
                            : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border'
                          }
                        `}
                        style={
                          isSelected
                            ? { borderColor: cfg.color, backgroundColor: `${cfg.color}10` }
                            : {}
                        }
                      >
                        <span className="text-2xl block mb-2">{cfg.icon}</span>
                        <span
                          className="text-xs font-black uppercase tracking-wide leading-snug"
                          style={{ color: isSelected ? cfg.color : undefined }}
                        >
                          {cfg.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            layoutId="issue-type-check"
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: cfg.color }}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            />
            {errors.issueType && (
              <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.issueType.message}</p>
            )}
          </div>

          {/* ── Machine Number ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-3 px-1 tracking-tight">
              {t('issue.machine_label')} <span className="text-red-500">*</span>
            </p>

            {machines.length > 0 && !useManualMachine ? (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {machines.map((m) => {
                    const isSelected = watch('machineNo') === m.machineNo;
                    return (
                      <motion.button
                        key={m.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setValue('machineNo', m.machineNo, { shouldValidate: true })}
                        className={`
                          px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all
                          ${isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {m.machineNo}
                      </motion.button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => { setUseManualMachine(true); setValue('machineNo', ''); }}
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-1"
                >
                  + {t('issue.other_machine')}
                </button>
              </>
            ) : (
              <>
                <Input
                  label=""
                  placeholder={t('issue.machine_placeholder')}
                  {...register('machineNo')}
                  error={errors.machineNo?.message}
                />
                {machines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setUseManualMachine(false); setValue('machineNo', ''); }}
                    className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2 px-1"
                  >
                    ← {t('issue.select_machine')}
                  </button>
                )}
              </>
            )}
            {errors.machineNo && machines.length > 0 && !useManualMachine && (
              <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.machineNo.message}</p>
            )}
          </div>

          {/* ── Priority ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-3 px-1 tracking-tight">
              {t('issue.priority_label')} <span className="text-red-500">*</span>
            </p>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => {
                    const cfg = ISSUE_PRIORITY_CONFIG[p];
                    const isSelected = field.value === p;
                    return (
                      <motion.button
                        key={p}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => field.onChange(p)}
                        className="py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all text-center"
                        style={
                          isSelected
                            ? { borderColor: cfg.color, color: cfg.color, backgroundColor: cfg.bg }
                            : { borderColor: 'transparent', color: '#9CA3AF' }
                        }
                      >
                        {p === 'urgent' ? '🔴' : p === 'high' ? '🟠' : p === 'medium' ? '🟡' : '🟢'}
                        <br />
                        {cfg.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            />
            {errors.priority && (
              <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.priority.message}</p>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-2 px-1 tracking-tight">
              {t('issue.description_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder={t('issue.description_placeholder')}
              className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl px-4 py-4 text-gray-900 dark:text-emerald-50 text-base placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-500/20 focus:border-red-500 transition-all resize-none font-medium"
            />
            {errors.description && (
              <p className="text-xs text-red-500 font-bold mt-1.5 px-1">{errors.description.message}</p>
            )}
          </div>

          {/* ── Photo ── */}
          <ImageUpload
            value={imageFile}
            onChange={(file) => setImageFile(file)}
          />

          {/* Upload progress bar */}
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 dark:bg-dark-surface rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* ── Submit ── */}
          <div className="pt-4 pb-10">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              className="!rounded-2xl shadow-xl shadow-red-500/10 !bg-red-600 hover:!bg-red-700"
            >
              {submitting
                ? t('issue.submitting')
                : isEdit
                  ? t('issue.update_btn')
                  : t('issue.submit_btn')
              }
            </Button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <ConfirmDialog
        open={showUrgentModal}
        title={t('issue.urgent_call_title')}
        message={t('issue.urgent_call_msg')}
        confirmLabel={t('issue.urgent_call_btn')}
        cancelLabel={t('issue.urgent_not_now')}
        onConfirm={() => {
          window.location.href = 'tel:9378160180';
          navigate('/issues', { replace: true });
        }}
        onCancel={() => {
          navigate('/issues', { replace: true });
        }}
      />
    </div>
  );
};
