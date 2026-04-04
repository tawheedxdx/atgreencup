import { z } from 'zod';

export const issueSchema = z.object({
  issueType: z.enum(
    ['machine_issue', 'production_defect', 'raw_material_shortage', 'maintenance_need'],
    { required_error: 'Issue type is required' }
  ),
  machineNo: z.string().min(1, 'Machine number is required'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Priority is required',
  }),
});

export type IssueFormData = z.infer<typeof issueSchema>;
