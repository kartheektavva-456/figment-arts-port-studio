import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListBricks, adminDeleteBrick } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const load = async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFn({ data: { password: pw } });
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
      <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Admin</h1>
        <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={loading || !password}>
            {loading ? "Checking…" : "Unlock"}
          </Button>
          {error && <p style={{ color: "crimson", fontSize: 14 }}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24 }}>Bricks ({bricks.length})</h1>
        <Button variant="outline" onClick={() => load(password)} disabled={loading}>
          Refresh
        </Button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
            <th style={th}>#</th>
            <th style={th}>Name</th>
            <th style={th}>Message</th>
            <th style={th}>Created</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {bricks.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={td}>{b.position_index}</td>
              <td style={td}>{b.name}</td>
              <td style={td}>{b.message}</td>
              <td style={td}>{new Date(b.created_at).toLocaleString()}</td>
              <td style={td}>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {bricks.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...td, textAlign: "center", color: "#6b7280" }}>
                No bricks yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 12px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 12px", verticalAlign: "top" };
