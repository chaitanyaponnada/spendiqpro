
'use server';
/**
 * @fileOverview An AI agent that finds the best deals and discounted items.
 *
 * - findDeals - A function that finds the best deals from a list of products.
 * - FindDealsInput - The input type for the findDeals function.
 * - FindDealsOutput - The return type for the findDeals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Product } from '@/types';

const ProductSchema = z.object({
    id: z.string(),
    name: z.string().describe('The name of the product.'),
    price: z.number().describe('The current price of the product.'),
    originalPrice: z.number().optional().nullable().describe('The original price before any discount.'),
    description: z.string().optional().nullable().describe('A description of the product.'),
    brand: z.string().describe("The brand of the product."),
    category: z.string().describe("The product category (e.g., 'Snacks & Beverages')."),
    barcode: z.string(),
    imageUrl: z.string().optional().nullable(),
});

const FindDealsInputSchema = z.object({
  availableProducts: z.array(ProductSchema)
  .describe('A list of all available products, some of which may have discounts.'),
});
export type FindDealsInput = z.infer<typeof FindDealsInputSchema>;

const FindDealsOutputSchema = z.array(
  z.object({
    product: ProductSchema.describe('The full details of the discounted product.'),
    reason: z.string().describe('A compelling reason why this is a great deal (e.g., "Huge 50% discount!" or "Limited time offer").'),
  })
).describe('A curated list of the best deals and highest-discount items.');
export type FindDealsOutput = z.infer<typeof FindDealsOutputSchema>;

export async function findDeals(
  input: FindDealsInput
): Promise<FindDealsOutput> {
  // Augment the input with calculated discounts to help the AI
  const productsWithDiscounts = input.availableProducts
    .filter(p => p.originalPrice && p.originalPrice > p.price)
    .map(p => {
        const discountPercentage = Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100);
        return {
            ...p,
            category: p.category || 'Other', // Ensure category is always present
            description: `${p.description || ''} (Discount: ${discountPercentage}%)`
        };
    });

  if(productsWithDiscounts.length === 0) {
    return []; // No deals to find
  }

  return findDealsFlow({ availableProducts: productsWithDiscounts });
}

const prompt = ai.definePrompt({
  name: 'findDealsPrompt',
  input: {schema: FindDealsInputSchema},
  output: {schema: FindDealsOutputSchema},
  prompt: `You are a "SpendIQ Treasure Hunter", an expert at finding the most amazing deals for shoppers.
Your task is to identify the absolute best deals from a provided list of products that are currently on sale.

Look for products with the highest percentage discounts or the most significant savings.

Available Products on Sale:
{{#each availableProducts}}
- Name: {{this.name}}, Current Price: ₹{{this.price}}, Original Price: ₹{{this.originalPrice}}, Description: {{this.description}}
{{/each}}

Your response must be a list of the top 3-5 deals. For each deal, you must include:
1. The complete details of the product.
2. A short, exciting reason why this is a "SpendIQ Treasure" (e.g., "Massive 25% off!", "Rarely discounted item!", "Best price this month!").

Focus only on the most compelling offers. If there are many deals, pick only the best ones. If no deals are provided in the input, return an empty list.
`,
});

const findDealsFlow = ai.defineFlow(
  {
    name: 'findDealsFlow',
    inputSchema: FindDealsInputSchema,
    outputSchema: FindDealsOutputSchema,
  },
  async input => {
    if (!input.availableProducts || input.availableProducts.length === 0) {
        return [];
    }
    const {output} = await prompt(input);
    return output!;
  }
);
