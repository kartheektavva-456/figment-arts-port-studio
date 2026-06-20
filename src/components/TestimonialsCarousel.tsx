import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Quote = {
  quote: string;
  who: string;
  attribution: string;
  color: string;
};

const QUOTES: Quote[] = [
  {
    quote:
      "I was looking forward to it, my first exhibition, it was good to get our art out there, I sold a piece of work!",
    who: "Kirsty",
    attribution: "Figment Arts participant",
    color: "var(--terracotta)",
  },
  {
    quote:
      "It was generally nice to have lots of artists together in one space, seeing your work alongside each other was really interesting.",
    who: "Will",
    attribution: "Figment Arts participant",
    color: "var(--ochre)",
  },
  {
    quote:
      "I felt supported. Being part of a group gave me confidence I didn't know I had.",
    who: "Debbie",
    attribution: "Figment Arts participant",
    color: "var(--teal-warm)",
  },
  {
    quote:
      "It was a lovely place, with a lovely view so it was really nice to visit there and see my work.",
    who: "Sarah",
    attribution: "Figment Arts participant",
    color: "var(--coral)",
  },
  {
    quote:
      "I'm coming to this club now for 6 weeks and I thoroughly enjoy every moment. It's getting me out of the house, I meet new people and learn new skills.",
    who: "Eastbrook Thursday Creative Club participant",
    attribution: "",
    color: "var(--sage)",
  },
  {
    quote:
      "Great idea and such beautiful results. Art really is for everyone through projects like this.",
    who: "Visitor",
    attribution: "A Room Of Our Own open studio",
    color: "var(--teal-warm)",
  },
];

export function TestimonialsCarousel() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    duration: reducedMotion ? 0 : 25,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <div
      className="relative mt-8"
      role="region"
      aria-roledescription="carousel"
      aria-label="Voices from our community"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-5">
          {QUOTES.map((q) => (
            <div
              key={q.who + q.quote.slice(0, 10)}
              className="pl-5 min-w-0 shrink-0 grow-0 basis-full md:basis-1/3"
              role="group"
              aria-roledescription="slide"
            >
              <figure className="h-full rounded-3xl bg-card p-6 border border-border/70 shadow-sm relative">
                <span
                  className="absolute -top-3 left-6 w-10 h-5 rounded brick"
                  style={{ backgroundColor: q.color }}
                  aria-hidden
                />
                <blockquote className="text-base sm:text-lg text-foreground leading-relaxed">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">
                  — {q.who}
                  {q.attribution ? `, ${q.attribution}` : ""}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          aria-label="Previous testimonial"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canNext}
          aria-label="Next testimonial"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
