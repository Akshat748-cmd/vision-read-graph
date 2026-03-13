import { useState } from "react";
import { Bookmark, BookmarkCheck, Share2, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ShareSaveButtonsProps {
  title: string;
  text: string;
  url?: string;
  size?: "sm" | "md";
  variant?: "default" | "ghost";
  showLabels?: boolean;
}

export function ShareSaveButtons({
  title,
  text,
  url,
  size = "sm",
  variant = "ghost",
  showLabels = false,
}: ShareSaveButtonsProps) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnBase =
    variant === "ghost"
      ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-xs font-body font-medium"
      : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-xs font-body font-medium shadow-sm";

  const handleSave = () => {
    // Build a plain-text file and trigger download
    const content = `${title}\n${"=".repeat(title.length)}\n\n${text}`;
    const blob = new Blob([content], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
    setSaved(true);
    toast.success("Saved to file!");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleShare = async () => {
    const shareData: ShareData = {
      title,
      text: text.slice(0, 400) + (text.length > 400 ? "…" : ""),
      url: url ?? window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // User cancelled — no error needed
      }
    } else {
      // Fallback: copy to clipboard
      const clipText = `${title}\n\n${text.slice(0, 600)}${text.length > 600 ? "…" : ""}\n\n${url ?? window.location.href}`;
      try {
        await navigator.clipboard.writeText(clipText);
        setShared(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setShared(false), 2500);
      } catch {
        toast.error("Unable to share");
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleSave}
        data-testid="button-save"
        title="Save as file"
        className={btnBase}
      >
        <AnimatePresence mode="wait" initial={false}>
          {saved ? (
            <motion.span key="saved" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
              <BookmarkCheck className={`${iconSize} text-primary`} />
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
              <Download className={iconSize} />
            </motion.span>
          )}
        </AnimatePresence>
        {showLabels && <span>{saved ? "Saved" : "Save"}</span>}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleShare}
        data-testid="button-share"
        title="Share"
        className={btnBase}
      >
        <AnimatePresence mode="wait" initial={false}>
          {shared ? (
            <motion.span key="shared" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
              <Check className={`${iconSize} text-primary`} />
            </motion.span>
          ) : (
            <motion.span key="share" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
              <Share2 className={iconSize} />
            </motion.span>
          )}
        </AnimatePresence>
        {showLabels && <span>{shared ? "Shared!" : "Share"}</span>}
      </motion.button>
    </div>
  );
}
