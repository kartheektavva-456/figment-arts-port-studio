import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListBricks, adminDeleteBrick } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type Brick = {
  id: string;
  name: string;
  message: string;
  created_at: string;
  position_index: number;
  color: string;
};

function Admin() {
  const listFn = useServerFn(adminListBricks);
  const deleteFn = useServerFn(adminDeleteBrick);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (pw: string, isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFn({
        data: { password: pw, ...(isRefresh ? { _refetch: Date.now() } : {}) },
      });
      setBricks(res.bricks as Brick[]);
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    load(password);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brick?")) return;
    try {
      await deleteFn({ data: { password, id } });
      setBricks((b) => b.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (!unlocked) {
    return (
      <main className="min-h-dvh paper flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-3xl bg-card border border-border/70 shadow-sm p-6 sm:p-8">
          <h1 className="font-display text-2xl text-foreground">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the admin password to manage bricks.
          </p>
          <form onSubmit={handleUnlock} className="mt-5 grid gap-3">
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl h-11 bg-background text-base"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading || !password}
              className="rounded-full h-11 font-semibold bg-primary hover:bg-primary/90"
            >
              {loading ? "Checking…" : "Unlock"}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive font-medium">
                {error}
              </p>
            )}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh paper px-4 sm:px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl text-foreground">Bricks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {bricks.length} {bricks.length === 1 ? "brick" : "bricks"} on the wall
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => load(password, true)}
            disabled={loading}
            className="rounded-full border-border"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        <div className="rounded-3xl bg-card border border-border/70 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bricks.map((b) => (
                <TableRow key={b.id} className="align-top">
                  <TableCell className="text-muted-foreground">
                    {b.position_index}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-block h-4 w-6 rounded-sm border border-border/60"
                      style={{ backgroundColor: b.color }}
                      aria-hidden
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {b.name}
                  </TableCell>
                  <TableCell className="text-foreground/90 max-w-md">
                    {b.message}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                    {new Date(b.created_at).toLocaleString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(b.id)}
                      className="rounded-full"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {bricks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    No bricks yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
