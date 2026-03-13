export interface Reading {
  id: string;
  title: string;
  query: string;
  summary: string;
  keyConcepts: Concept[];
  importantFacts: string[];
  mindMapData: MindMapNode;
  createdAt: Date;
}

export interface Concept {
  title: string;
  description: string;
  icon?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}
