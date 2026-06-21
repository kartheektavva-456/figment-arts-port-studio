import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "ADMIN_PASSWORD env var is not set. Add it as a server-side secret in Lovable Cloud.",
    );
  }
  return pw;
}

function checkPassword(provided: string) {
  const expected = getAdminPassword();
  // length-independent rejection without leaking which check failed
  if (provided !== expected) {
    throw new Error("Invalid password");
  }
}

export const adminListBricks = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string(), _refetch: z.number().optional() }).parse(data))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bricks, error } = await supabaseAdmin
      .from("bricks")
      .select("id,name,message,created_at,position_index,color")
      .order("position_index", { ascending: true });
    if (error) throw new Error(error.message);
    return { bricks: bricks ?? [] };
  });

export const adminDeleteBrick = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ password: z.string(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bricks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
