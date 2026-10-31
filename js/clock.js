// 시계·날짜: 보는 사람 기기의 현지 시간으로 매초 갱신
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n) => String(n).padStart(2, "0");

export function startClock({ hour, minute, second, date }) {
  let lastDateText = "";

  function render() {
    const now = new Date();
    hour.textContent = pad(now.getHours());
    minute.textContent = pad(now.getMinutes());
    second.textContent = pad(now.getSeconds());

    const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;
    if (dateText !== lastDateText) {
      date.textContent = dateText;
      date.dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      lastDateText = dateText;
    }

    // 다음 초 경계에 맞춰 다시 그린다
    setTimeout(render, 1000 - now.getMilliseconds());
  }

  render();
}
