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

// 보관 안 한 것만 (프로젝트·자료·영역·자원 공통 칸)
export const notArchived = { property: "보관", checkbox: { equals: false } };

const ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
export const isId = (value) => ID.test(value ?? "");
const sameId = (a, b) => a.replaceAll("-", "") === b.replaceAll("-", "");

// 바꾸기 전에 그 페이지가 정해진 DB(데이터 소스) 소속인지 확인한다 (다른 DB 페이지를 바꾸지 않게)
export async function pageInSource(env, pageId, sourceId) {
  if (!isId(pageId)) throw httpError(400, "bad id");
  const page = await notion(env, `/pages/${pageId}`);
  if (page.parent?.type !== "data_source_id" || !sameId(page.parent.data_source_id, sourceId)) {
    throw httpError(403, "page not in this database");
  }
  return page;
}
