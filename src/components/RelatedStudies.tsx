import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ChevronDown, Loader2, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ShareSaveButtons } from "./ShareSaveButtons";

interface Study {
  title: string;
  teaser: string;
}

interface RelatedStudiesProps {
  topic: string;
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

export function RelatedStudies({ topic }: RelatedStudiesProps) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [articles, setArticles] = useState<Record<string, string>>({});
  const [loadingArticle, setLoadingArticle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingStudies(true);
      try {
        const r = await fetch("/api/related-studies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ topic }),
        });
        const data = await r.json();
        if (!cancelled) setStudies(data.studies || []);
      } catch {
        if (!cancelled) toast.error("Failed to load related studies");
      } finally {
        if (!cancelled) setLoadingStudies(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [topic]);

  const handleStudyClick = async (study: Study) => {
    if (selectedStudy === study.title) {
      setSelectedStudy(null);
      return;
    }
    setSelectedStudy(study.title);
    if (articles[study.title]) return;

    setLoadingArticle(study.title);
    try {
      const r = await fetch("/api/concept-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ concept: study.title, context: topic }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to load article");
      setArticles((prev) => ({ ...prev, [study.title]: data.article }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load article");
      setSelectedStudy(null);
    } finally {
      setLoadingArticle(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-semibold text-foreground">Related Facts & Studies</h3>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">Tap any to explore a deeper study</p>

      {loadingStudies ? (
        <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-body text-sm">Loading related studies…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {studies.map((study, i) => {
            const isSelected = selectedStudy === study.title;
            const isLoadingThis = loadingArticle === study.title;
            return (
              <motion.div
                key={study.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-card rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary shadow-elevated ring-2 ring-primary/20"
                    : "border-border hover:shadow-elevated hover:border-primary/40"
                }`}
              >
                {/* Study card header */}
                <button
                  onClick={() => handleStudyClick(study)}
                  data-testid={`related-study-${i}`}
                  className="w-full text-left p-4 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "gradient-primary" : "bg-primary/10 group-hover:bg-primary/20"}`}>
                        <FlaskConical className={`h-3.5 w-3.5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-body font-semibold text-sm mb-0.5 transition-colors ${isSelected ? "text-primary" : "text-card-foreground group-hover:text-primary"}`}>
                          {study.title}
                        </h4>
                        <p className="font-body text-xs text-muted-foreground leading-relaxed">{study.teaser}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isLoadingThis ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-180 text-primary" : "group-hover:text-primary"}`} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded article */}
                <AnimatePresence>
                  {isSelected && articles[study.title] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border">
                        {/* Article header with label and controls */}
                        <div className="flex items-center justify-between py-3 mb-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-body text-xs font-semibold text-primary uppercase tracking-wide">Deep Study</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ShareSaveButtons
                              title={study.title}
                              text={articles[study.title]}
                              size="sm"
                              variant="default"
                              showLabels
                            />
                            <button
                              onClick={() => setSelectedStudy(null)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {renderArticle(articles[study.title])}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading article inline */}
                <AnimatePresence>
                  {isLoadingThis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="px-4 py-4 flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                        <span className="font-body text-xs">Generating deep study…</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
