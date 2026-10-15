import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Trash2, Copy, Pencil, Loader2, AlertCircle, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/AppShell";
import { sendChat } from "@/lib/ai.functions";
import { errMsg } from "@/lib/ai-status";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat · AI Workplace Assistant" },
      { name: "description", content: "Chat with an AI assistant about workplace tasks, writing and planning." },
      { property: "og:title", content: "AI Workplace Chat" },
      { property: "og:description", content: "Chat with an AI assistant about workplace tasks, writing and planning." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const STARTERS = [
  "Draft a 30-minute agenda for a weekly team check-in",
  "Help me rewrite this message to sound more professional: ",
  "Brainstorm 5 ideas to improve team communication when working remotely",
  "How should I prioritise a week with too many deadlines?",
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);
  useEffect(() => { if (!loading) taRef.current?.focus(); }, [loading]);

  const send = async (text = input) => {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const r = await sendChat({ data: { messages: next.slice(-40) } });
      setMessages([...next, { role: "assistant", content: r.text }]);
      if (messages.length === 0) logActivity("Chat", "Started a chat conversation");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const editMsg = (i: number) => {
    setInput(messages[i]?.content ?? "");
    setMessages(messages.slice(0, i));
    taRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="AI Workplace Chat" description="Ask workplace questions. The assistant remembers earlier messages in this conversation (not saved after you leave)." />
        <Button variant="outline" size="sm" onClick={() => { setMessages([]); setError(null); }} disabled={!messages.length || loading}>
          <Trash2 className="h-4 w-4" /> Clear chat
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && !loading && (
            <div className="mx-auto max-w-lg py-8 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal text-sidebar"><Briefcase className="h-5 w-5" /></div>
              <h2 className="font-semibold">How can I help with your work today?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try one of these to get started:</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => (s.endsWith(": ") ? (setInput(s), taRef.current?.focus()) : send(s))} className="rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-secondary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="group flex flex-col items-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
                <button onClick={() => editMsg(i)} disabled={loading} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal text-sidebar"><Briefcase className="h-3.5 w-3.5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(m.content).then(() => toast.success("Copied"), () => toast.error("Copy failed"))}
                    className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ),
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Assistant is thinking…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { const last = messages[messages.length - 1]; if (last?.role === "user") { setMessages(messages.slice(0, -1)); send(last.content); } }}>
                Retry
              </Button>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message the assistant… (Enter to send, Shift+Enter for new line)"
            className="max-h-40 min-h-[44px] resize-none"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11">
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
