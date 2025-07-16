"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClipboardList, FileText, FlaskConical, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { runTest } from "./actions";
import { Icons } from "@/components/icons";

const formSchema = z.object({
  url: z
    .string()
    .min(1, { message: "URL is required." })
    .url({ message: "Please enter a valid URL." }),
  prompt: z
    .string()
    .min(10, { message: "Prompt must be at least 10 characters." }),
  username: z.string().optional(),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TestResult = {
  actionLog: string;
  report: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<TestResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      prompt: "",
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await runTest(values);
      if (response.success) {
        setResult({
          actionLog: response.actionLog!,
          report: response.report!,
        });
        toast({
          title: "Test Complete",
          description: "Your test report has been generated.",
        });
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Gemini Ace Tester
        </h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Test Configuration</CardTitle>
              <CardDescription>
                Enter the details for your automated test.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Testing Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Test the login flow and then verify that the user can navigate to the dashboard."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Login Credentials (Optional)
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="testuser" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    Start Test
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          <div className="space-y-8">
            {isLoading ? (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Action Log</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[220px]" />
                    <Skeleton className="h-4 w-[180px]" />
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Testing Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                  </CardContent>
                </Card>
              </>
            ) : result ? (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-3">
                     <ClipboardList className="h-6 w-6 text-primary" />
                    <CardTitle>Action Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full rounded-md border bg-secondary/30 p-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground">
                        {result.actionLog}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-3">
                     <FileText className="h-6 w-6 text-primary" />
                    <CardTitle>Testing Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full rounded-md border bg-secondary/30 p-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground">
                        {result.report}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex h-full flex-col items-center justify-center py-12 shadow-lg">
                <CardContent className="text-center">
                  <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Awaiting Test Results
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your generated action log and report will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
