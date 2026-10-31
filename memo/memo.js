// 빠른 메모: 내용만 적으면 「빠른 메모 - @작성시간」 제목으로 자료함에 저장한다
import { $, pad, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { announce } from "../shared/js/live.js";

export function startMemo() {
  const form = $("[data-form]");
  const input = $("#memo-text");
  const status = $("[data-status]");
  const save = $("[data-save]");

  // 상태 스티커는 글이 있을 때만 보인다
  const setStatus = (text) => showText(status, text);

  if (!hasKey) {
    setStatus("연결 정보가 없어요");
    input.disabled = save.disabled = true;
    return;
  }

  async function submit() {
    const text = input.value.trim();
    if (!text || save.disabled) return;
    save.disabled = true;
    setStatus("저장하는 중…");
    try {
      await api("/memo", { text });
      announce("memo-saved"); // 인박스 위젯이 바로 새로 고친다
      const now = new Date();
      input.value = "";
      setStatus(`저장했어요 · ${pad(now.getHours())}:${pad(now.getMinutes())}`);
    } catch {
      setStatus("저장 못 했어요. 다시 눌러 주세요");
    } finally {
      save.disabled = false;
      input.focus();
    }
  }

  // 한 줄 입력칸이라 Enter를 누르면 폼이 제출된다
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });
}
