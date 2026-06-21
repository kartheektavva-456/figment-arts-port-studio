import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AddBrickInput = z.object({
  name: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const addBrick = createServerFn({ method: "POST" })
  .inputValidator((data) => AddBrickInput.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const displayName = data.name.trim() || "Anonymous";

    // Retry on unique-violation races: re-fetch occupied slots and try the
    // next-lowest free index. The UNIQUE constraint on position_index makes
    // this atomic at the DB level.
    const MAX_ATTEMPTS = 8;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { data: existing, error: selErr } = await supabase
        .from("bricks")
        .select("position_index")
        .order("position_index", { ascending: true });
      if (selErr) throw new Error(selErr.message);

      const used = new Set((existing ?? []).map((b) => b.position_index));
      let position_index = 0;
      while (used.has(position_index)) position_index++;

      const { data: inserted, error: insErr } = await supabase
        .from("bricks")
        .insert({
          name: displayName,
          message: data.message,
          color: data.color,
          position_index,
        })
        .select("id,name,message,color,position_index")
        .single();

      if (!insErr && inserted) {
        return { brick: inserted };
      }

      // Postgres unique_violation: another submitter took this slot — retry.
      if (insErr && (insErr.code === "23505" || /duplicate key/i.test(insErr.message))) {
        lastError = insErr;
        continue;
      }
      throw new Error(insErr?.message ?? "Failed to add brick");
    }

    throw new Error(
      lastError instanceof Error
        ? `Couldn't reserve a brick slot after retries: ${lastError.message}`
        : "Couldn't reserve a brick slot after retries.",
    );
  });
