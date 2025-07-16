'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a comprehensive testing report.
 *
 * - generateTestingReport - A function that generates a testing report based on the provided context and action logs.
 * - GenerateTestingReportInput - The input type for the generateTestingReport function.
 * - GenerateTestingReportOutput - The return type for the generateTestingReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestingReportInputSchema = z.object({
  url: z.string().describe('The URL of the website that was tested.'),
  prompt: z.string().describe('The testing prompt that was used.'),
  actionLogs: z.string().describe('The action logs generated during the testing process.'),
});
export type GenerateTestingReportInput = z.infer<typeof GenerateTestingReportInputSchema>;

const GenerateTestingReportOutputSchema = z.object({
  report: z.string().describe('A comprehensive testing report highlighting issues and steps to reproduce them.'),
});
export type GenerateTestingReportOutput = z.infer<typeof GenerateTestingReportOutputSchema>;

export async function generateTestingReport(input: GenerateTestingReportInput): Promise<GenerateTestingReportOutput> {
  return generateTestingReportFlow(input);
}

const generateTestingReportPrompt = ai.definePrompt({
  name: 'generateTestingReportPrompt',
  input: {schema: GenerateTestingReportInputSchema},
  output: {schema: GenerateTestingReportOutputSchema},
  prompt: `You are an AI testing agent. Based on the following information, generate a comprehensive testing report:

URL: {{{url}}}
Prompt: {{{prompt}}}
Action Logs: {{{actionLogs}}}

Highlight any issues encountered during the testing process and provide clear steps to reproduce them. The report should be detailed and easy to understand for developers. Focus on extracting failure conditions from the action logs.`,
});

const generateTestingReportFlow = ai.defineFlow(
  {
    name: 'generateTestingReportFlow',
    inputSchema: GenerateTestingReportInputSchema,
    outputSchema: GenerateTestingReportOutputSchema,
  },
  async input => {
    const {output} = await generateTestingReportPrompt(input);
    return output!;
  }
);
