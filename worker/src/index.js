// 노션 중계 서버: 위젯이 노션 키 없이 D-day를 읽고 빠른 메모를 쓰게 한다
import { listDeadlines, createMemo } from "./routes.js";

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",").includes(origin);
  return {
    ...(allowed && { "Access-Control-Allow-Origin": origin }),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Pool-Key",
    Vary: "Origin",
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (!env.ACCESS_KEY || request.headers.get("X-Pool-Key") !== env.ACCESS_KEY) {
      return json({ error: "unauthorized" }, 401, cors);
    }

    const route = `${request.method} ${new URL(request.url).pathname}`;
    try {
      if (route === "GET /dday") return json(await listDeadlines(env), 200, cors);
      if (route === "POST /memo") return json(await createMemo(env, await request.json()), 201, cors);
      return json({ error: "not found" }, 404, cors);
    } catch (err) {
      return json({ error: err.message }, err.status ?? 500, cors);
    }
  },
};
