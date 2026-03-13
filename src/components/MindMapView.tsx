import { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { MindMapNode } from "@/types/reading";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

interface MindMapViewProps {
  data: MindMapNode;
  title: string;
}

function flattenTree(
  node: MindMapNode,
  parentId: string | null,
  nodes: Node[],
  edges: Edge[],
  level: number,
  index: number,
  siblingCount: number
) {
  const isRoot = parentId === null;
  const xSpacing = 280;
  const ySpacing = 80;

  const yOffset = (index - (siblingCount - 1) / 2) * ySpacing;
  const x = level * xSpacing;
  const y = isRoot ? 0 : yOffset;

  const colors = [
    "hsl(185, 70%, 38%)",
    "hsl(25, 80%, 55%)",
    "hsl(260, 60%, 55%)",
    "hsl(145, 55%, 42%)",
  ];

  nodes.push({
    id: node.id,
    data: { label: node.label },
    position: { x, y },
    style: {
      background: isRoot ? colors[0] : level === 1 ? colors[index % colors.length] : "hsl(var(--card))",
      color: isRoot || level === 1 ? "#fff" : "hsl(var(--card-foreground))",
      border: isRoot || level === 1 ? "none" : "1px solid hsl(var(--border))",
      borderRadius: isRoot ? "16px" : "12px",
      padding: isRoot ? "16px 28px" : "10px 18px",
      fontSize: isRoot ? "16px" : level === 1 ? "13px" : "12px",
      fontWeight: isRoot ? "700" : level === 1 ? "600" : "500",
      fontFamily: isRoot ? "Playfair Display, serif" : "DM Sans, sans-serif",
      boxShadow: isRoot
        ? "0 4px 20px -4px rgba(0,0,0,0.15)"
        : level === 1
        ? "0 2px 10px -2px rgba(0,0,0,0.1)"
        : "var(--shadow-card)",
      minWidth: isRoot ? "140px" : "100px",
      textAlign: "center" as const,
    },
    type: "default",
  });

  if (parentId) {
    edges.push({
      id: `${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: "smoothstep",
      style: {
        stroke: "hsl(var(--border))",
        strokeWidth: isRoot ? 2 : 1.5,
      },
      animated: level === 1,
    });
  }

  node.children?.forEach((child, i) => {
    flattenTree(child, node.id, nodes, edges, level + 1, i, node.children!.length);
  });
}

export function MindMapView({ data, title }: MindMapViewProps) {
  const flowRef = useRef<HTMLDivElement>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    flattenTree(data, null, nodes, edges, 0, 0, 1);
    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleExport = useCallback(async () => {
    if (!flowRef.current) return;
    try {
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: "hsl(var(--background))",
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${title}-mindmap.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [title]);

  return (
    <div className="relative bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-body font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export PNG
        </button>
      </div>
      <div ref={flowRef} style={{ height: 420 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        </ReactFlow>
      </div>
    </div>
  );
}
