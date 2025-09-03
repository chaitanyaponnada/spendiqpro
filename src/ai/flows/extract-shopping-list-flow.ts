
'use server';
/**
 * @fileOverview An AI agent that extracts items from a shopping list image.
 *
 * - extractShoppingList - A function that handles the shopping list extraction process.
 * - ExtractShoppingListInput - The input type for the extractShoppingList function.
 * - ExtractShoppingListOutput - The return type for the extractShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractShoppingListInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a shopping list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractShoppingListInput = z.infer<typeof ExtractShoppingListInputSchema>;

const ExtractShoppingListOutputSchema = z.object({
    items: z.array(z.string()).describe("A list of grocery or household items extracted from the image."),
});
export type ExtractShoppingListOutput = z.infer<typeof ExtractShoppingListOutputSchema>;

export async function extractShoppingList(input: ExtractShoppingListInput): Promise<ExtractShoppingListOutput> {
  return extractShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractShoppingListPrompt',
  input: {schema: ExtractShoppingListInputSchema},
  output: {schema: ExtractShoppingListOutputSchema},
  prompt: `You are an expert OCR system specializing in reading and interpreting shopping lists from images, including messy handwritten ones.

Analyze the provided image and identify all the grocery and household items listed. Your task is to extract only the names of the items themselves.

IMPORTANT RULES:
1.  Ignore all quantities, numbers, prices, brand names, or other notes.
2.  Do not include bullet points or numbering in the output strings.
3.  If an item is crossed out, ignore it.
4.  Correct any minor spelling mistakes to create a clean list.
5.  If the image does not appear to be a shopping list or is unreadable, return an empty list of items.

Return the extracted items as a simple JSON array of strings.

Image of shopping list: {{media url=photoDataUri}}`,
});

const extractShoppingListFlow = ai.defineFlow(
  {
    name: 'extractShoppingListFlow',
    inputSchema: ExtractShoppingListInputSchema,
    outputSchema: ExtractShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
