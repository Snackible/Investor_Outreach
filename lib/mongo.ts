import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

const g = globalThis as unknown as { __hubMongo?: Promise<MongoClient> };

export async function db(): Promise<Db> {
  if (!g.__hubMongo) {
    g.__hubMongo = new MongoClient(env.mongoUri(), { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 }).connect();
    g.__hubMongo.catch(() => (g.__hubMongo = undefined));
  }
  return (await g.__hubMongo).db(env.mongoDb());
}

let quota: { at: number; mb: number } | null = null;

/** Space counted against the shared Atlas quota (dataSize + indexSize of every database), cached ten minutes. */
export async function quotaUsedMb(fresh = false): Promise<number> {
  if (!fresh && quota && Date.now() - quota.at < 10 * 60 * 1000) return quota.mb;
  const client = await g.__hubMongo!;
  const { databases } = await client.db("admin").command({ listDatabases: 1, nameOnly: true });
  let total = 0;
  for (const { name } of databases as { name: string }[]) {
    if (["admin", "local", "config"].includes(name)) continue;
    const s = await client.db(name).stats();
    total += (s.dataSize + s.indexSize) / 1048576;
  }
  quota = { at: Date.now(), mb: total };
  return total;
}

export class QuotaError extends Error {}

/** Refuses writes once the shared cluster passes the safety ceiling, so the other app never breaks. */
export async function assertRoomToWrite() {
  await db();
  const used = await quotaUsedMb();
  if (used > env.mongoCeilingMb()) {
    throw new QuotaError(`The shared MongoDB cluster is using ${used.toFixed(0)} MB, above the ${env.mongoCeilingMb()} MB safety ceiling. Writes are paused.`);
  }
}
