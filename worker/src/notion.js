// 노션 API 호출 (키는 Worker 비밀 값에서만 읽는다). body가 있으면 POST, 없으면 GET
const API = "https://api.notion.com/v1";
const VERSION = "2025-09-03";

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function notion(env, path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": VERSION,
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw httpError(502, data.message ?? "notion error");
  return data;
}
