import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = ["Artificial Intelligence", "Climate Change", "Wildfires", "Quantum Computing", "Space Exploration"];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste an article or enter a topic..."
            disabled={isLoading}
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-card border border-border shadow-card font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 h-10 px-6 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analyze
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { if (!isLoading) onSearch(s); }}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-body font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
