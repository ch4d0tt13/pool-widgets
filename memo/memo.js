// 빠른 메모: 내용만 적으면 「빠른 메모 - @작성시간」 제목으로 자료함에 저장한다
import { $, pad } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";

export function startMemo() {
  const form = $("[data-form]");
  const input = $("#memo-text");
  const status = $("[data-status]");
  const save = $("[data-save]");

  if (!hasKey) {
    status.textContent = "연결 정보가 없어요";
    input.disabled = save.disabled = true;
    return;
  }

  async function submit() {
    const text = input.value.trim();
    if (!text || save.disabled) return;
    save.disabled = true;
    status.textContent = "저장하는 중…";
    try {
      await api("/memo", { text });
      const now = new Date();
      input.value = "";
      status.textContent = `저장했어요 · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    } catch {
      status.textContent = "저장 못 했어요. 다시 눌러 주세요";
    } finally {
      save.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
  });
}
