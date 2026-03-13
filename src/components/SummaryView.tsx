import { useState, useRef } from "react";
import { Reading } from "@/types/reading";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, CheckCircle, FileText, Loader2, X, BookOpen, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ShareSaveButtons } from "./ShareSaveButtons";

interface SummaryViewProps {
  reading: Reading;
}

function renderArticle(text: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, pi) => {
    const parts = para.split(/\*\*([^*]+)\*\*/g);
    const line = parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
    );
    const isHeading = para.startsWith("**") && para.endsWith("**") && parts.length === 3;
    if (isHeading) {
      return (
        <p key={pi} className="font-body font-semibold text-sm text-foreground mt-4 mb-1">
          {parts[1]}
        </p>
      );
    }
    return (
      <p key={pi} className="font-body text-sm text-card-foreground/80 leading-relaxed">
        {line}
      </p>
    );
  });
}

function buildFullReadingText(reading: Reading): string {
  return [
    reading.title,
    "=".repeat(reading.title.length),
    "",
    "SUMMARY",
    "-------",
    reading.summary,
    "",
    "KEY CONCEPTS",
    "------------",
    ...reading.keyConcepts.map((c) => `• ${c.title}: ${c.description}`),
    "",
    "IMPORTANT FACTS",
    "---------------",
    ...reading.importantFacts.map((f) => `• ${f}`),
  ].join("\n");
}

export function SummaryView({ reading }: SummaryViewProps) {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [articles, setArticles] = useState<Record<string, string>>({});
  const [loadingConcept, setLoadingConcept] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const handleConceptClick = async (conceptTitle: string) => {
    if (selectedConcept === conceptTitle) {
      setSelectedConcept(null);
      return;
    }
    setSelectedConcept(conceptTitle);
    if (articles[conceptTitle]) {
      setTimeout(() => articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      return;
    }
    setLoadingConcept(conceptTitle);
    try {
      const r = await fetch("/api/concept-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ concept: conceptTitle, context: reading.title }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to load article");
      setArticles((prev) => ({ ...prev, [conceptTitle]: data.article }));
      setTimeout(() => articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      toast.error(e.message || "Failed to load article");
      setSelectedConcept(null);
    } finally {
      setLoadingConcept(null);
    }
  };

  const fullReadingText = buildFullReadingText(reading);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 shadow-card border border-border"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl font-semibold text-card-foreground">Summary</h3>
          </div>
          <ShareSaveButtons title={reading.title} text={fullReadingText} />
        </div>
        <p className="font-body text-card-foreground/80 leading-relaxed">{reading.summary}</p>
      </motion.div>

      {/* Key Concepts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="font-display text-xl font-semibold text-foreground">Key Concepts</h3>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-4">Tap any concept to read a detailed article</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reading.keyConcepts.map((concept, i) => {
            const isSelected = selectedConcept === concept.title;
            const isLoading = loadingConcept === concept.title;
            return (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`bg-card rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary shadow-elevated ring-2 ring-primary/20"
                    : "border-border hover:shadow-elevated hover:border-primary/40"
                }`}
              >
                <button
                  onClick={() => handleConceptClick(concept.title)}
                  data-testid={`concept-card-${i}`}
                  className="w-full text-left p-4 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-body font-semibold text-sm mb-1 transition-colors ${isSelected ? "text-primary" : "text-card-foreground group-hover:text-primary"}`}>
                        {concept.title}
                      </h4>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">{concept.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-180 text-primary" : "group-hover:text-primary"}`} />
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Loading state for concept article */}
      <AnimatePresence>
        {loadingConcept && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card rounded-2xl p-5 border border-primary/30 flex items-center gap-3"
          >
            <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="font-body text-sm font-medium text-foreground">Generating deep dive…</p>
              <p className="font-body text-xs text-muted-foreground">"{loadingConcept}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep Dive Article Panel */}
      <AnimatePresence>
        {selectedConcept && articles[selectedConcept] && (
          <motion.div
            ref={articleRef}
            key={selectedConcept}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl shadow-elevated border border-primary/30 overflow-hidden"
          >
            {/* Article header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground uppercase tracking-wide">Deep Dive</p>
                  <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{selectedConcept}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                data-testid="button-close-article"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Article body */}
            <div className="px-6 py-4 space-y-3">
              {renderArticle(articles[selectedConcept])}
            </div>

            {/* Action bar — save & share the deep dive */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
              <p className="font-body text-xs text-muted-foreground">Save or share this deep dive</p>
              <ShareSaveButtons
                title={`Deep Dive: ${selectedConcept}`}
                text={articles[selectedConcept]}
                size="md"
                variant="default"
                showLabels
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Important Facts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 shadow-card border border-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl font-semibold text-card-foreground">Important Facts</h3>
        </div>
        <ul className="space-y-3">
          {reading.importantFacts.map((fact, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className="flex items-start gap-3"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="font-body text-sm text-card-foreground/80 leading-relaxed">{fact}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
