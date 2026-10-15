import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

const CHAT_SYSTEM =
  "You are a professional AI workplace productivity assistant. Provide clear, relevant, practical, and context-aware answers. Adapt to the user's specific instructions and workplace situation. Ask clarifying questions when necessary. Do not invent facts, claim actions you have not performed, or present uncertain information as verified. Protect confidential information and explain important limitations.";

const EMAIL_SYSTEM = `You are a professional workplace email writer.
Write one original email based ONLY on the user's supplied details.
Rules:
- Start with a line "Subject: ..." (use the user's subject if provided, otherwise write a suitable one), then a blank line, then the email body.
- Match the requested tone and length exactly.
- Preserve the user's facts and intended meaning.
- Never invent names, dates, figures, promises, or business details. Where essential information is missing, use clear square-bracket placeholders such as [Your name] or [Date].
- Output plain text only, no markdown, no commentary before or after the email.`;

const RESEARCH_SYSTEM = `You are a careful workplace research assistant.
Never fabricate statistics, quotations, citations, URLs, or references. If you are unsure, say so explicitly.
Use markdown headings and bullet points.`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callModel(messages: Msg[]): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured: LOVABLE_API_KEY is missing.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({ model: MODEL, messages, reasoning_effort: "low", stream: true }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = "";
    try {
      msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? "";
    } catch {}
    if (res.status === 429) throw new Error("The AI service is busy (rate limited). Please wait a moment and try again.");
    if (res.status === 402) throw new Error(msg || "AI credits are exhausted for this workspace. Add credits to continue.");
    throw new Error(msg || `AI request failed (status ${res.status}).`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.error) throw new Error(j.error.message ?? "AI stream error");
        out += j.choices?.[0]?.delta?.content ?? "";
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input" && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  if (!out.trim()) throw new Error("The AI returned an empty response. Please try again.");
  return out.trim();
}

export const checkAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: !!process.env.LOVABLE_API_KEY, model: MODEL };
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      recipient: z.string().min(1).max(500),
      purpose: z.string().min(1).max(1000),
      details: z.string().max(5000),
      subject: z.string().max(300),
      tone: z.enum(["Formal", "Friendly", "Persuasive"]),
      length: z.enum(["Concise", "Standard", "Detailed"]),
    }),
  )
  .handler(async ({ data }) => {
    const prompt = `Recipient / audience: ${data.recipient}
Purpose: ${data.purpose}
Key details to include: ${data.details || "(none provided)"}
Subject: ${data.subject || "(write a suitable subject)"}
Tone: ${data.tone}
Length: ${data.length} (Concise ≈ 60-120 words, Standard ≈ 120-220 words, Detailed ≈ 220-400 words)`;
    const text = await callModel([
      { role: "system", content: EMAIL_SYSTEM },
      { role: "user", content: prompt },
    ]);
    return { text };
  });

function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      mode: z.enum(["topic", "article", "url"]),
      input: z.string().min(1).max(40000),
    }),
  )
  .handler(async ({ data }) => {
    let sourceNote = "";
    let userPrompt = "";
    if (data.mode === "topic") {
      userPrompt = `Research topic or question: ${data.input}

Answer from general knowledge only (you have no live web access). Use exactly these sections:
## Overview
## Key Findings
## Important Considerations
## Practical Insights
## Recommendations
## Limitations and Unanswered Questions
End with a short note recommending that important claims be checked against reliable original sources. Do not include citations or statistics you cannot verify.`;
    } else {
      let text = data.input;
      if (data.mode === "url") {
        let url: URL;
        try {
          url = new URL(data.input.trim());
          if (!/^https?:$/.test(url.protocol)) throw new Error();
        } catch {
          throw new Error("Please enter a valid web address starting with http:// or https://.");
        }
        let res: Response;
        try {
          res = await fetch(url.toString(), {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; WorkplaceAssistant/1.0)", Accept: "text/html,text/plain" },
            redirect: "follow",
          });
        } catch {
          throw new Error("The page could not be reached. Please paste the article text instead.");
        }
        if (!res.ok)
          throw new Error(`The website refused access (status ${res.status}). Please paste the article text instead.`);
        const ct = res.headers.get("content-type") ?? "";
        if (!/text\/(html|plain)/.test(ct))
          throw new Error("This link is not a readable web page (e.g. PDF or image). Please paste the text instead.");
        text = htmlToText(await res.text()).slice(0, 30000);
        if (text.length < 300)
          throw new Error(
            "Too little readable text was found on that page (it may require login or JavaScript). Please paste the article text instead.",
          );
        sourceNote = `Retrieved ${text.length.toLocaleString()} characters of text from ${url.hostname}.`;
      }
      userPrompt = `Summarise the following source content accurately. Use only the supplied content for facts.
Use exactly these sections:
## Summary
## Key Points from the Source  (facts stated in the source only)
## AI Interpretation  (clearly labelled as your analysis, not source facts)
## Practical Takeaways
## Gaps and Uncertainties
If the content seems incomplete, garbled, or not an article, say so.

SOURCE CONTENT:
"""
${text}
"""`;
    }
    const result = await callModel([
      { role: "system", content: RESEARCH_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    return { text: result, sourceNote };
  });

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z
        .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
        .min(1)
        .max(60),
    }),
  )
  .handler(async ({ data }) => {
    const text = await callModel([{ role: "system", content: CHAT_SYSTEM }, ...data.messages]);
    return { text };
  });
