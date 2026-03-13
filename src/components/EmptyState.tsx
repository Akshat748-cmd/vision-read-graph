import { motion } from "framer-motion";
import { Brain, Sparkles, BookOpen } from "lucide-react";

interface EmptyStateProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const FEATURES = [
  {
    icon: BookOpen,
    label: "Smart Summaries",
    desc: "Condensed key points",
    sample: "The Science of Sleep and Memory",
  },
  {
    icon: Brain,
    label: "Mind Maps",
    desc: "Visual topic exploration",
    sample: "Climate Change and Global Warming",
  },
  {
    icon: Sparkles,
    label: "Key Insights",
    desc: "Facts & concepts",
    sample: "Quantum Computing Explained",
  },
];

export function EmptyState({ onSearch, isLoading }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative mb-8"
      >
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-mindmap">
          <Brain className="h-10 w-10 text-primary-foreground" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-accent" />
        </motion.div>
      </motion.div>

      <h2 className="font-display text-2xl font-bold text-foreground mb-2">AI Reading Assistant</h2>
      <p className="font-body text-muted-foreground text-center max-w-md mb-3 leading-relaxed">
        Paste any article or search a topic to generate AI-powered summaries, key insights, and interactive mind maps.
      </p>
      <p className="font-body text-xs text-muted-foreground mb-8">Or try one of these quick examples below</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
        {FEATURES.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => !isLoading && onSearch(item.sample)}
            disabled={isLoading}
            data-testid={`feature-card-${i}`}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center cursor-pointer hover:border-primary/50 hover:shadow-elevated transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
              <item.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="font-body font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">{item.label}</p>
            <p className="font-body text-[10px] text-muted-foreground mt-0.5 mb-2">{item.desc}</p>
            <p className="font-body text-[10px] text-primary/70 font-medium truncate">Try: "{item.sample}"</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
