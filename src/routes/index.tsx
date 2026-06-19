import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const DONATE_URL = "https://www.crowdfunder.co.uk/p/figment-arts-port-studio";

const PALETTE = ["#C56B4A", "#D9A441", "#5B8C8A", "#E8856B", "#8FA877"];

// House silhouette layout: width is per-row count of brick slots.
// Total slots = 2+4+6+8+10+10+10+10 = 60
const ROWS = [2, 4, 6, 8, 10, 10, 10, 10];
const MAX_COLS = Math.max(...ROWS);
const TOTAL_SLOTS = ROWS.reduce((a, b) => a + b, 0);

type Brick = {
  id: string;
  name: string;
  message: string;
  color: string;
  position_index: number;
};

type Stats = {
  amount_raised: number;
  target: number;
  supporters: number;
};

function Index() {
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("bricks").select("id,name,message,color,position_index").order("position_index", { ascending: true }),
      supabase.from("campaign_stats").select("amount_raised,target,supporters").eq("id", 1).maybeSingle(),
    ]);
    if (b) setBricks(b as Brick[]);
    if (s) setStats(s as Stats);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("port-studio")
      .on("postgres_changes", { event: "*", schema: "public", table: "bricks" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_stats" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const byIndex = useMemo(() => {
    const map = new Map<number, Brick>();
    bricks.forEach((b) => map.set(b.position_index, b));
    return map;
  }, [bricks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please add a short message for your brick.");
      return;
    }
    if (trimmed.length > 80) {
      toast.error("Messages are limited to 80 characters.");
      return;
    }
    setSubmitting(true);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const position_index = bricks.length;
    const { error } = await supabase.from("bricks").insert({
      name: name.trim() || "Anonymous",
      message: trimmed,
      color,
      position_index,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't add your brick — please try again.");
      return;
    }
    setName("");
    setMessage("");
    toast.success("Your brick is in the wall — thank you!");
  };

  const pct = stats ? Math.min(100, Math.round((Number(stats.amount_raised) / Number(stats.target)) * 100)) : 0;

  // Build the brick grid as flex rows, each centered.
  let runningIdx = 0;
  const layout = ROWS.map((count) => {
    const cells = Array.from({ length: count }, (_, i) => {
      const idx = runningIdx + i;
      return { idx, brick: byIndex.get(idx) };
    });
    runningIdx += count;
    return cells;
  });

  return (
    <div className="min-h-screen paper">
      <Toaster position="top-center" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="inline-block w-7 h-5 rounded-sm bg-primary brick" aria-hidden />
            <span className="font-display text-lg sm:text-xl font-semibold tracking-tight">Figment Arts</span>
          </a>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 sm:px-5 py-2 text-sm sm:text-base font-semibold shadow-sm hover:bg-primary/90 transition"
          >
            Donate
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-16 pb-6 text-center">
        <span className="inline-block rounded-full bg-accent/40 text-accent-foreground px-3 py-1 text-xs sm:text-sm font-semibold tracking-wide uppercase">
          Brighton &amp; Shoreham · Brick by Brick
        </span>
        <h1 className="mt-5 font-display text-4xl sm:text-6xl font-semibold text-foreground">
          Help us build <span className="text-primary">Port Studio</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
          A warm, inclusive creative hub for neurodivergent and disabled artists.
          Add a brick to our wall, leave a message, and help Figment Arts open the doors.
        </p>
      </section>

      {/* Building */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-4">
        <div className="rounded-3xl bg-card/60 border border-border/70 p-4 sm:p-8 shadow-sm">
          <div
            className="mx-auto flex flex-col gap-1.5 sm:gap-2"
            style={{ maxWidth: "560px" }}
            role="list"
            aria-label="Wall of supporter bricks"
          >
            {layout.map((row, rowIdx) => (
              <div
                key={`row-${rowIdx}`}
                className="flex justify-center gap-1.5 sm:gap-2"
                // Offset alternate rows like real brickwork
                style={{ paddingLeft: rowIdx % 2 === 0 ? 0 : "0.6rem" }}
              >
                {row.map((cell) => {
                  const brickClass =
                    "h-5 sm:h-7 w-10 sm:w-12 shrink-0";
                  if (cell.brick) {
                    return (
                      <Popover key={cell.idx}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`brick brick-filled ${brickClass} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                            style={{ backgroundColor: cell.brick.color }}
                            aria-label={`Brick from ${cell.brick.name}: ${cell.brick.message}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          className="w-60 rounded-2xl border-border bg-popover p-4"
                        >
                          <p className="font-display text-base font-semibold text-foreground">
                            {cell.brick.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground leading-snug">
                            “{cell.brick.message}”
                          </p>
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  return (
                    <div
                      key={cell.idx}
                      className={`brick brick-empty ${brickClass}`}
                      aria-label="Empty brick slot"
                      role="listitem"
                    />
                  );
                })}
              </div>
            ))}
            {/* Door at base */}
            <div className="flex justify-center mt-1">
              <div
                className="h-6 sm:h-8 w-10 sm:w-12 rounded-t-md brick"
                style={{ background: "var(--ochre)" }}
                aria-hidden
              />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <p className="font-display text-2xl sm:text-3xl text-foreground">
                £{Number(stats?.amount_raised ?? 0).toLocaleString("en-GB")}
                <span className="text-muted-foreground text-lg sm:text-xl font-body font-normal">
                  {" "}raised of £{Number(stats?.target ?? 25000).toLocaleString("en-GB")}
                </span>
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                {stats?.supporters ?? 0} supporters
              </p>
            </div>
            <div
              className="mt-3 h-4 w-full rounded-full bg-muted overflow-hidden border border-border/70"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Fundraising progress"
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background:
                    "linear-gradient(90deg, var(--terracotta), var(--ochre))",
                }}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold shadow-sm hover:bg-primary/90 transition"
              >
                Donate to Port Studio
              </a>
              <a
                href="#add-brick"
                className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-5 py-2.5 text-base font-semibold border border-border/70 hover:bg-secondary/80 transition"
              >
                Add your brick
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Add a brick form */}
      <section id="add-brick" className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-3xl bg-card p-6 sm:p-10 border border-border/70 shadow-sm">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground">Add your brick</h2>
          <p className="mt-2 text-muted-foreground">
            Leave a short message of support. Every brick helps us get closer to opening Port Studio.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-semibold">
                Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                maxLength={60}
                className="rounded-xl bg-background h-12 text-base"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-semibold">
                Message <span className="text-muted-foreground font-normal">(max 80 characters)</span>
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 80))}
                placeholder="Something kind, hopeful, or playful…"
                maxLength={80}
                rows={3}
                className="rounded-xl bg-background text-base resize-none"
                required
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/80</p>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {submitting ? "Adding your brick…" : "Add my brick"}
            </Button>
          </form>
        </div>
      </section>

      {/* Quotes */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="font-display text-2xl sm:text-3xl text-center text-foreground">
          Voices from our community
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              quote: "I felt supported. Being part of a group gave me confidence I didn't know I had.",
              who: "Debbie",
              color: "var(--terracotta)",
            },
            {
              quote: "For the first time I felt like an artist, not someone who just does art.",
              who: "Marcus",
              color: "var(--ochre)",
            },
            {
              quote: "A calm, kind space where my brain feels welcome. We need more places like this.",
              who: "Jen",
              color: "var(--teal-warm)",
            },
          ].map((q) => (
            <figure
              key={q.who}
              className="rounded-3xl bg-card p-6 border border-border/70 shadow-sm relative"
            >
              <span
                className="absolute -top-3 left-6 w-10 h-5 rounded brick"
                style={{ backgroundColor: q.color }}
                aria-hidden
              />
              <blockquote className="text-base sm:text-lg text-foreground leading-relaxed">
                “{q.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">
                — {q.who}, Figment Arts participant
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Figment Arts · Brighton &amp; Shoreham</p>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Support Port Studio on Crowdfunder →
          </a>
        </div>
      </footer>

      {/* Floating donate (mobile) */}
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden fixed bottom-4 right-4 z-40 inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg"
      >
        Donate
      </a>
    </div>
  );
}
