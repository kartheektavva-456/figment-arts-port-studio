import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Facebook, Linkedin, Share2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddAnother: () => void;
  name: string;
  message: string;
  color: string;
};

const SHARE_URL = "https://figment-arts-port-studio.lovable.app/";

export function ShareBrickModal({ open, onClose, onAddAnother, name, message, color }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDataUrl(null);
    try {
      const size = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;


    // Warm paper background
    ctx.fillStyle = "#F4ECDD";
    ctx.fillRect(0, 0, size, size);

    // Subtle paper noise via radial gradient
    const grad = ctx.createRadialGradient(size / 2, size / 2, 100, size / 2, size / 2, size * 0.75);
    grad.addColorStop(0, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(180,140,90,0.08)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Brick color accent — large rounded block on the right
    ctx.save();
    ctx.fillStyle = color;
    roundRect(ctx, size - 360, 120, 280, 160, 24);
    ctx.fill();
    ctx.restore();

    // Logo mark — small brick + wordmark, top-left
    ctx.save();
    ctx.fillStyle = "#C56B4A";
    roundRect(ctx, 80, 80, 56, 28, 6);
    ctx.fill();
    ctx.fillStyle = "#2A2622";
    ctx.font = "600 36px Georgia, 'Times New Roman', serif";
    ctx.textBaseline = "middle";
    ctx.fillText("Figment Arts", 156, 96);
    ctx.restore();

    // Eyebrow
    ctx.fillStyle = "#7A6A55";
    ctx.font = "600 28px 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "alphabetic";
    const eyebrow = "BRICK BY BRICK · PORT STUDIO";
    ctx.fillText(eyebrow, 80, 360);

    // Message — large, wrapped
    ctx.fillStyle = "#2A2622";
    const messageText = `"${message}"`;
    const maxFont = 96;
    const minFont = 56;
    let fontSize = maxFont;
    let lines: string[] = [];
    const maxWidth = size - 160;
    const maxLines = 6;
    while (fontSize >= minFont) {
      ctx.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
      lines = wrapText(ctx, messageText, maxWidth);
      if (lines.length <= maxLines) break;
      fontSize -= 6;
    }
    const lineHeight = Math.round(fontSize * 1.15);
    let y = 430;
    for (const line of lines.slice(0, maxLines)) {
      ctx.fillText(line, 80, y + lineHeight);
      y += lineHeight;
    }

    // Author
    ctx.fillStyle = "#5B4A3A";
    ctx.font = "400 32px Georgia, 'Times New Roman', serif";
    const author = `— ${name?.trim() || "Anonymous"}`;
    ctx.fillText(author, 80, y + lineHeight + 30);

    // Divider
    ctx.strokeStyle = "rgba(90,70,50,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, size - 180);
    ctx.lineTo(size - 80, size - 180);
    ctx.stroke();

    // Footer line(s)
    ctx.fillStyle = "#2A2622";
    ctx.font = "600 28px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("I added my brick to help build Port Studio.", 80, size - 130);
    ctx.fillStyle = "#7A6A55";
    ctx.font = "400 26px 'Helvetica Neue', Arial, sans-serif";
    const join = `Join me at ${stripProtocol(SHARE_URL)}`;
    ctx.fillText(join, 80, size - 90);

      setDataUrl(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Failed to render share card", err);
      toast.error("Couldn't generate share card.");
    }
  }, [open, name, message, color]);


  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "my-port-studio-brick.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy — please copy manually.");
    }
  };

  const shareText = "I added my brick to help build Port Studio — join me!";
  const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleWebShare = async () => {
    try {
      let files: File[] | undefined;
      if (dataUrl) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "my-port-studio-brick.png", { type: "image/png" });
          const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
          if (nav.canShare && nav.canShare({ files: [file] })) {
            files = [file];
          }
        } catch {
          // fall through to text-only share
        }
      }
      await navigator.share({
        title: "Port Studio: Brick by Brick",
        text: shareText,
        url: SHARE_URL,
        ...(files ? { files } : {}),
      });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast.error("Couldn't open share sheet.");
      }
    }
  };

  const openSharePopup = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl bg-card border-border/70">
        <DialogTitle className="font-display text-2xl text-foreground">
          Your brick is in the wall 🎉
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Share your brick and help us reach more people.
        </DialogDescription>

        <div className="mt-2 rounded-2xl overflow-hidden border border-border/70 bg-background">
          {dataUrl ? (
            <img src={dataUrl} alt="Your shareable brick card" className="block w-full h-auto" />
          ) : (
            <div className="aspect-square flex items-center justify-center text-muted-foreground text-sm">
              Generating your card…
            </div>
          )}
        </div>


        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="rounded-full h-11 font-semibold bg-primary hover:bg-primary/90"
          >
            Download image
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="rounded-full h-11 font-semibold border-border"
          >
            Copy link
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {canWebShare && (
            <Button
              onClick={handleWebShare}
              variant="outline"
              className="rounded-full h-11 flex-1 font-semibold border-border gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
          <button
            type="button"
            aria-label="Share on Facebook"
            onClick={() => openSharePopup(fbUrl)}
            className="h-11 w-11 inline-flex items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors"
          >
            <Facebook className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Share on LinkedIn"
            onClick={() => openSharePopup(liUrl)}
            className="h-11 w-11 inline-flex items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors"
          >
            <Linkedin className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAddAnother}
            className="text-sm font-semibold text-primary hover:underline underline-offset-2"
          >
            Add another brick →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}
