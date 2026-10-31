// 빠른 메모: 내용만 적으면 「빠른 메모 - @작성시간」 제목으로 자료함에 저장한다
import { $, pad } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { announce } from "../shared/js/live.js";

const NOTE_MS = 4000; // 저장 결과를 안내 문구 자리에 보여 주는 시간

export function startMemo() {
  const form = $("[data-form]");
  const input = $("#memo-text");
  const status = $("[data-status]"); // 화면 읽기 프로그램용 (눈에는 안 보인다)
  const save = $("[data-save]");
  const saveLabel = $("[data-save-label]");
  const hint = input.placeholder;
  let noteTimer = null;

  // 결과는 입력칸의 안내 문구 자리에 잠깐 보여 준다 (저장하면 입력칸이 비니까 그 자리가 보인다)
  function note(text, ms = NOTE_MS) {
    input.placeholder = text;
    status.textContent = text;
    clearTimeout(noteTimer);
    if (ms) noteTimer = setTimeout(() => (input.placeholder = hint), ms);
  }

  if (!hasKey) {
    note("연결 정보가 없어요", 0);
    input.disabled = save.disabled = true;
    return;
  }

  async function submit() {
    const text = input.value.trim();
    if (!text || save.disabled) return;
    save.disabled = true;
    try {
      await api("/memo", { text });
      announce("memo-saved"); // 인박스 위젯이 바로 새로 고친다
      const now = new Date();
      input.value = "";
      saveLabel.textContent = "저장";
      note(`저장했어요 · ${pad(now.getHours())}:${pad(now.getMinutes())}`);
    } catch {
      // 쓴 글이 남아 있어 안내 문구가 안 보이니, 버튼 글자로 알린다
      saveLabel.textContent = "다시";
      status.textContent = "저장 못 했어요. 다시 눌러 주세요";
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
