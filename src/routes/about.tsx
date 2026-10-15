import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, Trash2, Cpu, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, AiStatusBadge } from "@/components/AppShell";
import { useActivity, setSavePref, clearAllLocalData } from "@/lib/activity";
import { DISCLAIMER, useAiStatus } from "@/lib/ai-status";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Settings & About · AI Workplace Assistant" },
      { name: "description", content: "Privacy settings, AI integration details and responsible AI guidance." },
      { property: "og:title", content: "Settings & About" },
      { property: "og:description", content: "Privacy settings, AI integration details and responsible AI guidance." },
    ],
  }),
  component: AboutPage,
});

function Card({ icon: Icon, title, children }: { icon: typeof Cpu; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function AboutPage() {
  const { save } = useActivity();
  const { data } = useAiStatus();
  return (
    <>
      <PageHeader title="Settings / About" description="Manage privacy preferences and learn how the assistant works." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={Lock} title="Privacy & local data">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">Save recent activity</p>
              <p>Stores only short labels (e.g. "Formal email to finance team") in this browser. Email text, research content and chats are never saved.</p>
            </div>
            <Switch checked={save} onCheckedChange={(v) => { setSavePref(v); toast.success(v ? "Activity history enabled" : "Activity history disabled and cleared"); }} />
          </div>
          <Button variant="outline" size="sm" onClick={() => { clearAllLocalData(); toast.success("All local data cleared"); }}>
            <Trash2 className="h-4 w-4" /> Clear all local data
          </Button>
        </Card>
        <Card icon={Cpu} title="AI integration">
          <AiStatusBadge />
          <p>
            Every response is generated live by a real AI model ({data?.model ?? "openai/gpt-6-astra"}) via Lovable AI. Requests go through this app's built-in secure server functions, so the private API key is never exposed in the browser.
          </p>
          <p>Limitations: no live web search for topics; URL analysis only works for publicly readable pages; chat memory lasts only for the current visit; usage is subject to the workspace's AI allowance.</p>
        </Card>
        <section className="flex gap-3 rounded-xl border border-border bg-card p-5 text-sm shadow-sm lg:col-span-2">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
          <div>
            <h2 className="font-semibold">AI disclaimer</h2>
            <p className="mt-1 text-muted-foreground">{DISCLAIMER}</p>
          </div>
        </section>
      </div>
    </>
  );
}
