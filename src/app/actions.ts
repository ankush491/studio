"use server";

import { z } from "zod";
import {
  generateActionLog,
  GenerateActionLogInput,
} from "@/ai/flows/generate-action-log";
import {
  generateTestingReport,
  GenerateTestingReportInput,
} from "@/ai/flows/generate-testing-report";

const formSchema = z.object({
  url: z.string().url(),
  prompt: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export async function runTest(values: FormValues): Promise<{
  success: boolean;
  actionLog?: string;
  report?: string;
  error?: string;
}> {
  const validation = formSchema.safeParse(values);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input data.",
    };
  }

  const { url, prompt, username } = validation.data;

  try {
    // 1. Simulate the "PlaywrightMCP" action description.
    // In a real application, this would come from the output of an automation tool.
    const actionDescription = `The testing agent initiated a session for the URL: ${url}. 
${
  username
    ? `The agent attempted to log in using the username "${username}". `
    : ""
}The agent then proceeded to execute the test based on the user's prompt: "${prompt}". 
The automated script navigated through the website, clicked on specified elements, filled out forms where necessary, and checked for visible errors or broken functionality. All interactions were logged.`;

    // 2. Generate the detailed action log using the first AI flow.
    const actionLogInput: GenerateActionLogInput = {
      url,
      prompt,
      actionDescription,
    };
    const actionLogOutput = await generateActionLog(actionLogInput);
    const actionLog = actionLogOutput.actionLog;

    if (!actionLog) {
      throw new Error("Failed to generate action log.");
    }

    // 3. Generate the final testing report using the second AI flow.
    const testingReportInput: GenerateTestingReportInput = {
      url,
      prompt,
      actionLogs: actionLog,
    };
    const testingReportOutput = await generateTestingReport(testingReportInput);
    const report = testingReportOutput.report;

    if (!report) {
      throw new Error("Failed to generate testing report.");
    }

    return {
      success: true,
      actionLog,
      report,
    };
  } catch (error) {
    console.error("Error during test execution:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during the test.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
