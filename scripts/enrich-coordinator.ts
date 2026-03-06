import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";
import { createLogger } from "../src/lib/logger";

const log = createLogger("enrich-coordinator");

const PORT = parseInt(process.env.COORDINATOR_PORT || "3939", 10);
const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "50", 10);
const BATCH_TIMEOUT_MS = 5 * 60 * 1000;
const RECOVERY_INTERVAL_MS = 60 * 1000;
const FORCE = process.argv.includes("--force");

interface BatchInfo {
  poiIds: string[];
  workerId: string;
  assignedAt: number;
}

interface WorkerInfo {
  name: string;
  lastSeen: number;
  assigned: number;
  completed: number;
  failed: number;
}

const queue: string[] = [];
const inflight = new Map<string, BatchInfo>();
const workers = new Map<string, WorkerInfo>();
let totalLoaded = 0;
let completedCount = 0;
let failedCount = 0;
let nextBatchId = 1;
let nextWorkerId = 1;

/**
 * Loads unenriched POI IDs from the database into the queue.
 */
async function loadQueue(): Promise<void> {
  const condition = FORCE
    ? sql`1=1`
    : sql`${pois.profile} IS NULL OR ${pois.profile}->>'summary' IS NULL OR ${pois.profile}->>'summary' = ''`;

  const rows = await db
    .select({ id: pois.id })
    .from(pois)
    .where(condition)
    .orderBy(pois.name);

  for (const row of rows) {
    queue.push(row.id);
  }
  totalLoaded = queue.length;
  log.info(`Loaded ${totalLoaded} POIs into queue (force=${FORCE})`);
}

/**
 * Recovers timed-out inflight batches back to the queue.
 */
function recoverTimedOutBatches(): void {
  const now = Date.now();
  for (const [batchId, batch] of inflight) {
    const worker = workers.get(batch.workerId);
    const workerDead = !worker || now - worker.lastSeen > BATCH_TIMEOUT_MS;
    if (now - batch.assignedAt > BATCH_TIMEOUT_MS && workerDead) {
      log.warn(`Batch ${batchId} timed out (worker ${batch.workerId}), requeueing ${batch.poiIds.length} POIs`);
      queue.push(...batch.poiIds);
      inflight.delete(batchId);
    }
  }
}

/**
 * Assigns the next batch of POI IDs to a worker.
 *
 * @param url - Request URL with workerId query param.
 * @returns Response with batchId, poiIds, and done flag.
 */
function handleBatch(url: URL): Response {
  const workerId = url.searchParams.get("workerId");
  if (!workerId || !workers.has(workerId)) {
    return Response.json({ error: "unknown worker" }, { status: 400 });
  }

  const worker = workers.get(workerId)!;
  worker.lastSeen = Date.now();

  if (queue.length === 0 && inflight.size === 0) {
    return Response.json({ batchId: null, poiIds: [], done: true });
  }

  if (queue.length === 0) {
    return Response.json({ batchId: null, poiIds: [], done: false });
  }

  const batchId = `b${nextBatchId++}`;
  const poiIds = queue.splice(0, BATCH_SIZE);

  inflight.set(batchId, { poiIds, workerId, assignedAt: Date.now() });
  worker.assigned += poiIds.length;

  log.info(`Assigned batch ${batchId} (${poiIds.length} POIs) to worker ${workerId} (${worker.name}) — ${queue.length} queued, ${inflight.size} inflight`);

  return Response.json({ batchId, poiIds, done: false });
}

/**
 * Returns the current coordinator status.
 *
 * @returns Response with queue, inflight, and worker stats.
 */
function handleStatus(): Response {
  const workerList = Array.from(workers.entries()).map(([id, w]) => ({
    id,
    name: w.name,
    lastSeen: new Date(w.lastSeen).toISOString(),
    assigned: w.assigned,
    completed: w.completed,
    failed: w.failed,
  }));

  return Response.json({
    total: totalLoaded,
    queued: queue.length,
    inflight: inflight.size,
    completed: completedCount,
    failed: failedCount,
    workers: workerList,
  });
}

/**
 * Starts the coordinator HTTP server and background recovery timer.
 */
async function main(): Promise<void> {
  await loadQueue();

  if (totalLoaded === 0) {
    log.info("No POIs to enrich. Exiting.");
    process.exit(0);
  }

  Bun.serve({
    port: PORT,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      if (method === "POST" && path === "/register") {
        const body = await req.json() as { name?: string };
        const workerId = `w${nextWorkerId++}`;
        const name = body.name || workerId;
        workers.set(workerId, { name, lastSeen: Date.now(), assigned: 0, completed: 0, failed: 0 });
        log.info(`Worker ${workerId} registered: ${name}`);
        return Response.json({ workerId, config: { model: process.env.OLLAMA_MODEL || "qwen3.5:9b", batchSize: BATCH_SIZE } });
      }

      if (method === "GET" && path === "/batch") {
        return handleBatch(url);
      }

      if (method === "POST" && path === "/complete") {
        const body = await req.json() as { workerId: string; batchId: string; results: { poiId: string; status: string }[] };
        const batch = inflight.get(body.batchId);
        if (!batch) {
          return Response.json({ error: "unknown batch" }, { status: 400 });
        }

        const worker = workers.get(body.workerId);
        if (worker) {
          const succeeded = body.results.filter((r) => r.status === "enriched").length;
          const failed = body.results.filter((r) => r.status === "failed").length;
          worker.completed += succeeded;
          worker.failed += failed;
          worker.lastSeen = Date.now();
          completedCount += succeeded;
          failedCount += failed;
        }

        inflight.delete(body.batchId);
        log.info(`Batch ${body.batchId} completed by ${body.workerId} — ${queue.length} queued, ${inflight.size} inflight, ${completedCount}/${totalLoaded} done`);

        return Response.json({ ok: true });
      }

      if (method === "POST" && path === "/heartbeat") {
        const body = await req.json() as { workerId: string };
        const worker = workers.get(body.workerId);
        if (worker) {
          worker.lastSeen = Date.now();
        }
        return Response.json({ ok: true });
      }

      if (method === "GET" && path === "/status") {
        return handleStatus();
      }

      return Response.json({ error: "not found" }, { status: 404 });
    },
  });

  log.info(`Coordinator listening on http://0.0.0.0:${PORT}`);

  setInterval(recoverTimedOutBatches, RECOVERY_INTERVAL_MS);
}

main().catch((err) => {
  log.error("Coordinator failed:", err);
  process.exit(1);
});
