import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/AppShell";
import { OutputPanel } from "@/components/OutputPanel";
import { runResearch } from "@/lib/ai.functions";
import { errMsg } from "@/lib/ai-status";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant · AI Workplace Assistant" },
      { name: "description", content: "Research topics, summarise articles and analyse web pages with AI." },
      { property: "og:title", content: "AI Research Assistant" },
      { property: "og:description", content: "Research topics, summarise articles and analyse web pages with AI." },
    ],
  }),
  component: ResearchPage,
});

type Mode = "topic" | "article" | "url";
const HINTS: Record<Mode, string> = {
  topic: "Uses the model's general knowledge (no live web search). Check key claims against reliable sources.",
  article: "The AI summarises only the text you paste and separates source facts from its own interpretation.",
  url: "The page is fetched live. Pages behind logins, paywalls or heavy JavaScript may be blocked — paste the text instead if so.",
};

function ResearchPage() {
  const [mode, setMode] = useState<Mode>("topic");
  const [inputs, setInputs] = useState<Record<Mode, string>>({ topic: "", article: "", url: "" });
  const [output, setOutput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = inputs[mode];

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await runResearch({ data: { mode, input } });
      setOutput(r.text);
      setNote(r.sourceNote);
      logActivity("Research", mode === "topic" ? input.slice(0, 50) : mode === "url" ? "Analysed a web page" : "Summarised pasted text");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="AI Research Assistant" description="Investigate a question, summarise an article, or analyse a web page." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setError(null); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="topic">Topic</TabsTrigger>
              <TabsTrigger value="article">Pasted article</TabsTrigger>
              <TabsTrigger value="url">Website URL</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-1.5">
            <Label htmlFor="in">{mode === "topic" ? "Research topic or question" : mode === "article" ? "Article text" : "Web page address"}</Label>
            {mode === "url" ? (
              <Input id="in" type="url" value={input} onChange={(e) => setInputs({ ...inputs, url: e.target.value })} placeholder="https://example.com/article" />
            ) : (
              <Textarea
                id="in"
                rows={mode === "article" ? 12 : 4}
                value={input}
                onChange={(e) => setInputs({ ...inputs, [mode]: e.target.value })}
                placeholder={mode === "topic" ? "e.g. What are good practices for running hybrid team meetings?" : "Paste the full article text here"}
              />
            )}
            <p className="text-xs text-muted-foreground">{HINTS[mode]}</p>
          </div>
          <Button type="submit" disabled={loading || !input.trim()} className="w-full">
            <Search className="h-4 w-4" /> {loading ? "Researching…" : mode === "topic" ? "Research Topic" : mode === "article" ? "Summarise Article" : "Analyse Page"}
          </Button>
        </form>
        <OutputPanel
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          note={note}
          onRegenerate={run}
          onClear={() => { setOutput(""); setNote(""); setError(null); setInputs({ ...inputs, [mode]: "" }); }}
          emptyText="Research results will appear here."
        />
      </div>
    </>
  );
}
