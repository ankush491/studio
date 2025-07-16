'use server';

/**
 * @fileOverview This flow generates a detailed action log during the test.
 *
 * - generateActionLog - A function that generates the action log.
 * - GenerateActionLogInput - The input type for the generateActionLog function.
 * - GenerateActionLogOutput - The return type for the generateActionLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionLogInputSchema = z.object({
  url: z.string().describe('The URL of the website being tested.'),
  prompt: z.string().describe('The testing prompt provided by the user.'),
  actionDescription: z.string().describe('Description of action performed during the website test.'),
});
export type GenerateActionLogInput = z.infer<typeof GenerateActionLogInputSchema>;

const GenerateActionLogOutputSchema = z.object({
  actionLog: z.string().describe('A detailed log of actions performed during the test.'),
});
export type GenerateActionLogOutput = z.infer<typeof GenerateActionLogOutputSchema>;

export async function generateActionLog(input: GenerateActionLogInput): Promise<GenerateActionLogOutput> {
  return generateActionLogFlow(input);
}

const generateActionLogPrompt = ai.definePrompt({
  name: 'generateActionLogPrompt',
  input: {schema: GenerateActionLogInputSchema},
  output: {schema: GenerateActionLogOutputSchema},
  prompt: `You are an AI agent generating a detailed action log for website testing.

  Based on the user's prompt, the website URL, and the action description, create a comprehensive action log.

  User Prompt: {{{prompt}}}
  Website URL: {{{url}}}
  Action Description: {{{actionDescription}}}

  Action Log:`, // Prompt should describe how to create an action log, incorporating the action description.
});

const generateActionLogFlow = ai.defineFlow(
  {
    name: 'generateActionLogFlow',
    inputSchema: GenerateActionLogInputSchema,
    outputSchema: GenerateActionLogOutputSchema,
  },
  async input => {
    const {output} = await generateActionLogPrompt(input);
    return output!;
  }
);
