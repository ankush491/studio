"use server";

import { z } from "zod";
import { chromium } from "playwright";
import {
  generatePlaywrightSteps,
  PlaywrightStep,
} from "@/ai/flows/generate-playwright-steps";
import {
  generateTestingReport,
  GenerateTestingReportInput,
} from "@/ai/flows/generate-testing-report";
import { generateActionLog } from "@/ai/flows/generate-action-log";

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

  const { url, prompt, username, password } = validation.data;
  let browser;
  const recordedActions: string[] = [];

  try {
    // 1. Generate Playwright steps from the user prompt
    const { steps } = await generatePlaywrightSteps({
      url,
      prompt,
      username,
      password,
    });

    if (!steps || steps.length === 0) {
      throw new Error("AI could not determine the testing steps.");
    }

    // 2. Execute Playwright steps
    browser = await chromium.launch({
      headless: false, // Launch in non-headless mode
      timeout: 60000, // Increase default timeout to 60 seconds
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const step of steps) {
      const actionDescription = await executePlaywrightStep(page, step);
      const logEntry = await generateActionLog({
        url,
        prompt,
        actionDescription,
      });
      recordedActions.push(logEntry.actionLog);
    }

    await browser.close();

    const fullActionLog = recordedActions.join("\n");

    // 3. Generate final testing report
    const testingReportInput: GenerateTestingReportInput = {
      url,
      prompt,
      actionLogs: fullActionLog,
    };
    const testingReportOutput = await generateTestingReport(testingReportInput);
    const report = testingReportOutput.report;

    if (!report) {
      throw new Error("Failed to generate testing report.");
    }

    return {
      success: true,
      actionLog: fullActionLog,
      report,
    };
  } catch (error) {
    console.error("Error during test execution:", error);
    if (browser) {
      await browser.close();
    }
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

async function executePlaywrightStep(
  page: any,
  step: PlaywrightStep
): Promise<string> {
  const { command, selector, value, description } = step;  
  const defaultTimeout = 60000; // 60 seconds

  try {
    switch (command) {
      case "goto":
        await page.goto(value, { timeout: defaultTimeout });
        break;
      case "click":
        if (selector) {
          // Wait for the element to be visible before clicking
          await page.waitForSelector(selector, { state: 'visible', timeout: defaultTimeout });
          await page.click(selector, { timeout: defaultTimeout });
        } else {
          throw new Error("Selector is required for click command.");
        }
        break;
      case "fill":
        if (selector && value !== undefined) {
          // Wait for the element to be visible before filling
          await page.waitForSelector(selector, { state: 'visible', timeout: defaultTimeout });
          await page.fill(selector, value, { timeout: defaultTimeout });
        } else {
          throw new Error("Selector and value are required for fill command.");
        }
        break;
      case "waitForNavigation":
        await page.waitForNavigation();
        break;
      default:
        throw new Error(`Unsupported Playwright command: ${command}`);
    }
    return `SUCCESS: ${description}`;
  } catch (e: any) {
    return `FAILURE: ${description}. Error: ${e.message}`;
  }
}
