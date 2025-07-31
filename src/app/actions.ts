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
import { write_file } from "@/lib/file-utils"; // Updated import path

const formSchema = z.object({
  url: z.string().url(),
  prompt: z.string(),
  // Removed username and password fields
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

  const { url, prompt } = validation.data; // Removed username and password
  let browser;
  const recordedActions: string[] = [];
  let reportContent: string | undefined;

  try {
    // 1. Generate Playwright steps from the user prompt
    const { steps } = await generatePlaywrightSteps({
      url,
      prompt,
      // Removed username and password
    });

    if (!steps || steps.length === 0) {
      throw new Error("AI could not determine the testing steps.");
    }

    // 2. Execute Playwright steps
    browser = await chromium.launch({
      headless: false, // Launch in non-headless mode
      timeout: 120000, // Increased default timeout to 120 seconds
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set a higher default timeout for page-level operations
    page.setDefaultTimeout(90000); // 90 seconds

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

    const fullActionLog = recordedActions.join(',');

    // 3. Generate final testing report
    const testingReportInput: GenerateTestingReportInput = {
      url,
      prompt,
      actionLogs: fullActionLog,
    };
    const testingReportOutput = await generateTestingReport(testingReportInput);
    reportContent = testingReportOutput.report;

    if (!reportContent) {
      throw new Error("Failed to generate testing report.");
    }

    // 4. Save the testing report to a file
    const reportFileName = `test-report-${Date.now()}.md`; // Generate a unique filename
    const reportFolderPath = "test_reports"; // Specify the folder to save reports
    const reportFilePath = `${reportFolderPath}/${reportFileName}`;

    // Ensure the report folder exists (you might need a separate step for this
    // in a real application, but for this example, we'll assume it exists or
    // write_file can create it).
    // You might need to use a tool to create the directory if write_file doesn't support it.

    const writeResult = await write_file(reportFilePath, reportContent);

    if (writeResult.status !== "succeeded") {
        console.error(`Failed to save report to ${reportFilePath}:`, writeResult.error);
        // Decide how to handle write failure -
        // still return success if test passed, but log the write error
    }


    return {
      success: true,
      actionLog: fullActionLog,
      report: reportContent,
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
  // Use page's default timeout unless overridden for a specific action
  // Playwright will use the default timeout set on the page
  // const stepTimeout = page.getDefaultTimeout(); // Removed

  try {
    switch (command) {
      case "goto":
        await page.goto(value, { waitUntil: 'domcontentloaded' });
        break;
      case "click":
        if (selector) {
          await page.waitForSelector(selector, { state: 'visible' });
           await page.locator(selector).click();
        } else {
          throw new Error("Selector is required for click command.");
        }
        break;
      case "fill":
        if (selector && value !== undefined) {
          await page.waitForSelector(selector, { state: 'visible' });
          await page.locator(selector).fill(value);
        } else {
          throw new Error("Selector and value are required for fill command.");
        }
        break;
      case "waitForNavigation":
         await page.waitForLoadState('load');
        break;
      default:
        throw new Error(`Unsupported Playwright command: ${command}`);
    }
    return `SUCCESS: ${description}`;
  } catch (e: any) {
    return `FAILURE: ${description}. Error: ${e.message}`;
  }
}
