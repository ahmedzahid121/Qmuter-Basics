// src/ai/flows/evaluate-commute-similarity.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to evaluate the similarity between two commutes based on their origin and destination data.
 *
 * - evaluateCommuteSimilarity - A function that takes two commute descriptions and returns a similarity score.
 * - EvaluateCommuteSimilarityInput - The input type for the evaluateCommuteSimilarity function.
 * - EvaluateCommuteSimilarityOutput - The return type for the evaluateCommuteSimilarity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateCommuteSimilarityInputSchema = z.object({
  commute1Origin: z.string().describe('The origin address of the first commute.'),
  commute1Destination: z.string().describe('The destination address of the first commute.'),
  commute2Origin: z.string().describe('The origin address of the second commute.'),
  commute2Destination: z.string().describe('The destination address of the second commute.'),
});
export type EvaluateCommuteSimilarityInput = z.infer<typeof EvaluateCommuteSimilarityInputSchema>;

const EvaluateCommuteSimilarityOutputSchema = z.object({
  similarityScore: z
    .number()
    .describe(
      'A score between 0 and 1 indicating the similarity between the two commutes. 1 means identical, 0 means completely different.'
    ),
  explanation: z.string().describe('A brief explanation of why the two commutes are similar or dissimilar.'),
});
export type EvaluateCommuteSimilarityOutput = z.infer<typeof EvaluateCommuteSimilarityOutputSchema>;

export async function evaluateCommuteSimilarity(
  input: EvaluateCommuteSimilarityInput
): Promise<EvaluateCommuteSimilarityOutput> {
  return evaluateCommuteSimilarityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateCommuteSimilarityPrompt',
  input: {schema: EvaluateCommuteSimilarityInputSchema},
  output: {schema: EvaluateCommuteSimilarityOutputSchema},
  prompt: `You are an expert commute evaluator. You will receive the origin and destination of two commutes and will evaluate how similar they are, providing a similarity score between 0 and 1 and an explanation.

Commute 1 Origin: {{{commute1Origin}}}
Commute 1 Destination: {{{commute1Destination}}}
Commute 2 Origin: {{{commute2Origin}}}
Commute 2 Destination: {{{commute2Destination}}}

Consider factors such as:
- Proximity of origins and destinations
- Whether the commutes are in the same direction
- Whether the commutes likely share the same roads or highways

Based on your analysis, provide a similarityScore and explanation. Adhere to the output schema strictly.`,
});

const evaluateCommuteSimilarityFlow = ai.defineFlow(
  {
    name: 'evaluateCommuteSimilarityFlow',
    inputSchema: EvaluateCommuteSimilarityInputSchema,
    outputSchema: EvaluateCommuteSimilarityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
