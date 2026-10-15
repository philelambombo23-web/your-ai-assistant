import { useEffect, useState } from "react";

// Only stores a short label (no email/research/chat content) and only when the user opts in.
export type Activity = { id: string; tool: "Email" | "Research" | "Chat"; label: string; at: number };

const PREF_KEY = "wpa.saveActivity";
const ACT_KEY = "wpa.activity";
const EVT = "wpa-activity";

export function getSavePref() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
}
export function setSavePref(v: boolean) {
  localStorage.setItem(PREF_KEY, String(v));
  if (!v) localStorage.removeItem(ACT_KEY);
  window.dispatchEvent(new Event(EVT));
}
export function getActivity(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function logActivity(tool: Activity["tool"], label: string) {
  if (!getSavePref()) return;
  const list = [{ id: crypto.randomUUID(), tool, label, at: Date.now() }, ...getActivity()].slice(0, 8);
  localStorage.setItem(ACT_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}
export function clearAllLocalData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("wpa."))
    .forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event(EVT));
}
export function useActivity() {
  const [state, setState] = useState<{ save: boolean; items: Activity[] }>({ save: false, items: [] });
  useEffect(() => {
    const read = () => setState({ save: getSavePref(), items: getActivity() });
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  return state;
}
