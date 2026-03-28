declare module "osm-read" {
  export interface ParseOptions {
    filePath?: string;
    buffer?: ArrayBuffer;
    format?: "pbf" | "xml";
    node?: (node: { id: string; lat: number; lon: number; tags: Record<string, string> }) => void;
    way?: (way: { id: string; tags: Record<string, string>; nodeRefs: string[] }) => void;
    relation?: (relation: { id: string; tags: Record<string, string>; members: unknown[] }) => void;
    endDocument?: () => void;
    error?: (err: Error) => void;
  }

  export function parse(opts: ParseOptions): void;
  export function parsePbf(opts: ParseOptions): void;
}
