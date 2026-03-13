import type { Express } from "express";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

let nodeId = 0;
function addIds(node: any): any {
  const id = `node-${nodeId++}`;
  return {
    id,
    label: node.label,
    children: node.children?.map((c: any) => addIds(c)),
  };
}

export function registerRoutes(app: Express) {
  // Readings
  app.get("/api/readings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const readings = await storage.getReadingsByUser(user.id);
      // Map DB column names to frontend expected format
      const mapped = readings.map((r) => ({
        id: r.id,
        title: r.title,
        query: r.query,
        summary: r.summary,
        keyConcepts: r.keyConcepts,
        importantFacts: r.importantFacts,
        mindMapData: r.mindMapData,
        createdAt: r.createdAt,
      }));
      res.json(mapped);
    } catch (err) {
      console.error("Get readings error:", err);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

  app.post("/api/readings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { title, query, summary, keyConcepts, importantFacts, mindMapData } = req.body;
      const reading = await storage.createReading({
        userId: user.id,
        title,
        query,
        summary,
        keyConcepts,
        importantFacts,
        mindMapData,
      });
      res.json(reading);
    } catch (err) {
      console.error("Create reading error:", err);
      res.status(500).json({ error: "Failed to save reading" });
    }
  });

  app.delete("/api/readings/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      await storage.deleteReading(req.params.id, user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("Delete reading error:", err);
      res.status(500).json({ error: "Failed to delete reading" });
    }
  });

  // AI concept deep-dive article
  app.post("/api/concept-article", requireAuth, async (req, res) => {
    try {
      const { concept, context } = req.body;
      if (!concept) return res.status(400).json({ error: "Concept is required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are an expert writer. Write clear, engaging educational articles. Use markdown-style structure: start with a short intro paragraph, then 2-3 sections with bold headings, and end with a brief takeaway. Keep it concise (250-350 words).",
          },
          {
            role: "user",
            content: `Write a focused article about the concept: "${concept}"${context ? ` in the context of "${context}"` : ""}. Make it informative, accessible, and well-structured.`,
          },
        ],
      });

      const article = response.choices?.[0]?.message?.content || "";
      res.json({ article });
    } catch (err: any) {
      console.error("Concept article error:", err);
      res.status(500).json({ error: err.message || "Failed to generate article" });
    }
  });

  // AI related studies/facts for a topic
  app.post("/api/related-studies", requireAuth, async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic is required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are a research guide. Given a topic, suggest 4 related studies, facts, or sub-topics that deepen understanding. Return JSON only.",
          },
          {
            role: "user",
            content: `For the topic "${topic}", suggest 4 related facts or study areas that would enrich understanding. Return a JSON object: { "studies": [ { "title": "...", "teaser": "One compelling sentence about why this matters." } ] }`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      res.json({ studies: parsed.studies || [] });
    } catch (err: any) {
      console.error("Related studies error:", err);
      res.status(500).json({ error: err.message || "Failed to generate related studies" });
    }
  });

  // AI analyze topic
  app.post("/api/analyze", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });

      const systemPrompt = `You are an AI reading assistant. Given a topic or article text, generate a structured analysis. You MUST respond using the provided tool.`;
      const userPrompt = `Analyze this topic or article and provide a comprehensive reading summary:\n\n${query}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_reading_analysis",
              description: "Generate a structured reading analysis with summary, key concepts, important facts, and mind map data.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "A concise title for the topic (3-6 words)" },
                  summary: { type: "string", description: "A comprehensive 3-4 sentence summary of the topic" },
                  keyConcepts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Concept name (2-4 words)" },
                        description: { type: "string", description: "Brief explanation (1-2 sentences)" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                    description: "4-6 key concepts",
                  },
                  importantFacts: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-7 important facts as concise bullet points",
                  },
                  mindMap: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Root label (the main topic)" },
                      children: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            children: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: { label: { type: "string" } },
                                required: ["label"],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ["label", "children"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["label", "children"],
                    additionalProperties: false,
                    description: "A mind map tree with root, 3-5 branches, each with 2-3 sub-nodes",
                  },
                },
                required: ["title", "summary", "keyConcepts", "importantFacts", "mindMap"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_reading_analysis" } },
      });

      const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in AI response");

      const analysis = JSON.parse(toolCall.function.arguments);
      nodeId = 0;
      analysis.mindMap = addIds(analysis.mindMap);

      res.json(analysis);
    } catch (err: any) {
      console.error("Analyze error:", err);
      res.status(500).json({ error: err.message || "Analysis failed" });
    }
  });
}
