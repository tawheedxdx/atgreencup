import { z } from 'zod';

export const entrySchema = z.object({
  machineNo: z.string().min(1, 'Machine is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1, 'Product name is required'),
  packetsPerBox: z.number({ invalid_type_error: 'Packets Per Box is required' })
    .int()
    .positive(),
  boxQuantity: z.number({ invalid_type_error: 'BOX is required' })
    .int({ message: 'Please enter whole numbers only.' })
    .positive({ message: 'BOX must be greater than 0' }),
  totalPackets: z.number({ invalid_type_error: 'Total Packets is required' })
    .int({ message: 'Please enter whole numbers only.' })
    .positive({ message: 'Total Packets must be greater than 0' }),
  counting: z.number({ invalid_type_error: 'Counting is required' })
    .int({ message: 'Please enter whole numbers only.' })
    .positive({ message: 'Counting must be greater than 0' }),
  pcs: z.number({ invalid_type_error: 'PCS is required' })
    .int({ message: 'Please enter whole numbers only.' })
    .positive({ message: 'PCS must be greater than 0' }),
  shift: z.string().min(1, 'Shift is required'),
  productionDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional().default(''),
});

export type EntryFormData = z.infer<typeof entrySchema>;
