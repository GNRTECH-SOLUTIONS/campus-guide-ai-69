import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, MessageSquare, Megaphone, BookOpen, Loader2 } from "lucide-react";

type Faq = { id: string; category: string; question: string; answer: string };
type Announcement = { id: string; title: string; body: string; type: string; active: boolean };
type Conv = { id: string; title: string; updated_at: string; user_id: string };

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-muted-foreground">
            Manage FAQs, announcements, and review student queries.
          </p>
        </div>
        <Tabs defaultValue="faqs">
          <TabsList>
            <TabsTrigger value="faqs"><BookOpen className="h-4 w-4" /> FAQs</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
            <TabsTrigger value="queries"><MessageSquare className="h-4 w-4" /> Student Queries</TabsTrigger>
          </TabsList>
          <TabsContent value="faqs" className="mt-6"><FaqsAdmin /></TabsContent>
          <TabsContent value="announcements" className="mt-6"><AnnouncementsAdmin /></TabsContent>
          <TabsContent value="queries" className="mt-6"><QueriesAdmin /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- FAQs ---------------- */
function FaqsAdmin() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Faq> | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("faqs").select("*").order("category");
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  async function save() {
    if (!edit?.category || !edit?.question || !edit?.answer) {
      toast.error("All fields are required.");
      return;
    }
    if (edit.id) {
      const { error } = await supabase.from("faqs").update({
        category: edit.category, question: edit.question, answer: edit.answer,
      }).eq("id", edit.id);
      if (error) return toast.error(error.message);
      toast.success("FAQ updated");
    } else {
      const { error } = await supabase.from("faqs").insert({
        category: edit.category, question: edit.question, answer: edit.answer,
      });
      if (error) return toast.error(error.message);
      toast.success("FAQ added");
    }
    setEdit(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All FAQs ({items.length})</CardTitle>
          <Button variant="hero" size="sm" onClick={() => setEdit({})}>
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <ul className="divide-y divide-border">
              {items.map((f) => (
                <li key={f.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Badge variant="secondary" className="mb-1">{f.category}</Badge>
                      <p className="font-medium">{f.question}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.answer}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEdit(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{edit?.id ? "Edit FAQ" : "New FAQ"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {edit ? (
            <>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={edit.category ?? ""} maxLength={50}
                  onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                  placeholder="e.g. Admissions" />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Input value={edit.question ?? ""} maxLength={300}
                  onChange={(e) => setEdit({ ...edit, question: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea rows={6} value={edit.answer ?? ""} maxLength={2000}
                  onChange={(e) => setEdit({ ...edit, answer: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button variant="hero" onClick={save}>Save</Button>
                <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Click "New FAQ" or pencil icon to edit.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Announcements ---------------- */
function AnnouncementsAdmin() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [edit, setEdit] = useState<Partial<Announcement> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  async function save() {
    if (!edit?.title || !edit?.body) { toast.error("Title and body required."); return; }
    const payload = {
      title: edit.title, body: edit.body, type: edit.type ?? "general", active: edit.active ?? true,
    };
    if (edit.id) {
      const { error } = await supabase.from("announcements").update(payload).eq("id", edit.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("announcements").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEdit(null);
    load();
  }

  async function toggle(a: Announcement) {
    const { error } = await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Announcements ({items.length})</CardTitle>
          <Button variant="hero" size="sm" onClick={() => setEdit({ active: true, type: "general" })}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <ul className="divide-y divide-border">
              {items.map((a) => (
                <li key={a.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge>{a.type}</Badge>
                        {a.active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Hidden</Badge>}
                      </div>
                      <p className="mt-2 font-semibold">{a.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Switch checked={a.active} onCheckedChange={() => toggle(a)} />
                      <Button size="icon" variant="ghost" onClick={() => setEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{edit?.id ? "Edit" : "New"} Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {edit ? (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={edit.title ?? ""} maxLength={150}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea rows={5} value={edit.body ?? ""} maxLength={1500}
                  onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={edit.type ?? "general"} maxLength={30}
                  onChange={(e) => setEdit({ ...edit, type: e.target.value })}
                  placeholder="general / admission / exam / fee" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={edit.active ?? true}
                  onCheckedChange={(v) => setEdit({ ...edit, active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="hero" onClick={save}>Save</Button>
                <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select "New" or edit an item.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Queries ---------------- */
function QueriesAdmin() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<{ role: string; content: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations").select("*").order("updated_at", { ascending: false }).limit(50);
    setConvs(data ?? []);
    setLoading(false);
  }
  async function open(c: Conv) {
    setSelected(c);
    const { data } = await supabase.from("messages").select("role,content,created_at")
      .eq("conversation_id", c.id).order("created_at");
    setMsgs(data ?? []);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Recent Conversations</CardTitle></CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <ul className="space-y-1">
              {convs.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
              {convs.map((c) => (
                <li key={c.id}>
                  <button onClick={() => open(c)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-base hover:bg-accent/15 ${
                      selected?.id === c.id ? "bg-accent/20" : ""
                    }`}>
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.updated_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>{selected ? selected.title : "Select a conversation"}</CardTitle></CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto space-y-3">
          {!selected && <p className="text-sm text-muted-foreground">Pick a chat to inspect.</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`rounded-lg border border-border p-3 text-sm ${
              m.role === "user" ? "bg-primary/5" : "bg-accent-soft/30"
            }`}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {m.role}
              </p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
