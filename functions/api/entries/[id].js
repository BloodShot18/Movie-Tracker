// Cloudflare Pages Function — handles DELETE /api/entries/:id
// Requires the same D1 binding "DB" as functions/api/entries.js.

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;
  if (!id) return json({ error: "id required" }, 400);

  const result = await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();

  if (result.meta && result.meta.changes === 0) {
    return json({ error: "not found" }, 404);
  }
  return json({ deleted: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
