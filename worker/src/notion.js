// 노션 API 호출 (키는 Worker 비밀 값에서만 읽는다)
const API = "https://api.notion.com/v1";
const VERSION = "2025-09-03";

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function notion(env, path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw httpError(502, data.message ?? "notion error");
  return data;
}
