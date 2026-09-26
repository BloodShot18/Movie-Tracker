// Cloudflare Pages Function — deployed automatically at /api/entries
// Requires a D1 binding named "DB" (set in Pages project settings, or wrangler.toml for local dev).

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // rolling 7-day feed

export async function onRequestGet(context) {
  const { env } = context;
  const cutoff = Date.now() - WINDOW_MS;

  const { results } = await env.DB.prepare(
    "SELECT id, name, title, kind, note, day, created_at AS createdAt FROM entries WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200"
  ).bind(cutoff).all();

  return json({ entries: results });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const { name, title, kind, note, day } = body || {};
  if (!name || !title || !kind || !day) {
    return json({ error: "name, title, kind, and day are required" }, 400);
  }
  if (String(name).length > 30 || String(title).length > 80 || (note && String(note).length > 90)) {
    return json({ error: "one of the fields is too long" }, 400);
  }
  if (!["Movie", "Episode", "Series"].includes(kind)) {
    return json({ error: "kind must be Movie, Episode, or Series" }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await env.DB.prepare(
    "INSERT INTO entries (id, name, title, kind, note, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    String(name).slice(0, 30),
    String(title).slice(0, 80),
    String(kind),
    note ? String(note).slice(0, 90) : "",
    String(day),
    createdAt
  ).run();

  return json({ id, createdAt }, 201);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
