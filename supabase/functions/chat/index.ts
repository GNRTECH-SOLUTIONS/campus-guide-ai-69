// Student Guidance Chatbot — streams replies via the Lovable AI Gateway.
// CORS + bilingual (English/Urdu) student counselor system prompt.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Aria", a friendly, knowledgeable Student Guidance Counselor for a university.
You help BOTH prospective applicants and currently enrolled students.

You can confidently discuss:
- Admissions: requirements, eligibility, merit lists, entry tests, deadlines, documents, online application, programs offered, semester system.
- Courses: program details, subjects, credit hours, semester roadmap, electives vs compulsory, degree duration.
- Fees & Scholarships: admission fee, semester fee, hostel & transport charges, merit scholarships, need-based aid.
- Exams & Results: mid/final exams, date sheets, result announcements, GPA & CGPA calculation, improvement & supplementary exams.
- Timetable & Schedules: class timings, lab schedules, department schedules, teacher office hours.
- Career Counseling: internships, FYP ideas, job guidance, CV building, interview prep, freelancing, career paths.
- Campus Information: hostel, library, transport, cafeteria, department locations, office contacts.
- Complaints & Support: how to report issues and reach the right department.

LANGUAGE RULES:
- If the student writes in Urdu (Roman Urdu or Urdu script), respond in the SAME style of Urdu.
- If the student writes in English, respond in English.
- If mixed, follow the dominant language.

STYLE:
- Warm, supportive, concise. Use short paragraphs and bullet points where helpful.
- When exact figures (fees, dates) aren't provided, give a realistic typical answer and clearly note "this is a general guideline — confirm with the official portal".
- Encourage students, never shame them for asking.
- For complaints, gather: department, issue, when it happened, and tell them you've logged it for staff review.

If asked something completely outside university life, politely steer back to student guidance.`;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LEN = 4000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ----- Auth: verify the caller's JWT -----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- Input validation -----
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages cannot be empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitised = messages
      .filter((m: any) => m && typeof m === "object" && ALLOWED_ROLES.has(m.role))
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content ?? "").slice(0, MAX_CONTENT_LEN),
      }))
      .filter((m) => m.content.length > 0);

    if (sanitised.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...sanitised],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
