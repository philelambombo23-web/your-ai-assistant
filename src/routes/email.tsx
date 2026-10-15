import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/AppShell";
import { OutputPanel } from "@/components/OutputPanel";
import { generateEmail } from "@/lib/ai.functions";
import { errMsg } from "@/lib/ai-status";
import { logActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator · AI Workplace Assistant" },
      { name: "description", content: "Generate professional emails in a formal, friendly or persuasive tone." },
      { property: "og:title", content: "Smart Email Generator" },
      { property: "og:description", content: "Generate professional emails in a formal, friendly or persuasive tone." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive"] as const;
const LENGTHS = ["Concise", "Standard", "Detailed"] as const;

function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === o ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function EmailPage() {
  const [form, setForm] = useState({ recipient: "", purpose: "", details: "", subject: "" });
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Standard");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = form.recipient.trim() && form.purpose.trim();
  const run = async () => {
    if (!valid) return setError("Please fill in the recipient and the purpose of the email.");
    setLoading(true);
    setError(null);
    try {
      const r = await generateEmail({ data: { ...form, tone, length } });
      setOutput(r.text);
      logActivity("Email", `${tone} email to ${form.recipient.slice(0, 40)}`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  const clear = () => {
    setForm({ recipient: "", purpose: "", details: "", subject: "" });
    setOutput("");
    setError(null);
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Smart Email Generator" description="Describe what you need to say. The AI writes an original draft using only the facts you provide." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="r">Recipient or audience *</Label>
            <Input id="r" value={form.recipient} onChange={set("recipient")} placeholder="e.g. My line manager, the finance team" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">Email purpose *</Label>
            <Input id="p" value={form.purpose} onChange={set("purpose")} placeholder="e.g. Request a deadline extension" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d">Key details to include</Label>
            <Textarea id="d" rows={5} value={form.details} onChange={set("details")} placeholder="Facts, dates, requests or context the email must mention" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s">Subject (optional)</Label>
            <Input id="s" value={form.subject} onChange={set("subject")} placeholder="Leave blank to let the AI suggest one" />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <div><Segmented options={TONES} value={tone} onChange={setTone} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Length</Label>
              <div><Segmented options={LENGTHS} value={length} onChange={setLength} /></div>
            </div>
          </div>
          <Button type="submit" disabled={loading || !valid} className="w-full">
            <Sparkle className="h-4 w-4" /> {loading ? "Generating…" : "Generate Email"}
          </Button>
        </form>
        <OutputPanel
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          onRegenerate={run}
          onClear={clear}
          emptyText="Your generated email will appear here."
        />
      </div>
    </>
  );
}
