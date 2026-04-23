import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Wallet,
  CalendarDays,
  Briefcase,
  MapPin,
  HelpCircle,
  BookOpen,
  Languages,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Admissions", desc: "Eligibility, deadlines, documents, online application." },
  { icon: BookOpen, title: "Courses", desc: "Programs, subjects, credit hours, semester roadmaps." },
  { icon: Wallet, title: "Fees & Scholarships", desc: "Tuition, hostel, transport, merit & need-based aid." },
  { icon: CalendarDays, title: "Exams & Results", desc: "Date sheets, GPA/CGPA, supplementary exams." },
  { icon: Briefcase, title: "Career Counseling", desc: "Internships, FYP ideas, CV & interview prep." },
  { icon: MapPin, title: "Campus Life", desc: "Hostel, library, transport, departments & offices." },
];

const sampleQs = [
  "How do I apply for BS Computer Science?",
  "What is the fee for BBA per semester?",
  "Suggest FYP ideas for AI",
  "How is CGPA calculated?",
  "When does the spring semester start?",
  "BSCS ka admission criteria kya hai?",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(41 78% 60% / 0.4) 0px, transparent 40%), radial-gradient(circle at 80% 60%, hsl(222 80% 50% / 0.4) 0px, transparent 45%)",
        }} />
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" /> AI-powered • English & اردو
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-balance md:text-6xl lg:text-7xl">
              Your <span className="text-accent">24/7 AI</span> student counselor
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 md:text-xl text-balance">
              Meet Aria — instant, accurate guidance on admissions, fees, scholarships, exams,
              schedules, careers, and campus life. For applicants and enrolled students alike.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup">
                  Start chatting free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 text-left text-sm sm:grid-cols-3 md:grid-cols-3">
              {[
                { icon: Languages, label: "Bilingual EN / اردو" },
                { icon: ShieldCheck, label: "Secure & private" },
                { icon: MessageSquare, label: "Instant replies" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <span className="text-primary-foreground/90">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sample questions */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ask anything a student would ask</h2>
          <p className="mt-3 text-muted-foreground">
            From application forms to final-year project ideas — Aria has you covered.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {sampleQs.map((q) => (
            <Link
              key={q}
              to="/auth?mode=signup"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-card-soft transition-base hover:border-accent hover:shadow-glow"
            >
              <HelpCircle className="h-3.5 w-3.5 text-accent" />
              <span>{q}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-soft py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Everything a student counselor does — instantly</h2>
            <p className="mt-3 text-muted-foreground">
              Aria covers all 8 core areas of student support, available whenever you need.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card-soft transition-base hover:-translate-y-1 hover:border-accent hover:shadow-elegant"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-primary transition-base group-hover:bg-gradient-gold group-hover:text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center text-primary-foreground shadow-elegant md:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold md:text-5xl text-balance">
            Ready to get answers in seconds?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Create a free account and start chatting with Aria right away.
          </p>
          <div className="relative mt-8">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?mode=signup">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Aria — Student Guidance Portal</p>
          <p>Built with care for students everywhere</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
