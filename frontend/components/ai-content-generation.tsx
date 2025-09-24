"use client";

import { useEffect, useState } from "react";
import { startUserContextPrefetch } from "@/lib/prefetch";
import ReactMarkdown from "react-markdown";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useUserPlan } from "@/hooks/use-user-plan";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  FileText,
  BookOpen,
  PenTool,
  Brain,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  MessageSquare,
  List,
  Hash,
  CheckCircle,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";

// Theme support
import { useTheme } from "next-themes";

// Turndown for HTML to Markdown conversion
import TurndownService from "turndown";

// Initialize turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Function to convert HTML to Markdown
const htmlToMarkdown = (html: string) => {
  if (!html || typeof html !== 'string') return '';
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html; // Fallback to original HTML if conversion fails
  }
};

// Custom dark mode styles for Kendo Editor
const darkModeStyles = `
  .k-editor.k-dark .k-editor-toolbar {
    background-color: #1e293b !important;
    border-color: #334155 !important;
  }
  .k-editor.k-dark .k-editor-toolbar .k-button {
    background-color: #1e293b !important;
    color: #e6eef8 !important;
    border-color: #334155 !important;
  }
  .k-editor.k-dark .k-editor-toolbar .k-button:hover {
    background-color: #334155 !important;
  }
  .k-editor.k-dark .k-editor-content {
    background-color: #0f172a !important;
    color: #e6eef8 !important;
    border-color: #334155 !important;
  }
  .k-editor.k-dark .k-editor-content .ProseMirror {
    background-color: #0f172a !important;
    color: #e6eef8 !important;
  }
  .k-editor.k-dark .k-editor-content .ProseMirror p {
    color: #e6eef8 !important;
  }
  .k-editor.k-dark .k-popup {
    background-color: #1e293b !important;
    border-color: #334155 !important;
  }
  .k-editor.k-dark .k-list-item {
    color: #e6eef8 !important;
  }
  .k-editor.k-dark .k-list-item:hover {
    background-color: #334155 !important;
  }
`;

// Kendo Editor imports
import { Editor, EditorTools } from "@progress/kendo-react-editor";
import "@progress/kendo-theme-default/dist/all.css";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Card,
} from "./ui/card";
const {
  Bold,
  Italic,
  Underline,
  OrderedList,
  UnorderedList,
  InsertImage,
  InsertTable,
  ViewHtml,
  Undo,
  Redo,
} = EditorTools;

export function AiContentGeneration() {
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // Use undefined for no selection to avoid Select.Item empty-string runtime error
  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [topic, setTopic] = useState("");
  const [requirements, setRequirements] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [tone, setTone] = useState("");

  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [isContentSaved, setIsContentSaved] = useState(false);

  const contentTypes = [
    { value: "essay", label: "Essay", icon: FileText },
    { value: "summary", label: "Summary", icon: List },
    { value: "outline", label: "Outline", icon: Hash },
    { value: "flashcards", label: "Flashcards", icon: BookOpen },
    { value: "quiz", label: "Quiz Questions", icon: MessageSquare },
    { value: "notes", label: "Study Notes", icon: PenTool },
  ];

  const { user } = useConvexUser();
  const { planInfo } = useUserPlan();
  const todaysCount = useQuery(
    api.aiContent.countAiContentToday,
    user ? { userId: user.clerkId, refreshKey: lastSaveTime } : "skip"
  );
  const planLimit = ((planInfo?.limits as any)?.[
    FeatureFlag.AI_CONTENT_GENERATION
  ] ?? 25) as number;
  const generations = useQuery(
    api.aiContent.getAiContentByUser,
    user
      ? { userId: user.clerkId, limit: 10, refreshKey: lastSaveTime }
      : "skip"
  );
  const saveAiContent = useMutation(api.aiContent.createAiContent);
  const updateAiContent = useMutation(api.aiContent.updateAiContent);
  const { theme } = useTheme();
  const [userContextPrefetch, setUserContextPrefetch] = useState<any | null>(
    null
  );

  // Inject dark mode styles
  useEffect(() => {
    if (typeof document === "undefined") return; // SSR safety check

    if (theme === "dark") {
      const styleId = "kendo-editor-dark-styles";
      let styleElement = document.getElementById(styleId);

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = darkModeStyles;
    } else {
      const styleElement = document.getElementById("kendo-editor-dark-styles");
      if (styleElement) {
        styleElement.remove();
      }
    }

    return () => {
      if (typeof document === "undefined") return;
      const styleElement = document.getElementById("kendo-editor-dark-styles");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let stop: (() => void) | undefined;

    const onUpdate = (data: any) => {
      if (!mounted) return;
      setUserContextPrefetch(data);
    };

    (async () => {
      stop = await startUserContextPrefetch(user.clerkId, onUpdate, 300_000);
    })();

    return () => {
      mounted = false;
      if (stop) stop();
    };
  }, [user]);

  const getTypeIcon = (type: string) => {
    const typeData = contentTypes.find((t) => t.value === type);
    return typeData ? typeData.icon : FileText;
  };

  // Normalize potential JSON/string-wrapped AI output for markdown rendering
  const normalizeMarkdown = (src: any) => {
    if (!src) return "";
    let text = src;
    if (typeof text === "object") {
      try {
        text = JSON.stringify(text, null, 2);
      } catch (e) {
        text = String(text);
      }
    }
    if (typeof text === "string") {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === "string") text = parsed;
        else if (typeof parsed === "object")
          text = JSON.stringify(parsed, null, 2);
      } catch (e) {}
      text = text.replace(/^```(?:\w+)?\n?/i, "").replace(/```$/i, "");
      // Remove common leading indentation to avoid markdown becoming fenced code
      const lines = text.split("\n");
      let minIndent = Infinity;
      for (const line of lines) {
        if (!line.trim()) continue;
        const m = line.match(/^\s*/);
        if (m) minIndent = Math.min(minIndent, m[0].length);
      }
      if (minIndent !== Infinity && minIndent > 0) {
        text = lines.map((l: string) => l.slice(minIndent)).join("\n");
      }
      text = text.replace(/^\s*\n+/, "").replace(/\n+\s*$/, "");
    }
    return String(text).trim();
  };

  // local legacy toast removed; use Sonner `sonnerToast`

  const safeText = (t: any) => (t == null ? "" : String(t));

  // Function to render content as HTML or Markdown
  const renderContent = (content: string) => {
    const normalized = normalizeMarkdown(content);
    // Check if content contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(normalized)) {
      // Render as HTML
      return (
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: normalized }}
        />
      );
    } else {
      // Render as Markdown
      return (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{normalized}</ReactMarkdown>
        </div>
      );
    }
  };

  // Simple Markdown to HTML converter for editor
  const markdownToHtml = (markdown: string) => {
    if (!markdown) return "";
    // Basic conversions
    let html = markdown
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    if (!html.startsWith("<p>")) html = "<p>" + html;
    if (!html.endsWith("</p>")) html = html + "</p>";
    return html;
  };

  const handleCopy = async (text: string) => {
    const payload = safeText(text);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement("textarea");
        // Ensure the textarea doesn't affect layout and is selectable
        ta.value = payload;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.width = "1px";
        ta.style.height = "1px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        // Fallback for some browsers
        ta.setSelectionRange(0, payload.length);
        document.execCommand("copy");
        ta.remove();
      }
      // Use sonner toaster for visible feedback
      sonnerToast.success("Copied to clipboard");
    } catch (e) {
      console.error("Copy failed", e);
      sonnerToast.error("Unable to copy to clipboard");
    }
  };

  const handleDownload = (text: string, filename?: string) => {
    const payload = safeText(text);
    try {
      const blob = new Blob([payload], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `ai-content-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      sonnerToast.success(`Saved ${a.download}`);
    } catch (e) {
      console.error("Download failed", e);
      sonnerToast.error("Unable to save file");
    }
  };

  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const handleView = (text: string, title?: string) => {
    const payload = safeText(text);
    try {
      const w = window.open("", "_blank");
      if (!w) {
        sonnerToast.error("Unable to open new window");
        return;
      }
      const html = `<html><head><title>${
        title || "Generated Content"
      }</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0b1220;color:#e6eef8;font-family:monospace;white-space:pre-wrap;padding:16px;">${escapeHtml(
        payload
      )}</body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error("View failed", e);
      sonnerToast.error("Unable to open content");
    }
  };

  const handleGenerate = async () => {
    // Compose a prompt from the form fields
    const composed = requirements.trim()
      ? requirements.trim()
      : topic.trim()
      ? `Write a ${selectedType || "piece"} about: ${topic.trim()}`
      : "";

    if (!composed) return;

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const contextPayload = userContextPrefetch ?? {};

      const res = await fetch("/api/ai-content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/stream" },
        body: JSON.stringify({
          prompt: composed,
          contentType: selectedType,
          options: {
            wordCount: wordCount ? parseInt(wordCount) : undefined,
            tone: tone || undefined,
          },
          userId: user?.clerkId,
          context: JSON.stringify(contextPayload),
        }),
      });

      if (!res.ok) {
        // Try to read json error if available
        let errBody = {};
        try {
          errBody = await res.json();
        } catch {}
        throw new Error((errBody as any).error || `Status ${res.status}`);
      }

      // Stream the response body and append to generatedContent as chunks arrive
      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setGeneratedContent(text || "");
        return;
      }

      const decoder = new TextDecoder();
      setGeneratedContent("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setGeneratedContent((prev) => prev + chunk);
      }
    } catch (e: any) {
      console.error("Failed to generate content:", e);
      setGeneratedContent(
        "Failed to generate content. Please try again later."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedContent) {
      const normalized = normalizeMarkdown(generatedContent);
      if (/<[a-z][\s\S]*>/i.test(normalized)) {
        setEditedContent(normalized); // Already HTML
      } else {
        setEditedContent(markdownToHtml(normalized)); // Convert Markdown to HTML
      }
      setIsContentSaved(false);
      setCurrentContentId(null);
    }
  }, [generatedContent]);

  return (
    <LockedFeature
      feature={FeatureFlag.AI_CONTENT_GENERATION}
      title="AI Content Generation"
      description="Generate essays, summaries, outlines, and study materials with AI assistance."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            AI Content Generation
          </h2>
          <p className="text-muted-foreground">
            Create high-quality academic content with AI assistance.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Content Generator
                  </CardTitle>
                  <CardDescription>
                    Describe what you need and let AI create it for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic/Subject</Label>
                    <Input
                      value={topic}
                      onChange={(e) =>
                        setTopic((e.target as HTMLInputElement).value)
                      }
                      placeholder="e.g., Introduction to Machine Learning"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      Requirements & Instructions
                    </Label>
                    <Textarea
                      value={requirements}
                      onChange={(e) =>
                        setRequirements((e.target as HTMLTextAreaElement).value)
                      }
                      placeholder="Describe what you need: length, style, key points to cover, etc."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="word-count">Target Word Count</Label>
                      <Input
                        value={wordCount}
                        onChange={(e) =>
                          setWordCount((e.target as HTMLInputElement).value)
                        }
                        placeholder="e.g., 1000"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic.trim() || !selectedType}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>

                  {/* Remaining generations badge (uses Convex count of today's ai_content) */}
                  {typeof todaysCount === "number" && (
                    <div className="text-center">
                      <Badge variant="outline">
                        {Math.max(planLimit - todaysCount, 0)} generations
                        remaining today
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Content</CardTitle>
                  <CardDescription>
                    Your AI-generated content will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">
                            Generated Content
                          </h3>
                          {isContentSaved && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                          >
                            <PenTool className="w-4 h-4 mr-2" />
                            {isEditing ? "View" : "Edit"}
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4">
                          <Editor
                            tools={[
                              [Bold, Italic, Underline],
                              [Undo, Redo],
                              [OrderedList, UnorderedList],
                              [InsertImage, InsertTable],
                              [ViewHtml],
                            ]}
                            contentStyle={{
                              height: 400,
                              backgroundColor:
                                theme === "dark" ? "#0f172a" : "#ffffff",
                              color: theme === "dark" ? "#e6eef8" : "#000000",
                            }}
                            defaultEditMode="div"
                            value={editedContent}
                            className={theme === "dark" ? "k-dark" : ""}
                            onChange={(event) => {
                              setEditedContent(event.html || "");
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={async () => {
                                try {
                                  const generateTitle = () => {
                                    if (topic.trim()) return topic.trim();
                                    if (selectedType) {
                                      const typeLabel =
                                        contentTypes.find(
                                          (t) => t.value === selectedType
                                        )?.label || selectedType;
                                      return `${typeLabel} - ${new Date().toLocaleDateString()}`;
                                    }
                                    return `AI Content - ${new Date().toLocaleDateString()}`;
                                  };

                                  const contentTitle = generateTitle();

                                  if (currentContentId) {
                                    await updateAiContent({
                                      id: currentContentId as any,
                                      title: contentTitle,
                                      contentType: selectedType,
                                      prompt: requirements || topic,
                                      generatedText: htmlToMarkdown(editedContent),
                                      model: "gemini-1.5-flash",
                                      visibility: "private",
                                    });
                                  } else {
                                    let existingContentId = null;
                                    if (
                                      generations &&
                                      Array.isArray(generations)
                                    ) {
                                      const currentOptions = {
                                        wordCount: wordCount
                                          ? parseInt(wordCount)
                                          : undefined,
                                        tone: tone || undefined,
                                      };
                                      const optionsString =
                                        JSON.stringify(currentOptions);

                                      const existing = generations.find((g) => {
                                        const isSamePrompt =
                                          g.prompt === (requirements || topic);
                                        const isSameContentType =
                                          g.contentType === selectedType;

                                        let isSameOptions = false;
                                        if (
                                          g.metadata &&
                                          g.metadata.rawOptions
                                        ) {
                                          try {
                                            const savedOptions = JSON.parse(
                                              g.metadata.rawOptions
                                            );
                                            isSameOptions =
                                              JSON.stringify(savedOptions) ===
                                              optionsString;
                                          } catch (e) {
                                            // If parsing fails, consider options different
                                            isSameOptions = false;
                                          }
                                        } else if (!wordCount && !tone) {
                                          // If no options specified and no saved options, consider them the same
                                          isSameOptions = true;
                                        }

                                        return (
                                          isSamePrompt &&
                                          isSameContentType &&
                                          isSameOptions
                                        );
                                      });

                                      if (existing) {
                                        existingContentId = existing._id;
                                      }
                                    }

                                    if (existingContentId) {
                                      console.log(
                                        "Updating existing content with same prompt:",
                                        existingContentId
                                      );

                                      await updateAiContent({
                                        id: existingContentId as any,
                                        title: contentTitle,
                                        contentType: selectedType,
                                        prompt: requirements || topic,
                                        generatedText: htmlToMarkdown(editedContent),
                                        model: "gemini-1.5-flash",
                                        visibility: "private",
                                      });
                                      setCurrentContentId(existingContentId);
                                    } else {
                                      const newId = await saveAiContent({
                                        userId: user?.clerkId || "",
                                        title: contentTitle,
                                        contentType: selectedType,
                                        prompt: requirements || topic,
                                        generatedText: htmlToMarkdown(editedContent),
                                        model: "gemini-1.5-flash",
                                        visibility: "private",
                                      });
                                      setCurrentContentId(newId);
                                    }
                                  }

                                  sonnerToast.success(
                                    "Content saved successfully!"
                                  );
                                  setIsEditing(false);

                                  // Update the displayed content to show the saved version
                                  setGeneratedContent(htmlToMarkdown(editedContent));

                                  // Mark content as saved
                                  setIsContentSaved(true);

                                  // Force refresh of generations query by updating timestamp
                                  setLastSaveTime(Date.now());
                                } catch (error) {
                                  console.error("Save failed:", error);
                                  sonnerToast.error("Failed to save content");
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const normalized =
                                  normalizeMarkdown(generatedContent);
                                if (/<[a-z][\s\S]*>/i.test(normalized)) {
                                  setEditedContent(normalized); // Already HTML
                                } else {
                                  setEditedContent(markdownToHtml(normalized)); // Convert Markdown to HTML
                                }
                                setIsEditing(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg p-4 max-h-96 overflow-y-auto">
                          {renderContent(generatedContent)}
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              handleCopy(normalizeMarkdown(generatedContent))
                            }
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              handleDownload(
                                generatedContent,
                                `${(selectedType || "generated").replace(
                                  /\s+/g,
                                  "-"
                                )}-${Date.now()}.md`
                              )
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Word count:{" "}
                          {
                            normalizeMarkdown(generatedContent)
                              .split(/\s+/)
                              .filter(Boolean).length
                          }
                        </span>
                        <span>
                          {isContentSaved
                            ? `Saved ${
                                lastSaveTime
                                  ? new Date(lastSaveTime).toLocaleTimeString()
                                  : "recently"
                              }`
                            : "Generated just now"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Ready to Generate
                      </h3>
                      <p className="text-muted-foreground">
                        Fill out the form and click generate to create your
                        content
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generation History</h3>
              <div className="flex gap-2">
                <Input placeholder="Search history..." className="w-64" />
                <Button variant="outline">Filter</Button>
              </div>
            </div>

            <div className="space-y-4">
              {!generations || generations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No history available
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't generated any content yet. Create something in
                    the Generate tab to save it here.
                  </p>
                </div>
              ) : (
                (generations || []).map((generation: any) => {
                  const IconComponent = getTypeIcon(
                    generation.contentType || ""
                  );
                  const title =
                    generation.title ||
                    (generation.contentType
                      ? generation.contentType
                      : "Generated");
                  const wordCount = generation.generatedText
                    ? generation.generatedText.split(/\s+/).filter(Boolean)
                        .length
                    : 0;
                  const createdAt = generation.createdAt
                    ? new Date(generation.createdAt).toLocaleString()
                    : "-";
                  return (
                    <Card key={generation._id || generation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {IconComponent ? (
                                <IconComponent className="w-5 h-5 text-primary-foreground" />
                              ) : (
                                <FileText className="w-5 h-5 text-primary-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{title}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span>{wordCount} words</span>
                                <span>•</span>
                                <span>{createdAt}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleView(
                                  generation.generatedText,
                                  generation.title
                                )
                              }
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(
                                  normalizeMarkdown(generation.generatedText)
                                )
                              }
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownload(
                                  generation.generatedText,
                                  `${(
                                    generation.title ||
                                    generation.contentType ||
                                    "generation"
                                  ).replace(/\s+/g, "-")}-${new Date(
                                    generation.createdAt
                                  ).getTime()}.md`
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardContent>
                        <div className="p-4">
                          {renderContent(generation.generatedText)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}
