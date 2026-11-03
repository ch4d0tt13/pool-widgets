// D-day·달력 읽기·빠른 메모 쓰기·최근 브리핑 읽기
import { notion, httpError, plainText, blockText, notArchived } from "./notion.js";

const SECTION_LINES = 5; // 브리핑 섹션마다 보여 줄 글머리 수
const SECTION_MAX = 6; // 보여 줄 섹션 수
const HIDDEN_SECTIONS = /조회 범위/; // 대시보드에 보내지 않는 섹션 (브리핑을 어떻게 만들었는지 적은 조회 범위·제한 안내)
const FOOTER_MAX = 40; // 맨 끝 집계 줄로 볼 최대 길이
const MEMO_MAX = 2000;
const MEMO_MAX_LINES = 100; // 노션 한 번 요청의 블록 수 한도
const DEADLINE_COUNT = 4; // 가장 가까운 1개 + 그다음 3개
const MONTH_MAX = 100; // 한 달 치 마감일 최대 개수 (노션 한 번 조회 한도)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한국 시간 기준 오늘 날짜와 지금 시각
function kstNow() {
  const iso = new Date(Date.now() + KST_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), dateTime: `${iso.slice(0, 19)}+09:00` };
}

// 보관 안 한 프로젝트의 마감일을 날짜순으로 (이름·날짜만 보낸다)
async function queryDeadlines(env, dateFilters, pageSize) {
  const { results } = await notion(env, `/data_sources/${env.PROJECT_SOURCE_ID}/query`, {
    filter: {
      and: [
        ...dateFilters.map((date) => ({ property: "마감일", date })),
        notArchived,
      ],
    },
    sorts: [{ property: "마감일", direction: "ascending" }],
    page_size: pageSize,
  });

  return results.map((page) => ({
    name: plainText(page.properties["이름"].title) || "제목 없음",
    date: page.properties["마감일"].date.start.slice(0, 10),
  }));
}

export const listDeadlines = (env) => queryDeadlines(env, [{ on_or_after: kstNow().date }], DEADLINE_COUNT);

// 한 달 치 마감일 (month = "YYYY-MM")
export function monthDeadlines(env, month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? "")) throw httpError(400, "month must be YYYY-MM");
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return queryDeadlines(env, [{ on_or_after: `${month}-01` }, { before: `${next}-01` }], MONTH_MAX);
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

const HEADINGS = ["heading_1", "heading_2", "heading_3"];
const LIST_ITEMS = ["bulleted_list_item", "numbered_list_item"];

// 브리핑 글머리 한 줄: 링크 글자(「원본」·「영어 계획」 등)와 출처 표시는 빼고, 남은 「·」 구분도 정리한다
function briefingLine(block) {
  const text = (block[block.type]?.rich_text ?? []).filter((t) => !(t.type === "text" && t.href)).map((t) => t.plain_text).join(""); // 페이지 멘션은 남긴다
  return text
    .replace(/\s*\[\d+\]/g, "")
    .replace(/(\s*·\s*)+$/, "")
    .trim();
}

// 가장 최근 브리핑: 섹션마다 제목과 글머리 몇 줄 + 맨 끝 집계 줄. 조회 범위 안내 섹션은 보내지 않는다
export async function latestBriefing(env) {
  const { results } = await notion(env, `/data_sources/${env.BRIEFING_SOURCE_ID}/query`, {
    sorts: [{ property: "날짜·시각", direction: "descending" }],
    page_size: 1,
  });
  const page = results[0];
  if (!page) return null;

  const { results: blocks } = await notion(env, `/blocks/${page.id}/children?page_size=100`);
  const sections = [];
  let current = null;
  for (const block of blocks) {
    if (HEADINGS.includes(block.type)) {
      const title = blockText(block);
      current = HIDDEN_SECTIONS.test(title) ? null : { title, lines: [] };
      if (current) sections.push(current);
    } else if (current && LIST_ITEMS.includes(block.type) && current.lines.length < SECTION_LINES) {
      const line = briefingLine(block);
      if (line) current.lines.push(line);
    }
  }
  const shown = sections.filter((s) => s.lines.length).slice(0, SECTION_MAX);
  const last = blocks.at(-1);
  const footer = last?.type === "paragraph" ? blockText(last) : "";

  return {
    title: plainText(page.properties["제목"].title),
    kind: page.properties["구분"].select?.name ?? "",
    at: page.properties["날짜·시각"].date?.start ?? page.created_time,
    url: page.url,
    sections: shown,
    lines: shown.flatMap((s) => s.lines), // 섹션을 모르는 예전 위젯용
    footer: footer.length <= FOOTER_MAX ? footer : "",
  };
}
