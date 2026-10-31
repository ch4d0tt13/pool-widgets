// 이 기기에 남기는 작은 기록: 날마다의 집중·정리 횟수와 고양이 간식 (기기·브라우저마다 따로 남는다)
// 바뀌면 "records-changed"를 알려서 기록·고양이 위젯이 바로 다시 그린다
import { pad } from "./dom.js";
import { announce } from "./live.js";

const KEY = "pool-widgets:records";
const KEEP_DAYS = 21; // 이보다 오래된 날은 지운다

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 남기지 못한다
  }
  announce("records-changed");
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 오늘 기록에 1을 더한다 (type: "focus" 끝낸 집중 · "tidy" 정리한 인박스 자료)
export function record(type) {
  const data = read();
  const days = (data.days ??= {});
  const today = dayKey();
  days[today] = { ...days[today], [type]: (days[today]?.[type] ?? 0) + 1 };
  const oldest = dayKey(new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000));
  for (const day of Object.keys(days)) if (day < oldest) delete days[day];
  write(data);
}

// 주어진 날들(dayKey 목록)의 횟수
export function counts(type, days) {
  const data = read().days ?? {};
  return days.map((day) => data[day]?.[type] ?? 0);
}

export const snacks = () => read().snacks ?? 0;

export function addSnack() {
  const data = read();
  data.snacks = (data.snacks ?? 0) + 1;
  write(data);
}

// 간식 하나 쓰기 (없으면 false)
export function useSnack() {
  const data = read();
  if (!data.snacks) return false;
  data.snacks -= 1;
  write(data);
  return true;
}
