// Checks the MongoDB connection and how much of the shared 512 MB quota is in use.
// Atlas free tier counts dataSize + indexSize across every database.
import { MongoClient } from "mongodb";
import { loadEnv } from "./load-env.mjs";

const env = loadEnv();

const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const { databases } = await client.db("admin").command({ listDatabases: 1, nameOnly: true });
  let total = 0;
  for (const { name } of databases) {
    if (["admin", "local", "config"].includes(name)) continue;
    const s = await client.db(name).stats();
    const mb = (s.dataSize + s.indexSize) / 1048576;
    total += mb;
    console.log(`${name.padEnd(24)} ${mb.toFixed(2)} MB`);
  }
  console.log(`\nTotal counted against quota: ${total.toFixed(2)} MB of 512 MB`);
} catch (err) {
  console.log(`FAIL: ${err.message}`);
} finally {
  await client.close();
}
