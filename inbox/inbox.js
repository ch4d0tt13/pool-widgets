// 인박스 정리: 어디에도 연결 안 된 자료를 카드로 보여 주고, 영역·자원에 넣거나 보관한다
import { $, el, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";

const REFRESH_MS = 10 * 60 * 1000;
const LEAVE_MS = 300; // 카드가 흘러가며 사라지는 시간 (inbox.css와 같게)
const STATUS_MS = 3000; // 결과 안내가 보이는 시간
const KINDS = ["영역", "자원"];

const dateText = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export function startInbox() {
  const count = $("[data-count]");
  const list = $("[data-list]");
  const status = $("[data-status]");
  let areas = null; // 영역·자원 목록 (한 번 받으면 다시 받지 않는다)
  let more = false;
  let statusTimer = null;

  function notify(text) {
    showText(status, text);
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => showText(status, ""), STATUS_MS);
  }

  function updateCount() {
    const n = list.children.length;
    count.textContent = n ? `정리할 자료 ${n}${more ? "+" : ""}개` : "인박스가 비었어요";
  }

  function button(className, text, onClick) {
    const b = el("button", className, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  // 정리하기: 서버에 반영되면 카드를 흘려보낸다
  async function resolve(card, path, body, done) {
    const buttons = card.querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));
    try {
      await api(path, body);
      notify(done);
      card.classList.add("is-leaving");
      setTimeout(() => {
        card.remove();
        updateCount();
      }, LEAVE_MS);
    } catch {
      notify("바꾸지 못했어요. 다시 눌러 주세요");
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  function picker(item, card) {
    const box = el("div", "inbox__picker");
    box.hidden = true;
    for (const kind of KINDS) {
      const group = (areas ?? []).filter((a) => a.kind === kind);
      if (!group.length) continue;
      const row = el("div", "inbox__group");
      row.append(el("span", "inbox__kind", kind));
      for (const area of group) {
        row.append(
          button("tag", area.name, () =>
            resolve(card, `/inbox/${item.id}/area`, { areaId: area.id }, `「${area.name}」에 넣었어요`),
          ),
        );
      }
      box.append(row);
    }
    if (!box.children.length) box.append(el("p", "inbox__kind", "영역·자원 목록을 못 불러왔어요"));
    return box;
  }

  function card(item) {
    const li = el("li", "inbox__card");

    const head = el("div", "inbox__head");
    const title = el("a", "inbox__title", item.title);
    Object.assign(title, { href: item.url, target: "_blank", rel: "noopener" });
    head.append(title, el("span", "inbox__date", dateText(item.created)));
    li.append(head);

    if (item.lines.length) {
      const lines = el("div", "inbox__lines");
      lines.append(...item.lines.map((text) => el("p", "", text)));
      li.append(lines);
    }

    const box = picker(item, li);
    const pick = button("btn btn--small", "영역·자원 고르기", () => {
      box.hidden = !box.hidden;
      pick.setAttribute("aria-expanded", String(!box.hidden));
    });
    pick.setAttribute("aria-expanded", "false");
    const keep = button("btn btn--small btn--ghost", "보관", () =>
      resolve(li, `/inbox/${item.id}/archive`, {}, "보관했어요"),
    );
    const actions = el("div", "inbox__actions");
    actions.append(pick, keep);
    li.append(actions, box);
    return li;
  }

  async function update() {
    try {
      const [inbox, areaList] = await Promise.all([api("/inbox"), areas ?? api("/areas").catch(() => null)]);
      areas = areaList;
      more = inbox.more;
      list.replaceChildren(...inbox.items.map(card));
      updateCount();
    } catch {
      count.textContent = "인박스를 못 불러왔어요";
    }
  }

  if (!hasKey) {
    count.textContent = "연결 정보가 없어요";
    return;
  }
  update();
  setInterval(update, REFRESH_MS);
}
