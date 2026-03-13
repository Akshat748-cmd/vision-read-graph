import { Reading } from "@/types/reading";
import { BookOpen, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface ReadingSidebarProps {
  readings: Reading[];
  activeReading: Reading | null;
  onSelect: (reading: Reading) => void;
  onDelete: (id: string) => void;
}

export function ReadingSidebar({ readings, activeReading, onSelect, onDelete }: ReadingSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sidebar-primary" />
          <h2 className="font-display text-lg font-semibold text-sidebar-foreground">Saved Readings</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-body">{readings.length} articles analyzed</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {readings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-body">No readings yet</p>
              <p className="text-xs mt-1">Search a topic to get started</p>
            </motion.div>
          )}

          {readings.map((reading) => (
            <motion.div
              key={reading.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                activeReading?.id === reading.id
                  ? "bg-sidebar-accent border border-sidebar-primary/20"
                  : "hover:bg-sidebar-accent"
              }`}
              onClick={() => onSelect(reading)}
            >
              <h3 className="font-body font-medium text-sm text-sidebar-foreground truncate pr-6">
                {reading.title}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-body">{format(reading.createdAt, "MMM d, h:mm a")}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(reading.id); }}
                className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
