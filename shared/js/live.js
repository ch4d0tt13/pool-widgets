// 위젯끼리 바로 알리기, 그리고 화면이 보이는 동안만 주기적으로 새로 고치기
// (위젯들은 같은 주소에 있어서 같은 브라우저 안에서는 서로 신호를 주고받을 수 있다)
const channel = "BroadcastChannel" in window ? new BroadcastChannel("pool-widgets") : null;

export const announce = (type) => channel?.postMessage(type);

export function onAnnounce(type, fn) {
  channel?.addEventListener("message", (e) => {
    if (e.data === type) fn();
  });
}

export function refreshWhileVisible(fn, ms) {
  const visible = () => document.visibilityState === "visible";
  setInterval(() => visible() && fn(), ms);
  document.addEventListener("visibilitychange", () => visible() && fn());
}
