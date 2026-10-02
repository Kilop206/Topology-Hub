export type User = {
  id: string;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  active: boolean;
  createdAt: string;
};
export type GraphNode = {
  id: number;
  external_id?: string;
  label?: string;
  type?: string;
  addresses?: string[];
  evidence?: string;
  position?: { x: number; y: number };
  [key: string]: unknown;
};

export type Graph = {
  schema_version?: string;
  name?: string;
  nodes: number | GraphNode[];
  links: {
    from: number;
    to: number;
    delay: number;
    bandwidth: number;
    loss: number;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
};

export function graphNodeIds(graph: Graph): number[] {
  return typeof graph.nodes === "number"
    ? Array.from({ length: Math.max(0, graph.nodes) }, (_, id) => id)
    : graph.nodes.map((node) => node.id);
}

export function graphNodeCount(graph: Graph): number {
  return typeof graph.nodes === "number" ? graph.nodes : graph.nodes.length;
}

export function graphNodeById(graph: Graph, id: number): GraphNode | undefined {
  return Array.isArray(graph.nodes)
    ? graph.nodes.find((node) => node.id === id)
    : undefined;
}
export type Topology = {
  id: string;
  title: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE";
  nodeCount: number;
  linkCount: number;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metrics: {
    meanLinkDelayMs: number | null;
    minimumBandwidthMbps: number | null;
    maximumLossPercent: number | null;
  };
  preview: Graph;
};
export type Detail = { topology: Topology; graph: Graph };
export type RevisionSummary = {
  revision: number;
  createdAt: string;
  actorId: string;
  actorName: string;
};
export type Listing = {
  items: Topology[];
  total: number;
  page: number;
  size: number;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Request": "1",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      error.message ||
      error.violations?.map((v: { message: string }) => v.message).join("; ") ||
      (response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível concluir a operação.");
    throw new ApiError(
      response.status,
      error.path ? message + " JSON PATH: " + error.path : message,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível conectar ao servidor.";
}
export function date(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
export const initialGraph: Graph = {
  nodes: 5,
  links: [0, 1, 2, 3, 4].map((i) => ({
    from: i,
    to: (i + 1) % 5,
    delay: 5,
    bandwidth: 100,
    loss: 0,
  })),
};
