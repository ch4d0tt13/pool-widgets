// 인박스 정리: 프로젝트·영역·자원 연결이 모두 비고 보관 안 한 자료를 보여 주고, 영역·자원 연결과 보관을 바꾼다
import { notion, httpError, plainText, blockText } from "./notion.js";

const INBOX_MAX = 10; // 한 번에 보여 줄 자료 수
const PREVIEW_LINES = 2; // 카드에 보일 내용 줄 수
const PREVIEW_BLOCKS = 10; // 미리보기를 찾을 앞쪽 블록 수
const AREA_MAX = 100;
const ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

const isEmpty = (property) => ({ property, relation: { is_empty: true } });
const notArchived = { property: "보관", checkbox: { equals: false } };
const sameId = (a, b) => a.replaceAll("-", "") === b.replaceAll("-", "");

// 제목의 글 부분만 (「빠른 메모 - @작성시간」이면 「빠른 메모」)
const titleText = (title) =>
  title
    .filter((t) => t.type === "text")
    .map((t) => t.plain_text)
    .join("")
    .replace(/\s*-\s*$/, "")
    .trim();

async function preview(env, pageId) {
  const { results } = await notion(env, `/blocks/${pageId}/children?page_size=${PREVIEW_BLOCKS}`);
  return results.map(blockText).filter(Boolean).slice(0, PREVIEW_LINES);
}

export async function listInbox(env) {
  const { results, has_more } = await notion(env, `/data_sources/${env.MEMO_SOURCE_ID}/query`, {
    filter: { and: [isEmpty("프로젝트 연결"), isEmpty("영역·자원 연결"), notArchived] },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: INBOX_MAX,
  });

  const items = await Promise.all(
    results.map(async (page) => ({
      id: page.id,
      title: titleText(page.properties["이름"].title) || "제목 없음",
      created: page.created_time,
      url: page.url,
      lines: await preview(env, page.id),
    })),
  );
  return { items, more: has_more };
}

export async function listAreas(env) {
  const { results } = await notion(env, `/data_sources/${env.AREA_SOURCE_ID}/query`, {
    filter: notArchived,
    sorts: [{ property: "이름", direction: "ascending" }],
    page_size: AREA_MAX,
  });
  return results.map((page) => ({
    id: page.id,
    name: plainText(page.properties["이름"].title) || "이름 없음",
    kind: page.properties["분류"].select?.name ?? "",
  }));
}

// 바꾸기 전에 자료함 소속인지 확인한다 (다른 DB 페이지를 바꾸지 않게)
async function inboxPage(env, pageId) {
  if (!ID.test(pageId)) throw httpError(400, "bad id");
  const page = await notion(env, `/pages/${pageId}`);
  if (page.parent?.type !== "data_source_id" || !sameId(page.parent.data_source_id, env.MEMO_SOURCE_ID)) {
    throw httpError(403, "not an inbox page");
  }
  return page;
}

export async function linkArea(env, pageId, body) {
  const areaId = String(body?.areaId ?? "");
  if (!ID.test(areaId)) throw httpError(400, "bad areaId");
  await inboxPage(env, pageId);
  await notion(env, `/pages/${pageId}`, { properties: { "영역·자원 연결": { relation: [{ id: areaId }] } } }, "PATCH");
  return { ok: true };
}

export async function archive(env, pageId) {
  await inboxPage(env, pageId);
  await notion(env, `/pages/${pageId}`, { properties: { 보관: { checkbox: true } } }, "PATCH");
  return { ok: true };
}
