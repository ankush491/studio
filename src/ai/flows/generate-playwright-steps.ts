'use server';

/**
 * @fileOverview This flow translates a user prompt into a sequence of Playwright steps.
 *
 * - generatePlaywrightSteps - A function that creates a list of Playwright actions.
 * - GeneratePlaywrightStepsInput - The input type for the function.
 * - GeneratePlaywrightStepsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlaywrightStepSchema = z.object({
  command: z.enum(['goto', 'click', 'fill', 'waitForNavigation']).describe('The Playwright command to execute.'),
  selector: z.string().optional().describe('The CSS selector for the target element.'),
  value: z.string().optional().describe('The value for the command (e.g., URL for goto, text for fill).'),
  description: z.string().describe('A human-readable description of the step.'),
});
export type PlaywrightStep = z.infer<typeof PlaywrightStepSchema>;

const GeneratePlaywrightStepsInputSchema = z.object({
  url: z.string().describe('The URL of the website to test.'),
  prompt: z.string().describe('The user\'s testing instructions in natural language.'),
  username: z.string().optional().describe('The username for login, if provided.'),
  password: z.string().optional().describe('The password for login, if provided.'),
});
export type GeneratePlaywrightStepsInput = z.infer<typeof GeneratePlaywrightStepsInputSchema>;

const GeneratePlaywrightStepsOutputSchema = z.object({
  steps: z.array(PlaywrightStepSchema).describe('An array of Playwright steps to be executed.'),
});
export type GeneratePlaywrightStepsOutput = z.infer<typeof GeneratePlaywrightStepsOutputSchema>;

export async function generatePlaywrightSteps(input: GeneratePlaywrightStepsInput): Promise<GeneratePlaywrightStepsOutput> {
  return generatePlaywrightStepsFlow(input);
}

const generatePlaywrightStepsPrompt = ai.definePrompt({
  name: 'generatePlaywrightStepsPrompt',
  input: { schema: GeneratePlaywrightStepsInputSchema },
  output: { schema: GeneratePlaywrightStepsOutputSchema },
  prompt: `You are an expert at converting natural language instructions into executable Playwright test steps.

  Based on the provided URL, prompt, and credentials, generate a sequence of Playwright commands.
  
  Instructions:
  1. Start with a 'goto' command for the initial URL.
  2. Use 'click', 'fill' for interactions. Use 'waitForNavigation' after actions that cause a page load (like login clicks).
  3. The selectors should be specific and robust. Prefer IDs, then data-testid attributes, then other specific attributes.
  4. For login, use the provided username and password. If the password is not provided, do not attempt to fill it.
  5. Provide a clear, human-readable description for each step.

  Website URL: {{{url}}}
  User Prompt: {{{prompt}}}
  {{#if username}}Username: {{{username}}}{{/if}}
  {{#if password}}Password: [provided]{{/if}}
  
  Generate the Playwright steps now.`,
});

const generatePlaywrightStepsFlow = ai.defineFlow(
  {
    name: 'generatePlaywrightStepsFlow',
    inputSchema: GeneratePlaywrightStepsInputSchema,
    outputSchema: GeneratePlaywrightStepsOutputSchema,
  },
  async (input) => {
    const { output } = await generatePlaywrightStepsPrompt(input);
    return output!;
  }
);
