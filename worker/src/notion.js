// 노션 API 호출 (키는 Worker 비밀 값에서만 읽는다). 기본은 body가 있으면 POST, 없으면 GET
const API = "https://api.notion.com/v1";
const VERSION = "2025-09-03";

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function notion(env, path, body, method = body ? "POST" : "GET") {
  const res = await fetch(API + path, {
    method,
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

export const plainText = (richText) => richText.map((t) => t.plain_text).join("");

// 블록의 글만 뽑고 출처 표시([1] 등)는 지운다
export const blockText = (block) => plainText(block[block.type]?.rich_text ?? []).replace(/\s*\[\d+\]/g, "").trim();
