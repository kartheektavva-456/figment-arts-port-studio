import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/thermometer")({
  component: Thermometer,
});

const DONATE_URL = "https://www.crowdfunder.co.uk/p/figment-arts-port-studio";

const LOGO_URL = "https://figmentarts.org.uk/wp-content/themes/figmentarts/assets/img/logo.png";

type Stats = {
  amount_raised: number;
  target: number;
  supporters: number;
};

function Thermometer() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("campaign_stats")
      .select("amount_raised,target,supporters")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      setStats(data as Stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const pct = stats
    ? Math.min(100, Math.round((Number(stats.amount_raised) / Number(stats.target)) * 100))
    : 0;

  return (
    <div className="w-full max-w-[400px] mx-auto p-4">
      <div className="rounded-2xl bg-card border border-border/70 p-5 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-foreground text-center">
          Port Studio
        </h2>
        <p className="text-center text-sm text-muted-foreground mt-1">
          Brick by Brick campaign
        </p>

        <div className="mt-5">
          {loading && !stats ? (
            <div className="h-28 flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
                aria-label="Loading campaign stats"
              />
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between flex-wrap gap-1">
                <p className="font-display text-2xl font-semibold text-foreground">
                  £{Number(stats?.amount_raised ?? 0).toLocaleString("en-GB")}
                  <span className="text-muted-foreground text-base font-body font-normal ml-1">
                    raised of £{Number(stats?.target ?? 25000).toLocaleString("en-GB")}
                  </span>
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

              <p className="mt-2 text-sm text-muted-foreground text-right">
                {stats?.supporters ?? 0} supporters
              </p>

              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block w-full text-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold shadow-sm hover:bg-primary/90 transition"
              >
                Donate
              </a>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img
            src={LOGO_URL}
            alt="Figment Arts"
            className="h-5 w-auto opacity-70"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
