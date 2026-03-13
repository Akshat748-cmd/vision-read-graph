import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI reading assistant. Given a topic or article text, generate a structured analysis. You MUST respond using the provided tool.`;

    const userPrompt = `Analyze this topic or article and provide a comprehensive reading summary:\n\n${query}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
                                properties: {
                                  label: { type: "string" },
                                },
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Add IDs to mind map nodes
    let nodeId = 0;
    function addIds(node: any): any {
      const id = `node-${nodeId++}`;
      return {
        id,
        label: node.label,
        children: node.children?.map((c: any) => addIds(c)),
      };
    }

    analysis.mindMap = addIds(analysis.mindMap);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-topic error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
