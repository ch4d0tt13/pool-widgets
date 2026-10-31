// 위젯들이 같이 쓰는 작은 도우미
export const $ = (sel) => document.querySelector(sel);

export const pad = (n) => String(n).padStart(2, "0");

// 요소 하나 만들기: el("span", "dday__pill", "D-3")
export function el(tag, className, text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

// 상태 스티커처럼 글이 있을 때만 보이는 요소에 글 넣기
export function showText(node, text) {
  node.textContent = text;
  node.hidden = !text;
}
