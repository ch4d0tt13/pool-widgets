// 노션 중계 서버: 위젯이 노션 키 없이 마감일·브리핑·인박스·프로젝트를 읽고, 메모를 쓰고, 인박스와 마감일을 정리하게 한다
import { listDeadlines, monthDeadlines, createMemo, latestBriefing } from "./routes.js";
import { listInbox, listAreas, linkArea, archive, trash } from "./inbox.js";
import { listProjects, setDeadline } from "./projects.js";

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

    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;
    try {
      if (route === "GET /dday") return json(await listDeadlines(env), 200, cors);
      if (route === "GET /calendar") return json(await monthDeadlines(env, url.searchParams.get("month")), 200, cors);
      if (route === "GET /briefing") return json(await latestBriefing(env), 200, cors);
      if (route === "POST /memo") return json(await createMemo(env, await request.json()), 201, cors);
      if (route === "GET /inbox") return json(await listInbox(env), 200, cors);
      if (route === "GET /areas") return json(await listAreas(env), 200, cors);
      if (route === "GET /projects") return json(await listProjects(env), 200, cors);

      // POST /inbox/<페이지 id>/area · /archive · /trash
      const [, pageId, action] = url.pathname.match(/^\/inbox\/([^/]+)\/(area|archive|trash)$/) ?? [];
      if (request.method === "POST" && action === "area") return json(await linkArea(env, pageId, await request.json()), 200, cors);
      if (request.method === "POST" && action === "archive") return json(await archive(env, pageId), 200, cors);
      if (request.method === "POST" && action === "trash") return json(await trash(env, pageId), 200, cors);

      // POST /projects/<페이지 id>/deadline
      const [, projectId] = url.pathname.match(/^\/projects\/([^/]+)\/deadline$/) ?? [];
      if (request.method === "POST" && projectId) return json(await setDeadline(env, projectId, await request.json()), 200, cors);
      return json({ error: "not found" }, 404, cors);
    } catch (err) {
      return json({ error: err.message }, err.status ?? 500, cors);
    }
  },
};
