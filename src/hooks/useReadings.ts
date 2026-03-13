import { useState, useCallback, useEffect } from "react";
import { Reading, MindMapNode, Concept } from "@/types/reading";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function useReadings() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [activeReading, setActiveReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved readings from API
  useEffect(() => {
    if (!user) {
      setReadings([]);
      setActiveReading(null);
      return;
    }

    const loadReadings = async () => {
      try {
        const r = await fetch("/api/readings", { credentials: "include" });
        if (!r.ok) {
          console.error("Failed to load readings:", r.status);
          return;
        }
        const data = await r.json();
        const mapped: Reading[] = (data || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          query: r.query,
          summary: r.summary,
          keyConcepts: r.keyConcepts as Concept[],
          importantFacts: r.importantFacts as string[],
          mindMapData: r.mindMapData as MindMapNode,
          createdAt: new Date(r.createdAt),
        }));
        setReadings(mapped);
      } catch (err) {
        console.error("Failed to load readings:", err);
      }
    };

    loadReadings();
  }, [user]);

  const searchTopic = useCallback(async (query: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error || "Failed to analyze topic. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = await r.json();

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      // Save to database via API
      const saveRes = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: data.title || query,
          query,
          summary: data.summary,
          keyConcepts: data.keyConcepts,
          importantFacts: data.importantFacts,
          mindMapData: data.mindMap,
        }),
      });

      let savedId = generateId();
      if (saveRes.ok) {
        const saved = await saveRes.json();
        savedId = saved.id || savedId;
      } else {
        toast.error("Analyzed but failed to save.");
      }

      const reading: Reading = {
        id: savedId,
        title: data.title || query,
        query,
        summary: data.summary,
        keyConcepts: data.keyConcepts,
        importantFacts: data.importantFacts,
        mindMapData: data.mindMap,
        createdAt: new Date(),
      };

      setReadings((prev) => [reading, ...prev]);
      setActiveReading(reading);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteReading = useCallback(async (id: string) => {
    const r = await fetch(`/api/readings/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) {
      toast.error("Failed to delete reading");
      return;
    }
    setReadings((prev) => prev.filter((r) => r.id !== id));
    setActiveReading((prev) => (prev?.id === id ? null : prev));
  }, []);

  return { readings, activeReading, setActiveReading, searchTopic, deleteReading, isLoading };
}
