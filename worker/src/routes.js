// D-day 읽기·빠른 메모 쓰기
import { notion, httpError } from "./notion.js";

const MEMO_MAX = 2000;
const MEMO_MAX_LINES = 100; // 노션 한 번 요청의 블록 수 한도
const DEADLINE_COUNT = 4; // 가장 가까운 1개 + 그다음 3개
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한국 시간 기준 오늘 날짜와 지금 시각
function kstNow() {
  const iso = new Date(Date.now() + KST_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), dateTime: `${iso.slice(0, 19)}+09:00` };
}

const plainText = (richText) => richText.map((t) => t.plain_text).join("");

export async function listDeadlines(env) {
  const { results } = await notion(env, `/data_sources/${env.PROJECT_SOURCE_ID}/query`, {
    filter: {
      and: [
        { property: "마감일", date: { on_or_after: kstNow().date } },
        { property: "보관", checkbox: { equals: false } },
      ],
    },
    sorts: [{ property: "마감일", direction: "ascending" }],
    page_size: DEADLINE_COUNT,
  });

  return results.map((page) => ({
    name: plainText(page.properties["이름"].title) || "제목 없음",
    date: page.properties["마감일"].date.start.slice(0, 10),
  }));
}

export async function createMemo(env, body) {
  const text = String(body?.text ?? "").trim();
  if (!text) throw httpError(400, "empty");
  if (text.length > MEMO_MAX) throw httpError(413, "too long");

  const lines = text.split("\n");
  if (lines.length > MEMO_MAX_LINES) throw httpError(413, "too many lines");

  const now = kstNow();
  await notion(env, "/pages", {
    parent: { type: "data_source_id", data_source_id: env.MEMO_SOURCE_ID },
    properties: {
      이름: {
        title: [
          { type: "text", text: { content: "빠른 메모 - " } },
          { type: "mention", mention: { type: "date", date: { start: now.dateTime } } },
        ],
      },
    },
    children: lines.map((line) => ({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: line ? [{ type: "text", text: { content: line } }] : [] },
    })),
  });

  return { savedAt: now.dateTime };
}
