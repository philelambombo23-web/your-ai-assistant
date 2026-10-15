import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, BookOpenText, MessagesSquare, ArrowRight, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiStatusBadge } from "@/components/AppShell";
import { useActivity } from "@/lib/activity";
import { useAiStatus, DISCLAIMER } from "@/lib/ai-status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AI Workplace Productivity Assistant" },
      { name: "description", content: "Draft emails, research topics and chat with an AI workplace assistant." },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Draft emails, research topics and chat with an AI workplace assistant." },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  { to: "/email", icon: Mail, title: "Email Generator", desc: "Turn a few key details into a clear, well-toned professional email.", cta: "Write an email" },
  { to: "/research", icon: BookOpenText, title: "Research Assistant", desc: "Explore a topic, summarise pasted articles, or analyse a web page.", cta: "Start research" },
  { to: "/chat", icon: MessagesSquare, title: "AI Workplace Chat", desc: "Ask for agendas, ideas, rewrites and practical solutions.", cta: "Open chat" },
] as const;

function Dashboard() {
  const { save, items } = useActivity();
  const { data } = useAiStatus();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Your AI assistant helps you spend less time on routine writing and information-gathering — so you can focus on decisions. Draft emails, research questions, and talk through workplace tasks in one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.to} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{f.desc}</p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
              <Link to={f.to}>
                {f.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          {!save ? (
            <p className="text-sm text-muted-foreground">
              Activity history is off to protect your privacy. You can enable it in{" "}
              <Link to="/about" className="font-medium text-primary hover:underline">Settings</Link>.
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Use any tool and it will appear here.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium">{a.tool}</span>
                    {a.label}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">AI connection</h2>
          <AiStatusBadge />
          <p className="mt-3 text-sm text-muted-foreground">
            {data?.configured ? `Responses are generated live by ${data.model} through Lovable AI.` : "Checking or unavailable — AI tools will show an error if they cannot connect."}
          </p>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-border bg-card p-5 text-sm shadow-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
        <div>
          <h2 className="font-semibold">Responsible AI use</h2>
          <p className="mt-1 text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </section>
    </div>
  );
}
