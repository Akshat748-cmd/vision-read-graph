import { motion } from "framer-motion";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative w-16 h-16 mb-6">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <div className="absolute inset-4 rounded-full gradient-primary animate-pulse-soft" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Analyzing content...</h3>
      <p className="font-body text-sm text-muted-foreground">Generating summary and mind map</p>
    </div>
  );
}
