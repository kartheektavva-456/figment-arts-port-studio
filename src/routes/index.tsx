import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { Facebook, Instagram } from "lucide-react";
import { ShareBrickModal } from "@/components/ShareBrickModal";

const SITE_URL = "https://preview--brick-by-brick-hub.lovable.app/";
const OG_IMAGE = "https://figmentarts.org.uk/wp-content/uploads/2025/08/about-us.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Figment Arts community at Port Studio" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
});

const DONATE_URL = "https://www.crowdfunder.co.uk/p/figment-arts-port-studio";

const PALETTE = ["#C56B4A", "#D9A441", "#5B8C8A", "#E8856B", "#8FA877"];

// House silhouette: gable roof (narrowing to a point) above a rectangular wall.
// Top-down rows. Roof = [2, 6, 10] narrows symmetrically; wall = 5 rows of 10.
// Total slots = 2+6+10 + 10*5 = 68
const ROWS = [2, 6, 10, 10, 10, 10, 10, 10];

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
  const [shareData, setShareData] = useState<{ name: string; message: string; color: string } | null>(null);
  const [newBrickIds, setNewBrickIds] = useState<Set<string>>(new Set());
  const [milestone, setMilestone] = useState<string | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);

  const fetchAll = async () => {
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("bricks").select("id,name,message,color,position_index").order("position_index", { ascending: true }),
      supabase.from("campaign_stats").select("amount_raised,target,supporters").eq("id", 1).maybeSingle(),
    ]);
    if (b) {
      const list = b as Brick[];
      if (knownIdsRef.current === null) {
        // First load: seed known IDs, no animation
        knownIdsRef.current = new Set(list.map((x) => x.id));
      } else {
        const fresh = list.filter((x) => !knownIdsRef.current!.has(x.id)).map((x) => x.id);
        if (fresh.length) {
          fresh.forEach((id) => knownIdsRef.current!.add(id));
          setNewBrickIds((prev) => {
            const next = new Set(prev);
            fresh.forEach((id) => next.add(id));
            return next;
          });
          window.setTimeout(() => {
            setNewBrickIds((prev) => {
              const next = new Set(prev);
              fresh.forEach((id) => next.delete(id));
              return next;
            });
          }, 1200);
        }
      }
      setBricks(list);
    }
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

  const TOTAL_SLOTS = ROWS.reduce((a, b) => a + b, 0);
  const FUNDING_MILESTONES: { threshold: number; label: string; key: string }[] = [
    { threshold: 0.25, label: "A quarter of the way to Port Studio!", key: "f25" },
    { threshold: 0.5, label: "Halfway funded!", key: "f50" },
    { threshold: 0.75, label: "Almost there!", key: "f75" },
    { threshold: 1, label: "Port Studio is fully funded!", key: "f100" },
  ];

  useEffect(() => {
    if (typeof window === "undefined" || !stats) return;
    const funded = Number(stats.amount_raised) / Number(stats.target);
    for (let i = FUNDING_MILESTONES.length - 1; i >= 0; i--) {
      const m = FUNDING_MILESTONES[i];
      if (funded >= m.threshold) {
        const seenKey = `port-studio-milestone-${m.key}`;
        if (!sessionStorage.getItem(seenKey)) {
          sessionStorage.setItem(seenKey, "1");
          setMilestone(m.label);
          setTimeout(() => setMilestone(null), 5000);
        }
        break;
      }
    }
  }, [stats?.amount_raised, stats?.target]);



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
    const displayName = name.trim() || "Anonymous";
    const { error } = await supabase.from("bricks").insert({
      name: displayName,
      message: trimmed,
      color,
      position_index,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't add your brick — please try again.");
      return;
    }
    setShareData({ name: displayName, message: trimmed, color });
    setName("");
    setMessage("");
  };

  const pct = stats ? Math.min(100, Math.round((Number(stats.amount_raised) / Number(stats.target)) * 100)) : 0;

  // Build the brick grid as flex rows, each centered.
  // Compute bottom-up fill mapping so bricks stack from the base upward.
  const rowStarts = ROWS.reduce<number[]>((acc, count) => {
    acc.push((acc[acc.length - 1] ?? 0) + count);
    return acc;
  }, [0]).slice(0, -1);

  const bottomUpFillOrder: number[] = [];
  for (let r = ROWS.length - 1; r >= 0; r--) {
    for (let c = 0; c < ROWS[r]; c++) {
      bottomUpFillOrder.push(rowStarts[r] + c);
    }
  }
  const inverseFillOrder = new Array<number>(TOTAL_SLOTS);
  bottomUpFillOrder.forEach((visualIdx, posIdx) => {
    inverseFillOrder[visualIdx] = posIdx;
  });

  const layout = ROWS.map((count, rowIdx) => {
    const cells = Array.from({ length: count }, (_, i) => {
      const idx = rowStarts[rowIdx] + i;
      const lookupIdx = inverseFillOrder[idx];
      return { idx, brick: byIndex.get(lookupIdx) };
    });
    return cells;
  });

  return (
    <div className="min-h-screen paper">
      <Toaster position="top-center" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src="https://figmentarts.org.uk/wp-content/themes/figmentarts/assets/img/logo.png"
              alt="Figment Arts logo"
              className="h-7 sm:h-8 w-auto"
            />
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
      <section id="top" className="relative overflow-hidden pt-10 sm:pt-16 pb-6 text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://figmentarts.org.uk/wp-content/uploads/2025/08/about-us.jpg)", filter: "sepia(15%) saturate(85%)" }}
        />
        <div className="absolute inset-0 bg-background/88" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
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
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-foreground/80 italic">
            Figment Arts works with people to make art that reflects their lives and communities.
          </p>
        </div>
      </section>

      {/* Building */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-4">
        <div className="rounded-3xl bg-card/60 border border-border/70 p-4 sm:p-8 shadow-sm">
          <div className="relative mx-auto pb-16 sm:pb-20" style={{ maxWidth: "560px" }}>
            <svg
              className="absolute top-0 left-0 w-full h-auto pointer-events-none"
              viewBox="0 0 680 520"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                <linearGradient id="skyR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FAF3E7" />
                  <stop offset="100%" stopColor="#F3E4C8" />
                </linearGradient>
                <linearGradient id="roofR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B25A38" />
                  <stop offset="100%" stopColor="#8F4729" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="680" height="520" fill="url(#skyR)" />
              <ellipse cx="340" cy="470" rx="240" ry="14" fill="#DCCBA8" opacity="0.5" />
              <polygon points="200,210 340,100 480,210" fill="url(#roofR)" />
              <line x1="200" y1="210" x2="340" y2="100" stroke="#6E3A20" strokeWidth="1" opacity="0.5" />
              <line x1="480" y1="210" x2="340" y2="100" stroke="#6E3A20" strokeWidth="1" opacity="0.5" />
              <rect x="222" y="210" width="236" height="240" fill="#EEDFC0" />
              <g opacity="0.18" stroke="#8F6A3E" strokeWidth="0.5">
                <line x1="222" y1="232" x2="458" y2="232" />
                <line x1="222" y1="264" x2="458" y2="264" />
                <line x1="222" y1="296" x2="458" y2="296" />
                <line x1="222" y1="328" x2="458" y2="328" />
                <line x1="222" y1="360" x2="458" y2="360" />
                <line x1="222" y1="392" x2="458" y2="392" />
                <line x1="222" y1="424" x2="458" y2="424" />
              </g>
              <rect x="335" y="95" width="6" height="20" fill="#6E3A20" />
              <ellipse cx="338" cy="88" rx="14" ry="8" fill="#7FA06A" />
              <path d="M250 248 Q250 230 268 230 Q286 230 286 248 L286 310 L250 310 Z" fill="#4F8C82" opacity="0.9" />
              <path d="M254 250 Q254 236 268 236 Q282 236 282 250 L282 306 L254 306 Z" fill="#FBF1DF" />
              <line x1="268" y1="236" x2="268" y2="306" stroke="#4F8C82" strokeWidth="1.2" />
              <line x1="254" y1="270" x2="282" y2="270" stroke="#4F8C82" strokeWidth="1.2" />
              <path d="M394 248 Q394 230 412 230 Q430 230 430 248 L430 310 L394 310 Z" fill="#C1693F" opacity="0.9" />
              <path d="M398 250 Q398 236 412 236 Q426 236 426 250 L426 306 L398 306 Z" fill="#FBF1DF" />
              <line x1="412" y1="236" x2="412" y2="306" stroke="#C1693F" strokeWidth="1.2" />
              <line x1="398" y1="270" x2="426" y2="270" stroke="#C1693F" strokeWidth="1.2" />
              <rect x="316" y="368" width="48" height="82" rx="2" fill="#6E3A20" />
              <rect x="320" y="372" width="40" height="74" rx="1" fill="#A8552F" />
              <circle cx="352" cy="410" r="2" fill="#EEDFC0" />
              <text x="340" y="488" textAnchor="middle" fill="#6E3A20" fontFamily="serif" fontSize="16" letterSpacing="0.5">Port Studio</text>
            </svg>

            <div
              className="relative z-10 flex flex-col gap-1.5 sm:gap-2"
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
                              className={`brick brick-filled ${brickClass} ${newBrickIds.has(cell.brick.id) ? "brick-new" : ""} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
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
          </div>

          {/* Progress */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <p className="font-display text-2xl sm:text-3xl text-foreground">
                £{Number(stats?.amount_raised ?? 0).toLocaleString("en-GB")}
                <span className="text-muted-foreground text-lg sm:text-xl font-body font-normal">
                  {" "}raised of £{Number(stats?.target ?? 25000).toLocaleString("en-GB")}
                </span>
                <span className="ml-2 inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm sm:text-base font-semibold align-middle">
                  {pct}% funded
                </span>
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                {stats?.supporters ?? 0} supporters · {bricks.length}/{TOTAL_SLOTS} bricks
              </p>
            </div>
            <div className="min-h-[1.5rem] mt-2" aria-live="polite">
              {milestone && (
                <p key={milestone} className="milestone-text text-sm sm:text-base font-display text-primary italic">
                  ✦ {milestone}
                </p>
              )}
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

      {/* Community photo */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-4 sm:pb-8">
        <div className="rounded-3xl overflow-hidden border border-border/70 shadow-sm">
          <img
            src="https://figmentarts.org.uk/wp-content/uploads/2025/08/Figment-Arts-mother-and-child-at-ESOP-e1756588350180.jpg"
            alt="A mother and child enjoying a Figment Arts community event together"
            className="w-full h-auto object-cover"
            style={{ filter: "sepia(12%) saturate(88%) brightness(97%)" }}
            loading="lazy"
          />
          <div className="p-4 sm:p-5 bg-card/60 text-center border-t border-border/40">
            <p className="font-display text-base sm:text-lg text-foreground">
              Building belonging, together
            </p>
          </div>
        </div>
      </section>

      {/* Add a brick form */}
      <section id="add-brick" className="mx-auto max-w-2xl px-4 sm:px-6 pt-10 sm:pt-12 pb-8 sm:pb-10">
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="font-display text-2xl sm:text-3xl text-center text-foreground">
          Voices from our community
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              quote: "I was looking forward to it, my first exhibition, it was good to get our art out there, I sold a piece of work!",
              who: "Kirsty",
              color: "var(--terracotta)",
            },
            {
              quote: "It was generally nice to have lots of artists together in one space, seeing your work alongside each other was really interesting.",
              who: "Will",
              color: "var(--ochre)",
            },
            {
              quote: "I felt supported. Being part of a group gave me confidence I didn't know I had.",
              who: "Debbie",
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 grid gap-8 sm:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <p className="font-display text-base font-semibold text-foreground">Figment Arts</p>
            <p className="mt-2">
              A Community Interest Company registered in England.
              <br />
              Company Number: 06364816
            </p>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-foreground">Contact</p>
            <p className="mt-2">
              <a href="mailto:info@figmentarts.org.uk" className="underline hover:text-foreground transition">
                info@figmentarts.org.uk
              </a>
            </p>
            <p className="mt-1">
              Freedom Works, The Mill Building,
              <br />
              31 Chatsworth Rd, Worthing BN11 1LY
            </p>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-foreground">Follow Us</p>
            <div className="mt-2 flex items-center gap-4">
              <a
                href="https://www.facebook.com/figmentarts.org.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition"
                aria-label="Figment Arts on Facebook"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/figmentarts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition"
                aria-label="Figment Arts on Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
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

      {shareData && (
        <ShareBrickModal
          open={!!shareData}
          onClose={() => setShareData(null)}
          onAddAnother={() => {
            setShareData(null);
            if (typeof window !== "undefined") {
              const el = document.getElementById("add-brick");
              el?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          name={shareData.name}
          message={shareData.message}
          color={shareData.color}
        />
      )}
    </div>
  );
}
