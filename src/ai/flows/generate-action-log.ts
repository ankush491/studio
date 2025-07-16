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
  actionDescription: z.string().describe('Description of action performed during the website test, including its success or failure.'),
});
export type GenerateActionLogInput = z.infer<typeof GenerateActionLogInputSchema>;

const GenerateActionLogOutputSchema = z.object({
  actionLog: z.string().describe('A single, timestamped log entry for an action performed during the test.'),
});
export type GenerateActionLogOutput = z.infer<typeof GenerateActionLogOutputSchema>;

export async function generateActionLog(input: GenerateActionLogInput): Promise<GenerateActionLogOutput> {
  return generateActionLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionLogPrompt',
  input: { schema: GenerateActionLogInputSchema },
  output: { schema: GenerateActionLogOutputSchema },
  prompt: `You are an AI agent creating a single, timestamped log entry for a website test.
  
  The current time is {{currentDate}}.
  
  Based on the action description, format it as a single JSON log entry with a timestamp, event type, and details.

  Action Description: {{{actionDescription}}}

  Format the output as a single line of a JSON object. For example:
  {"timestamp": "{{currentDate}}", "event": "Click", "details": "Clicked on the login button"}
  `,
});


const generateActionLogFlow = ai.defineFlow(
  {
    name: 'generateActionLogFlow',
    inputSchema: GenerateActionLogInputSchema,
    outputSchema: GenerateActionLogOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
        ...input,
        currentDate: new Date().toISOString(),
    });
    return { actionLog: output!.actionLog };
  }
);
