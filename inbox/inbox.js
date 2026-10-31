// 인박스 정리: 어디에도 연결 안 된 자료를 카드로 보여 주고, 영역·자원에 넣거나 보관·삭제한다
import { $, el, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { onAnnounce, refreshWhileVisible } from "../shared/js/live.js";

const REFRESH_MS = 30 * 1000; // 노션에서 직접 고친 것도 30초 안에 보이게 (화면이 보일 때만)
const MEMO_RECHECK_MS = [1500, 5000]; // 메모 저장 알림 뒤 다시 보는 시점 (노션 검색 반영이 조금 늦다)
const LEAVE_MS = 300; // 카드가 흘러가며 사라지는 시간 (inbox.css와 같게)
const STATUS_MS = 3000; // 결과 안내가 보이는 시간
const CONFIRM_MS = 3000; // 「정말 삭제?」가 기다려 주는 시간
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
  let loading = false;
  const cards = new Map(); // 자료 id → 카드 (새로 고쳐도 펼친 상태가 그대로 남게 다시 쓴다)
  const gone = new Set(); // 이 화면에서 정리한 자료 (서버 반영 전에 다시 나타나지 않게)

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
      gone.add(card.dataset.id);
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
    li.dataset.id = item.id;

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

    // 삭제는 두 번 눌러야 한다: 한 번 누르면 「정말 삭제?」로 바뀌고 잠시 뒤 되돌아간다
    let armTimer = null;
    const remove = button("btn btn--small inbox__delete", "삭제", () => {
      if (!remove.classList.contains("is-armed")) {
        remove.classList.add("is-armed");
        remove.textContent = "정말 삭제?";
        armTimer = setTimeout(() => {
          remove.classList.remove("is-armed");
          remove.textContent = "삭제";
        }, CONFIRM_MS);
        return;
      }
      clearTimeout(armTimer);
      resolve(li, `/inbox/${item.id}/trash`, {}, "휴지통으로 보냈어요");
    });

    const actions = el("div", "inbox__actions");
    actions.append(pick, keep, remove);
    li.append(actions, box);
    return li;
  }

  // 바뀐 카드만 넣고 뺀다 (있던 카드는 그대로 옮겨서 펼친 고르기가 접히지 않는다)
  function render(items) {
    const next = items.filter((item) => !gone.has(item.id)).map((item) => cards.get(item.id) ?? card(item));
    cards.clear();
    next.forEach((li) => cards.set(li.dataset.id, li));
    list.replaceChildren(...next);
    updateCount();
  }

  async function update() {
    if (loading) return;
    loading = true;
    try {
      const [inbox, areaList] = await Promise.all([api("/inbox"), areas ?? api("/areas").catch(() => null)]);
      areas = areaList;
      more = inbox.more;
      render(inbox.items);
    } catch {
      count.textContent = "인박스를 못 불러왔어요";
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
  // 빠른 메모 위젯에서 저장하면 바로 다시 본다
  onAnnounce("memo-saved", () => MEMO_RECHECK_MS.forEach((ms) => setTimeout(update, ms)));
}
