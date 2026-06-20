import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = "figment-admin-2026";

export const adminListBricks = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string(), _refetch: z.number().optional() }).parse(data))
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bricks, error } = await supabaseAdmin
      .from("bricks")
      .select("id,name,message,created_at,position_index,color")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bricks: bricks ?? [] };
  });

export const adminDeleteBrick = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ password: z.string(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bricks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
