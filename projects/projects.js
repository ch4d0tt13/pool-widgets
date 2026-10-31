// 프로젝트 카드: 보관 안 한 프로젝트를 마감일 가까운 순서로, 누르면 노션 페이지를 새 탭으로.
// 카드에서 마감일을 정하거나 지우면 D-day·달력 위젯도 바로 다시 본다
import { $, el, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { announce, refreshWhileVisible } from "../shared/js/live.js";
import { daysUntil, ddayLabel, shortDate } from "../shared/js/dates.js";

const REFRESH_MS = 30 * 1000;
const STATUS_MS = 3000;
const NEAR_DAYS = 7;
const SOON_DAYS = 3;

// 남은 날에 따라 알약 글자와 색
function pill(date) {
  if (!date) return { text: "마감일 없음", tone: "is-none" };
  const days = daysUntil(date);
  const tone = days < 0 ? "is-over" : days === 0 ? "is-today" : days <= SOON_DAYS ? "is-soon" : days <= NEAR_DAYS ? "is-near" : "";
  return { text: ddayLabel(days), tone };
}

// 마감일 가까운 순, 마감일 없는 건 뒤에 이름순
const byDeadline = (a, b) =>
  (a.date ?? "9999") < (b.date ?? "9999") ? -1 : (a.date ?? "9999") > (b.date ?? "9999") ? 1 : a.name.localeCompare(b.name, "ko");

export function startProjects() {
  const count = $("[data-count]");
  const grid = $("[data-grid]");
  const status = $("[data-status]");
  let projects = [];
  let editing = null; // 마감일을 고치는 중인 프로젝트 id (그동안은 새로 그리지 않는다)
  let loading = false;
  let statusTimer = null;

  function notify(text) {
    showText(status, text);
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => showText(status, ""), STATUS_MS);
  }

  function button(className, text, onClick) {
    const b = el("button", className, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  async function save(project, date, li) {
    const buttons = li.querySelectorAll("button, input");
    buttons.forEach((b) => (b.disabled = true));
    try {
      await api(`/projects/${project.id}/deadline`, { date });
      project.date = date;
      editing = null;
      announce("deadlines-changed");
      notify(date ? `「${project.name}」 마감일을 ${shortDate(date)}로 정했어요` : `「${project.name}」 마감일을 지웠어요`);
      render();
    } catch {
      notify("바꾸지 못했어요. 다시 눌러 주세요");
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  function card(project) {
    const { text, tone } = pill(project.date);
    const li = el("li", `proj ${tone}`.trim()); // 킥판 색도 남은 날에 따라

    const link = el("a", "proj__link", project.name);
    Object.assign(link, { href: project.url, target: "_blank", rel: "noopener" });

    const due = el("div", "proj__due");
    due.append(el("span", `proj__pill ${tone}`, text));
    if (project.date) due.append(el("span", "proj__date", shortDate(project.date)));

    const editor = el("div", "proj__editor");
    editor.hidden = editing !== project.id;
    const input = el("input", "proj__input");
    Object.assign(input, { type: "date", value: project.date ?? "" });
    input.setAttribute("aria-label", `${project.name} 마감일`);
    editor.append(
      input,
      button("btn btn--small", "저장", () => input.value && save(project, input.value, li)),
      ...(project.date ? [button("btn btn--small btn--ghost", "지우기", () => save(project, null, li))] : []),
    );

    const edit = button("btn btn--small btn--ghost proj__edit", "마감일", () => {
      editing = editor.hidden ? project.id : null;
      render();
      if (editing) grid.querySelector(".proj__editor:not([hidden]) input")?.focus();
    });
    edit.setAttribute("aria-expanded", String(!editor.hidden));
    due.append(edit);

    li.append(link, due, editor);
    return li;
  }

  function render() {
    grid.replaceChildren(...[...projects].sort(byDeadline).map(card));
    const dated = projects.filter((p) => p.date).length;
    count.textContent = `프로젝트 ${projects.length}개 · 마감일 ${dated}개`;
  }

  async function update() {
    if (loading || editing) return;
    loading = true;
    try {
      projects = await api("/projects");
      render();
    } catch {
      count.textContent = "프로젝트를 못 불러왔어요";
    } finally {
      loading = false;
    }
  }

  if (!hasKey) {
    count.textContent = "연결 정보가 없어요";
    return;
  }
  update();
  refreshWhileVisible(update, REFRESH_MS);
}
