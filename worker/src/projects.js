// 프로젝트 카드: 보관 안 한 프로젝트를 마감일 순서로 보여 주고, 마감일을 정하거나 지우고, 보관한다.
// 연결된 영역·자원 이름도 함께 보내서 위젯이 영역마다 카드 색을 나눈다
import { notion, httpError, plainText, notArchived, pageInSource } from "./notion.js";
import { listAreas } from "./inbox.js";

const PROJECT_MAX = 100;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function listProjects(env) {
  const [{ results }, areas] = await Promise.all([
    notion(env, `/data_sources/${env.PROJECT_SOURCE_ID}/query`, {
      filter: notArchived,
      sorts: [{ property: "마감일", direction: "ascending" }],
      page_size: PROJECT_MAX,
    }),
    listAreas(env),
  ]);
  const areaName = new Map(areas.map((a) => [a.id, a.name]));
  return results.map((page) => ({
    id: page.id,
    name: plainText(page.properties["이름"].title) || "제목 없음",
    date: page.properties["마감일"].date?.start?.slice(0, 10) ?? null,
    areas: (page.properties["영역·자원 연결"]?.relation ?? []).map((r) => areaName.get(r.id)).filter(Boolean),
    url: page.url,
  }));
}

// body.date: "YYYY-MM-DD" 로 정하기, null 로 지우기
export async function setDeadline(env, pageId, body) {
  const date = body?.date ?? null;
  if (date !== null && !DATE.test(date)) throw httpError(400, "date must be YYYY-MM-DD or null");
  await pageInSource(env, pageId, env.PROJECT_SOURCE_ID);
  await notion(env, `/pages/${pageId}`, { properties: { 마감일: { date: date && { start: date } } } }, "PATCH");
  return { ok: true, date };
}

// 보관: 「보관」 칸을 켠다 (노션에서 끄면 되돌릴 수 있다)
export async function archiveProject(env, pageId) {
  await pageInSource(env, pageId, env.PROJECT_SOURCE_ID);
  await notion(env, `/pages/${pageId}`, { properties: { 보관: { checkbox: true } } }, "PATCH");
  return { ok: true };
}
