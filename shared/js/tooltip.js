// 픽셀 말풍선 툴팁: 브라우저 기본 툴팁(title) 대신 테마에 맞는 스티커를 띄운다.
// 위젯 코드는 지금처럼 title만 달면 된다. 가리키면 title을 data-tip으로 옮겨 기본 툴팁이 같이 뜨지 않게 한다
import { el } from "./dom.js";

const SHOW_DELAY_MS = 300;

export function startTooltips() {
  const tip = el("div", "tooltip");
  tip.id = "tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);

  const styles = getComputedStyle(document.documentElement);
  const px = parseInt(styles.getPropertyValue("--px"), 10);
  let target = null;
  let timer = null;

  // 코드가 나중에 title을 바꿔도(예: 시작 ↔ 멈춤) 다음에 가리킬 때 다시 옮긴다
  function tipOf(node) {
    if (node.title) {
      node.dataset.tip = node.title;
      node.removeAttribute("title");
    }
    return node.dataset.tip;
  }

  // 가리킨 것의 위(자리가 없으면 아래)에 띄우고, 창 밖으로 넘치지 않게 좌우를 당긴다
  function show(node) {
    tip.textContent = tipOf(node);
    tip.hidden = false;
    const r = node.getBoundingClientRect();
    const margin = px * 2;
    const gap = px * 3; // 꼬리(2칸) + 1칸
    const below = r.top - tip.offsetHeight - gap < margin;
    const center = r.left + r.width / 2;
    const x = Math.round(Math.min(Math.max(center - tip.offsetWidth / 2, margin), innerWidth - tip.offsetWidth - margin));
    const y = Math.round(below ? r.bottom + gap : r.top - tip.offsetHeight - gap);
    tip.classList.toggle("is-below", below);
    tip.style.translate = `${x}px ${y}px`;
    // 꼬리(3칸) 왼쪽 끝: 가리킨 것의 가운데를 짚되 말풍선 안에 머물게
    const tail = Math.min(Math.max(center - x - px * 1.5, px), tip.offsetWidth - px * 4);
    tip.style.setProperty("--tail-x", `${Math.round(tail / px) * px}px`);
    node.setAttribute("aria-describedby", tip.id);
  }

  function hide() {
    clearTimeout(timer);
    target?.removeAttribute("aria-describedby");
    target = null;
    tip.hidden = true;
  }

  document.querySelectorAll("[title]").forEach(tipOf);

  // 마우스로 가리킬 때만 (휴대폰은 누르면 바로 동작하니 툴팁을 띄우지 않는다)
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const node = e.target.closest("[title], [data-tip]");
    if (node === target) return;
    hide();
    if (!node || !tipOf(node)) return;
    target = node;
    timer = setTimeout(() => show(node), SHOW_DELAY_MS);
  });
  document.addEventListener("pointerout", (e) => {
    if (target && !target.contains(e.relatedTarget)) hide();
  });

  // 키보드로 옮겨 왔을 때도 보여 준다
  document.addEventListener("focusin", (e) => {
    const node = e.target.closest?.("[title], [data-tip]");
    if (!node || !e.target.matches(":focus-visible") || !tipOf(node)) return;
    hide();
    target = node;
    show(node);
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("pointerdown", hide);
  document.addEventListener("scroll", hide, true);
}
