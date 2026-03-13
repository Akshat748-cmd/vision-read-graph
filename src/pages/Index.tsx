import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ReadingSidebar } from "@/components/ReadingSidebar";
import { SummaryView } from "@/components/SummaryView";
import { MindMapView } from "@/components/MindMapView";
import { RelatedStudies } from "@/components/RelatedStudies";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { AuthPage } from "@/components/AuthPage";
import { ShareSaveButtons } from "@/components/ShareSaveButtons";
import { useReadings } from "@/hooks/useReadings";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon, PanelLeftClose, PanelLeft, Brain, LogOut, User, Share2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function buildFullReadingText(reading: any): string {
  const lines: string[] = [
    reading.title,
    "=".repeat(reading.title.length),
    "",
    "SUMMARY",
    "-------",
    reading.summary,
    "",
    "KEY CONCEPTS",
    "------------",
    ...reading.keyConcepts.map((c: any) => `• ${c.title}: ${c.description}`),
    "",
    "IMPORTANT FACTS",
    "---------------",
    ...reading.importantFacts.map((f: string) => `• ${f}`),
  ];
  return lines.join("\n");
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { readings, activeReading, setActiveReading, searchTopic, deleteReading, isLoading } = useReadings();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        <div className="w-10 h-10 rounded-full gradient-primary animate-pulse-soft" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleShareApp = async () => {
    const appUrl = window.location.origin;
    const shareData: ShareData = {
      title: "MindRead — AI Reading Assistant",
      text: "Turn any topic into visual mind maps, summaries, and key insights with MindRead!",
      url: appUrl,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(appUrl).catch(() => {});
      toast.success("App link copied to clipboard!");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden gradient-surface">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <ReadingSidebar
              readings={readings}
              activeReading={activeReading}
              onSelect={setActiveReading}
              onDelete={deleteReading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              data-testid="button-toggle-sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold text-foreground">MindRead</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share App */}
            <button
              onClick={handleShareApp}
              data-testid="button-share-app"
              title="Share MindRead"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-xs font-body font-medium shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share App</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs font-body font-medium truncate max-w-[120px]">
                {user.username ?? user.email ?? 'User'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={signOut}
              data-testid="button-signout"
              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
              <SearchBar onSearch={searchTopic} isLoading={isLoading} />
            </div>

            {isLoading ? (
              <LoadingState />
            ) : activeReading ? (
              <div className="space-y-6 animate-fade-in">
                {/* Reading title + save/share */}
                <div className="text-center mb-6 relative">
                  <h1 className="font-display text-3xl font-bold text-foreground">{activeReading.title}</h1>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {activeReading.keyConcepts.length} concepts · {activeReading.importantFacts.length} facts
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <ShareSaveButtons
                      title={activeReading.title}
                      text={buildFullReadingText(activeReading)}
                      size="md"
                      variant="default"
                      showLabels
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Mind Map
                  </h3>
                  <MindMapView data={activeReading.mindMapData} title={activeReading.title} />
                </div>
                <SummaryView reading={activeReading} />

                {/* Related Facts & Studies */}
                <RelatedStudies topic={activeReading.title} />

                {/* Finish Button */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-3 py-8"
                >
                  <div className="h-px w-24 bg-border mb-2" />
                  <p className="font-body text-xs text-muted-foreground">You've reached the end of this reading</p>
                  <button
                    onClick={() => {
                      toast.success("Reading saved! Returning to home.", { duration: 3000 });
                      setActiveReading(null);
                    }}
                    data-testid="button-finish-reading"
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl gradient-primary text-primary-foreground font-body font-semibold text-sm shadow-elevated hover:opacity-90 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finish Reading
                  </button>
                </motion.div>
              </div>
            ) : (
              <EmptyState onSearch={searchTopic} isLoading={isLoading} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
