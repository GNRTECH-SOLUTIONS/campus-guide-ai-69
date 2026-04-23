import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  GraduationCap,
  Wallet,
  CalendarDays,
  Briefcase,
  Loader2,
  Plus,
  MessageSquare,
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { icon: GraduationCap, label: "How do I apply for BSCS?" },
  { icon: Wallet, label: "Tell me about scholarships" },
  { icon: CalendarDays, label: "How is CGPA calculated?" },
  { icon: Briefcase, label: "FYP ideas for AI students" },
];

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data ?? []);
  }

  async function loadConversation(id: string) {
    setConversationId(id);
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages((data ?? []).map((m) => ({ role: m.role as any, content: m.content })));
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
  }

  async function ensureConversation(firstMessage: string): Promise<string> {
    if (conversationId) return conversationId;
    const title = firstMessage.slice(0, 60);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user!.id, title })
      .select("id")
      .single();
    if (error) throw error;
    setConversationId(data.id);
    loadConversations();
    return data.id;
  }

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || loading || !user) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const convId = await ensureConversation(text);
      // Persist user message
      await supabase
        .from("messages")
        .insert({ conversation_id: convId, user_id: user.id, role: "user", content: text });

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit reached. Try again in a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add credits in workspace settings.");
        else toast.error("Failed to get a response.");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      // Insert empty assistant placeholder
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
          return copy;
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Persist assistant final
      if (assistantSoFar) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantSoFar,
        });
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-border bg-card md:flex">
          <div className="p-4">
            <Button variant="hero" className="w-full" onClick={newChat}>
              <Plus className="h-4 w-4" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </p>
            {conversations.length === 0 && (
              <p className="px-3 text-sm text-muted-foreground">No chats yet.</p>
            )}
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => loadConversation(c.id)}
                    className={`group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-base hover:bg-accent/15 ${
                      conversationId === c.id ? "bg-accent/20 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {isEmpty ? (
              <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-glow">
                  <Sparkles className="h-7 w-7 text-accent-foreground" />
                </div>
                <h1 className="font-display text-4xl font-bold">How can Aria help today?</h1>
                <p className="mt-3 text-muted-foreground">
                  Ask about admissions, fees, exams, schedules, careers, or campus life — in English or Urdu.
                </p>
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                  {QUICK_PROMPTS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onClick={() => send(label)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-base hover:border-accent hover:shadow-card-soft"
                    >
                      <div className="rounded-lg bg-accent-soft p-2 text-primary transition-base group-hover:bg-gradient-gold group-hover:text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-gold">
                      <Sparkles className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex items-center gap-1 pt-2 text-muted-foreground">
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" />
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card/60 p-4 backdrop-blur">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-card-soft focus-within:border-accent focus-within:shadow-glow transition-base"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask Aria anything... (English or Urdu)"
                  className="min-h-[44px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                  rows={1}
                  maxLength={2000}
                  disabled={loading}
                />
                <Button type="submit" variant="hero" size="icon" disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Aria can make mistakes. Verify important details with the official portal.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: Msg) {
  const isUser = role === "user";
  return (
    <div className={`flex animate-fade-in gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-gold">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-card-soft ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-border"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="chat-prose">
            <ReactMarkdown>{content || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          You
        </div>
      )}
    </div>
  );
}
