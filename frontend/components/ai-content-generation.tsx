"use client";

import { useEffect, useState } from "react";
import { startUserContextPrefetch } from "@/lib/prefetch";
import ReactMarkdown from "react-markdown";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useUserPlan } from "@/hooks/use-user-plan";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Crown,
  Wand2,
  MessageSquare,
  List,
  Hash,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Plus,
} from "lucide-react";
import { toast as sonnerToast } from 'sonner';

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

  const contentTypes = [
    { value: "essay", label: "Essay", icon: FileText },
    { value: "summary", label: "Summary", icon: List },
    { value: "outline", label: "Outline", icon: Hash },
    { value: "flashcards", label: "Flashcards", icon: BookOpen },
    { value: "quiz", label: "Quiz Questions", icon: MessageSquare },
    { value: "notes", label: "Study Notes", icon: PenTool },
  ];

  const { user } = useConvexUser();
  const { plan, planInfo } = useUserPlan();
  const todaysCount = useQuery(
    api.aiContent.countAiContentToday,
    user ? { userId: user.clerkId } : "skip"
  );
  const planLimit = ((planInfo?.limits as any)?.[FeatureFlag.AI_CONTENT_GENERATION] ?? 25) as number;
  const generations = useQuery(
    api.aiContent.getAiContentByUser,
    user ? { userId: user.clerkId, limit: 10 } : "skip"
  );
  const [userContextPrefetch, setUserContextPrefetch] = useState<any | null>(
    null
  );

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

  const templates = [
    {
      id: "1",
      name: "Research Paper",
      description: "Complete research paper with citations and bibliography",
      estimatedLength: "2000-3000 words",
      timeEstimate: "10-15 minutes",
    },
    {
      id: "2",
      name: "Lab Report",
      description: "Scientific lab report with methodology and analysis",
      estimatedLength: "1000-1500 words",
      timeEstimate: "8-12 minutes",
    },
    {
      id: "3",
      name: "Case Study Analysis",
      description: "Business or academic case study with recommendations",
      estimatedLength: "1500-2000 words",
      timeEstimate: "10-15 minutes",
    },
  ];

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

    const handleCopy = async (text: string) => {
      const payload = safeText(text);
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload);
        } else {
          const ta = document.createElement('textarea');
          // Ensure the textarea doesn't affect layout and is selectable
          ta.value = payload;
          ta.style.position = 'fixed';
          ta.style.top = '0';
          ta.style.left = '0';
          ta.style.width = '1px';
          ta.style.height = '1px';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          // Fallback for some browsers
          ta.setSelectionRange(0, payload.length);
          document.execCommand('copy');
          ta.remove();
        }
        // Use sonner toaster for visible feedback
        sonnerToast.success('Copied to clipboard');
      } catch (e) {
        console.error('Copy failed', e);
        sonnerToast.error('Unable to copy to clipboard');
      }
    };

    const handleDownload = (text: string, filename?: string) => {
      const payload = safeText(text);
      try {
        const blob = new Blob([payload], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `ai-content-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
  sonnerToast.success(`Saved ${a.download}`);
      } catch (e) {
        console.error('Download failed', e);
        sonnerToast.error('Unable to save file');
      }
    };

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const handleView = (text: string, title?: string) => {
      const payload = safeText(text);
      try {
        const w = window.open('', '_blank');
        if (!w) {
          sonnerToast.error('Unable to open new window');
          return;
        }
        const html = `<html><head><title>${title || 'Generated Content'}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0b1220;color:#e6eef8;font-family:monospace;white-space:pre-wrap;padding:16px;">${escapeHtml(payload)}</body></html>`;
        w.document.open();
        w.document.write(html);
        w.document.close();
      } catch (e) {
        console.error('View failed', e);
        sonnerToast.error('Unable to open content');
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
          options: { wordCount, tone },
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                        {Math.max(planLimit - todaysCount, 0)} generations remaining today
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
                      <div className="rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>
                            {normalizeMarkdown(generatedContent)}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCopy(normalizeMarkdown(generatedContent))}
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
                              `${(selectedType || "generated").replace(/\s+/g, "-")}-${Date.now()}.md`
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
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Word count: {normalizeMarkdown(generatedContent).split(/\s+/).filter(Boolean).length}</span>
                        <span>Generated just now</span>
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

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Content Templates</h3>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{template.estimatedLength}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.timeEstimate}
                      </span>
                    </div>
                    <Button className="w-full">Use Template</Button>
                  </CardContent>
                </Card>
              ))}
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
                              onClick={() => handleView(generation.generatedText, generation.title)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(normalizeMarkdown(generation.generatedText))}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(generation.generatedText, `${(generation.title || generation.contentType || 'generation').replace(/\s+/g, '-')}-${new Date(generation.createdAt).getTime()}.md`)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardContent>
                        <div className="prose prose-invert max-w-none p-4">
                          <ReactMarkdown>
                            {normalizeMarkdown(generation.generatedText)}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Generation Settings</h3>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Default Preferences</CardTitle>
                  <CardDescription>
                    Set your default preferences for content generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Content Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select default type" />
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Tone</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select default tone" />
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
                  <div className="space-y-2">
                    <Label>Default Word Count</Label>
                    <Input placeholder="e.g., 1000" type="number" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quality Settings</CardTitle>
                  <CardDescription>
                    Configure AI generation quality and style
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Generation Quality</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">
                          Fast (Lower quality, quicker)
                        </SelectItem>
                        <SelectItem value="balanced">
                          Balanced (Good quality, moderate speed)
                        </SelectItem>
                        <SelectItem value="high">
                          High Quality (Best quality, slower)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Citation Style</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select citation style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apa">APA</SelectItem>
                        <SelectItem value="mla">MLA</SelectItem>
                        <SelectItem value="chicago">Chicago</SelectItem>
                        <SelectItem value="harvard">Harvard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Statistics</CardTitle>
                  <CardDescription>
                    Monitor your AI content generation usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">23</div>
                      <div className="text-sm text-muted-foreground">
                        Remaining today
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">147</div>
                      <div className="text-sm text-muted-foreground">
                        Generated this month
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">4.6</div>
                      <div className="text-sm text-muted-foreground">
                        Average rating
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}
