// Cloudflare Pages Function — deployed automatically at /api/entries
// Requires a D1 binding named "DB" (set in Pages project settings, or wrangler.toml for local dev).

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // rolling 7-day feed
const GENRES = ["Drama", "Comedy", "Action", "Thriller", "Horror", "Sci-Fi", "Romance", "Documentary", "Animation", "Other"];
const KINDS = ["Movie", "Episode", "Series"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const room = (url.searchParams.get("room") || "").trim();
  const genreFilter = (url.searchParams.get("genre") || "").trim();
  const cutoff = Date.now() - WINDOW_MS;

  const conditions = ["created_at >= ?"];
  const params = [cutoff];

  if (room) {
    conditions.push("visibility = 'private'", "room_code = ?");
    params.push(room);
  } else {
    conditions.push("visibility = 'public'");
  }

  if (genreFilter && GENRES.includes(genreFilter)) {
    conditions.push("genre = ?");
    params.push(genreFilter);
  }

  const sql =
    "SELECT e.id, e.name, e.title, e.kind, e.note, e.genre, e.visibility, e.created_at AS createdAt, " +
    "(SELECT COUNT(*) FROM entries e2 WHERE lower(e2.title) = lower(e.title)) AS watchedCount " +
    "FROM entries e WHERE " + conditions.join(" AND ") +
    " ORDER BY e.created_at DESC LIMIT 200";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
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

  const { name, title, kind, note, day, genre, visibility, room_code } = body || {};

  if (!name || !title || !kind || !day) {
    return json({ error: "name, title, kind, and day are required" }, 400);
  }
  if (String(name).length > 30 || String(title).length > 80 || (note && String(note).length > 90)) {
    return json({ error: "one of the fields is too long" }, 400);
  }
  if (!KINDS.includes(kind)) {
    return json({ error: "kind must be Movie, Episode, or Series" }, 400);
  }

  const finalGenre = GENRES.includes(genre) ? genre : "Other";
  const finalVisibility = visibility === "private" ? "private" : "public";
  let finalRoomCode = null;
  if (finalVisibility === "private") {
    const trimmedRoom = String(room_code || "").trim();
    if (!trimmedRoom) return json({ error: "room_code is required for private entries" }, 400);
    if (trimmedRoom.length > 40) return json({ error: "room_code is too long" }, 400);
    finalRoomCode = trimmedRoom;
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await env.DB.prepare(
    "INSERT INTO entries (id, name, title, kind, note, day, created_at, genre, visibility, room_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    String(name).slice(0, 30),
    String(title).slice(0, 80),
    String(kind),
    note ? String(note).slice(0, 90) : "",
    String(day),
    createdAt,
    finalGenre,
    finalVisibility,
    finalRoomCode
  ).run();

  return json({ id, createdAt }, 201);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
