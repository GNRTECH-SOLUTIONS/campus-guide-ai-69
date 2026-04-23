import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ className = "", variant = "dark" }: LogoProps) {
  const text = variant === "light" ? "text-primary-foreground" : "text-primary";
  const sub = variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-glow transition-base group-hover:scale-105">
        <GraduationCap className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-display text-lg font-bold ${text}`}>Aria</span>
        <span className={`text-[10px] uppercase tracking-widest ${sub}`}>Student Guide</span>
      </div>
    </Link>
  );
}
