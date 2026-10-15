import { useQuery } from "@tanstack/react-query";
import { checkAiStatus } from "./ai.functions";

export function useAiStatus() {
  return useQuery({ queryKey: ["ai-status"], queryFn: () => checkAiStatus(), staleTime: 60_000 });
}

export const DISCLAIMER =
  "AI-generated content may contain errors or incomplete information. Review and verify important outputs before using them professionally. Do not submit confidential, sensitive, or personal information. AI suggestions support human judgement and do not replace professional verification.";

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}
