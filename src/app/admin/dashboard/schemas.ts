
import { z } from 'zod';

// Base schema for common product fields
export const baseProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  // Category validation is now simpler as the UI will enforce selection from a dynamic list.
  // We just ensure it's not an empty string.
  category: z.string().min(1, 'Please select a category'),
  barcode: z.string().min(1, 'Barcode is required'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// Schema for standard products (without discounts)
export const standardProductSchema = baseProductSchema.extend({
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
});

// Schema for discounted products
export const discountedProductSchema = baseProductSchema.extend({
  originalPrice: z.coerce.number().min(0.01, 'Original price must be greater than 0'),
  price: z.coerce.number().min(0.01, 'Discounted price must be greater than 0'),
}).refine(data => data.price < data.originalPrice, {
  message: 'Discounted price must be less than the original price.',
  path: ['price'], // Set error path to the discounted price field
});

// Schema for editing products
export const productEditSchema = baseProductSchema.extend({
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  // originalPrice is optional. If it's provided, it must be a valid number.
  originalPrice: z.union([z.coerce.number().min(0.01), z.literal(""), z.null()]).optional()
  .transform(e => e === "" || e === null ? undefined : e),
}).refine(data => {
    // Only validate this rule if an originalPrice is actually provided and is a number.
    if (data.originalPrice && typeof data.originalPrice === 'number') {
        return data.price < data.originalPrice;
    }
    // If originalPrice is not set, this rule does not apply.
    return true;
}, {
    message: 'Current price must be less than the original price.',
    path: ['price'],
});


export type StandardProductFormValues = z.infer<typeof standardProductSchema>;
export type DiscountedProductFormValues = z.infer<typeof discountedProductSchema>;
export type ProductEditFormValues = z.infer<typeof productEditSchema>;
