import { Copy, RefreshCw, Trash2, Loader2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function OutputPanel({
  value,
  onChange,
  loading,
  error,
  onRegenerate,
  onClear,
  emptyText,
  note,
}: {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onClear: () => void;
  emptyText: string;
  note?: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed. Select the text and copy manually.");
    }
  };
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">Result {value && <span className="font-normal text-muted-foreground">· editable</span>}</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={copy} disabled={!value || loading}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={onRegenerate} disabled={loading || !value}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear} disabled={loading}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {error && (
          <div className="mb-3 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {note && !loading && value && <p className="mb-2 text-xs text-accent-foreground">{note}</p>}
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" /> AI is generating…
          </div>
        ) : value ? (
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[380px] flex-1 resize-y font-[inherit] text-sm leading-relaxed" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

export function Disclaimer() {
  return null;
}
