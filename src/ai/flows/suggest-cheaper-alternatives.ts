
'use server';
/**
 * @fileOverview An AI agent that suggests cheaper alternatives to items in a cart.
 *
 * - suggestCheaperAlternatives - A function that suggests cheaper alternatives for items in a cart.
 * - SuggestCheaperAlternativesInput - The input type for the suggestCheaperAlternatives function.
 * - SuggestCheaperAlternativesOutput - The return type for the suggestCheaperAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Product, CartItem } from '@/types';

const ProductSchema = z.object({
    id: z.string(),
    name: z.string().describe('The name of the product.'),
    price: z.number().describe('The price of the product.'),
    originalPrice: z.number().optional().nullable().describe('The original price before any discount.'),
    description: z.string().optional().nullable().describe('A description of the product.'),
    brand: z.string().describe("The brand of the product."),
    category: z.string().describe("The product category (e.g., 'Snacks & Beverages')."),
    barcode: z.string(),
    imageUrl: z.string().optional().nullable(),
});

const CartItemSchema = ProductSchema.extend({
    quantity: z.number(),
});


const SuggestCheaperAlternativesInputSchema = z.object({
  cartItems: z.array(CartItemSchema).describe('The items currently in the user\'s cart.'),
  availableProducts: z.array(ProductSchema)
  .describe('A list of available products with their prices and descriptions.'),
});
export type SuggestCheaperAlternativesInput = z.infer<typeof SuggestCheaperAlternativesInputSchema>;

const SuggestCheaperAlternativesOutputSchema = z.array(
  z.object({
    originalItemName: z.string().describe('The name of the original item in the cart.'),
    suggestedAlternative: ProductSchema.describe('The full details of the suggested cheaper alternative product.'),
    reason: z.string().describe('The reason why the suggested alternative is a good replacement.'),
  })
).describe('A list of suggested cheaper alternatives for items in the cart.');
export type SuggestCheaperAlternativesOutput = z.infer<typeof SuggestCheaperAlternativesOutputSchema>;

export async function suggestCheaperAlternatives(
  input: SuggestCheaperAlternativesInput
): Promise<SuggestCheaperAlternativesOutput> {
  // If cart is empty, no need to call the AI.
  if (input.cartItems.length === 0) {
    return [];
  }
  // Filter available products to only include items from the same categories as cart items, plus potential alternatives.
  const cartCategories = new Set(input.cartItems.map(item => item.category));
  const relevantProducts = input.availableProducts.filter(p => cartCategories.has(p.category));

  return suggestCheaperAlternativesFlow({
    cartItems: input.cartItems,
    availableProducts: relevantProducts, // Pass a more focused list to the AI
  });
}

const prompt = ai.definePrompt({
  name: 'suggestCheaperAlternativesPrompt',
  input: {schema: SuggestCheaperAlternativesInputSchema},
  output: {schema: SuggestCheaperAlternativesOutputSchema},
  prompt: `You are a helpful shopping assistant dedicated to helping users save money. Your task is to suggest cheaper alternatives for items in a user's shopping cart, but only from within the same category.

You are provided with a list of items in the user's cart and a list of available products.

For each item in the cart, you must find a cheaper alternative from the available products list. A good alternative must be genuinely similar in type and function to the original item and belong to the SAME category.

Cart Items:
{{#each cartItems}}
- Name: {{this.name}}, Price: ₹{{this.price}}, Category: {{this.category}}
{{/each}}

Available Products:
{{#each availableProducts}}
- Name: {{this.name}}, Price: ₹{{this.price}}, Brand: {{this.brand}}, Category: {{this.category}}, Description: {{this.description}}
{{/each}}

Your response must be a list of suggested cheaper alternatives. For each suggestion, you must include:
1. The name of the original item from the cart.
2. The complete details of the suggested cheaper alternative product.
3. A brief, compelling reason explaining why the suggested item is a good replacement (e.g., "Saves you ₹20 for a similar biscuit" or "A popular instant coffee that's ₹15 cheaper").

IMPORTANT:
- Only suggest an alternative if it is STRICTLY CHEAPER than the original item.
- Ensure the suggested alternative is from the EXACT SAME CATEGORY as the original item.
- If no suitable and cheaper alternative is found for an item, do not include it in your output.
- If no cheaper alternatives are found for ANY of the cart items, return an empty list.
`,
});

const suggestCheaperAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestCheaperAlternativesFlow',
    inputSchema: SuggestCheaperAlternativesInputSchema,
    outputSchema: SuggestCheaperAlternativesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
