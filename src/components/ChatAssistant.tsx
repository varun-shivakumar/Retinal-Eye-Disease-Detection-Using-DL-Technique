// src/components/ChatAssistant.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "system" | "user" | "assistant" | "error";
type Msg = { id: string; role: Role; text: string; time?: string };

export default function ChatAssistant({
  initialSystemPrompt = "",
  autoStart = true,
}: {
  initialSystemPrompt?: string;
  autoStart?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    const base: Msg[] = [];
    if (initialSystemPrompt) {
      base.push({
        id: "system-1",
        role: "system",
        text: initialSystemPrompt,
        time: new Date().toISOString(),
      });
    }
    return base;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Msg[]>([]);
  const autoStarted = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // auto-trigger assistant once when component mounts if there's a system prompt
  useEffect(() => {
    if (!autoStart) return;
    if (!initialSystemPrompt) return;
    if (autoStarted.current) return;
    if (messagesRef.current.some((m) => m.role === "assistant")) return;

    autoStarted.current = true;
    setTimeout(() => {
      triggerAssistantFromSystem();
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSystemPrompt, autoStart]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // ---------- Networking ----------
  async function callGeminiAPI(payloadMessages: Array<{ role: string; content: string }>) {
    const url = "/api/gemini/chat";
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payloadMessages }),
      credentials: "omit",
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`Server ${resp.status}: ${text || resp.statusText}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return { _rawText: text };
    }
  }

  // ---------- Response extractor ----------
  function extractAssistantText(data: any): string {
    if (!data) return "";
    try {
      if (Array.isArray(data.candidates) && data.candidates.length > 0) {
        const cand = data.candidates[0];
        const content = cand.content ?? cand.message ?? cand;
        if (content) {
          if (Array.isArray(content.parts) && content.parts.length) {
            const parts = content.parts
              .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
              .filter(Boolean);
            if (parts.length) return parts.join("\n\n");
          }
          if (Array.isArray(content)) {
            const arr = content.map((c: any) => c?.text ?? "").filter(Boolean);
            if (arr.length) return arr.join("\n\n");
          }
          if (typeof content.text === "string" && content.text.trim()) return content.text;
          if (typeof cand.text === "string" && cand.text.trim()) return cand.text;
          if (typeof cand.message === "string" && cand.message.trim()) return cand.message;
        }
      }
    } catch {}
    try {
      if (Array.isArray(data.output)) {
        for (const out of data.output) {
          if (!out) continue;
          if (Array.isArray(out.content) && out.content.length) {
            const outParts = out.content.map((c: any) => c?.text ?? "").filter(Boolean);
            if (outParts.length) return outParts.join("\n\n");
          }
          if (typeof out?.content?.text === "string") return out.content.text;
        }
      }
    } catch {}
    try {
      if (Array.isArray(data.messages)) {
        const texts = data.messages
          .map((m: any) => {
            if (!m) return "";
            if (typeof m === "string") return m;
            if (m?.content) {
              if (typeof m.content === "string") return m.content;
              if (Array.isArray(m.content)) return m.content.map((c: any) => c?.text ?? "").join("");
              if (typeof m.content.text === "string") return m.content.text;
            }
            if (typeof m.text === "string") return m.text;
            return "";
          })
          .filter(Boolean);
        if (texts.length) return texts.join("\n\n");
      }
    } catch {}
    if (typeof data.output_text === "string") return data.output_text;
    if (typeof data.outputText === "string") return data.outputText;
    if (typeof data.text === "string") return data.text;
    if (typeof data._rawText === "string") return data._rawText;
    try {
      return JSON.stringify(data);
    } catch {
      return "";
    }
  }

  // ---------- Simple block formatting (paragraphs + lists) ----------
  function renderFormatted(text: string) {
    if (!text) return null;
    const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    return blocks.map((block, i) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const isList = lines.every((l) => /^(\*|-|\d+\.)\s+/.test(l));
      if (isList) {
        return (
          <ul key={i} className="list-disc list-inside mb-2 text-sm">
            {lines.map((li, j) => (
              <li key={j} className="leading-relaxed">
                {li.replace(/^(\*|-|\d+\.)\s+/, "")}
              </li>
            ))}
          </ul>
        );
      } else {
        return (
          <p key={i} className="mb-2 text-sm leading-relaxed whitespace-pre-wrap">
            {block}
          </p>
        );
      }
    });
  }

  // ---------- Sending ----------
  const send = async (userText: string) => {
    if (!userText || !userText.trim()) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: userText, time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const prior = messagesRef.current || [];
      const systems = prior.filter((x) => x.role === "system").map((s) => ({ role: "system", content: s.text }));
      const convo = prior.filter((x) => x.role !== "system").map((m) => ({ role: m.role, content: m.text }));
      const payload = [...systems, ...convo, { role: "user", content: userText }];

      const result = await callGeminiAPI(payload);
      const assistantText = extractAssistantText(result) || "No assistant text returned.";
      const assistantMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", text: assistantText, time: new Date().toISOString() };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      const errMsg: Msg = { id: `err-${Date.now()}`, role: "error", text: `Failed to get response: ${err?.message ?? String(err)}`, time: new Date().toISOString() };
      setMessages((m) => [...m, errMsg]);
      console.error("ChatAssistant send error:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAssistantFromSystem = async () => {
    if (!initialSystemPrompt) return;
    if (messagesRef.current.some((m) => m.role === "assistant")) return;
    setLoading(true);
    try {
      const trigger = "Please explain the diagnosis and next steps in simple language.";
      const payload = [{ role: "system", content: initialSystemPrompt }, { role: "user", content: trigger }];
      const result = await callGeminiAPI(payload);
      const assistantText = extractAssistantText(result) || "No assistant text returned.";
      const assistantMsg: Msg = { id: `a-init-${Date.now()}`, role: "assistant", text: assistantText, time: new Date().toISOString() };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      const errMsg: Msg = { id: `err-init-${Date.now()}`, role: "error", text: `Failed to get response: ${err?.message ?? String(err)}`, time: new Date().toISOString() };
      setMessages((m) => [...m, errMsg]);
      console.error("triggerAssistantFromSystem error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      const t = document.createElement("div");
      t.innerText = "Copied";
      t.className = "fixed bottom-6 right-6 bg-slate-800 text-white px-3 py-2 rounded shadow";
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    });
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    send(input.trim());
  };

  return (
    <div className="flex flex-col h-full bg-white rounded shadow">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div>
          <div className="text-sm font-medium">Medical Explainer Assistant</div>
          <div className="text-xs text-slate-500">Auto-explains current diagnosis — or ask a follow up</div>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="animate-spin h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
              </svg>
              Thinking...
            </div>
          )}
          <div className="text-xs text-slate-400">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] ${m.role === "user" ? "text-right" : "text-left"}`}>
              <div className="text-xs text-slate-400 mb-1">{m.role.toUpperCase()}</div>
              <div
                className={`px-3 py-2 rounded-lg ${
                  m.role === "user"
                    ? "bg-indigo-50 text-indigo-900"
                    : m.role === "system"
                    ? "bg-slate-100 text-slate-800"
                    : m.role === "error"
                    ? "bg-rose-50 text-rose-900"
                    : "bg-white text-slate-900 shadow-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  <div>
                    {/* wrap ReactMarkdown so we don't pass className into it */}
                    <div className="prose prose-sm max-w-none text-slate-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => handleCopy(m.text)} className="text-xs px-2 py-1 border rounded text-slate-600 hover:bg-slate-50">
                        Copy
                      </button>
                      <div className="text-xs text-slate-400 ml-auto">{m.time ? new Date(m.time).toLocaleTimeString() : ""}</div>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="p-3 border-t bg-slate-50" onSubmit={onSubmit}>
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the assistant a question (or press Enter)..."
            className="flex-1 px-3 py-2 rounded border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={loading}
            aria-label="Chat input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
