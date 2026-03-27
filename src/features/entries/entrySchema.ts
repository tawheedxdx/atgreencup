import { z } from 'zod';

export const entrySchema = z.object({
  machineNo: z.string().min(1, 'Machine is required'),
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number({ invalid_type_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit: z.literal('BOX'),
  quantity2: z.number({ invalid_type_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit2: z.literal('PCS'),
  shift: z.string().min(1, 'Shift is required'),
  productionDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional().default(''),
});

export type EntryFormData = z.infer<typeof entrySchema>;
