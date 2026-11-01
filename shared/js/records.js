// 작은 기록: 날마다의 집중·정리 횟수와 고양이 간식.
// 열쇠가 있는 주소에서는 중계 서버(D1)에 모아 기기끼리 합치고, 서버에서 받은 값을 이 기기에 받아 두어 화면은 바로 그린다.
// 열쇠가 없으면 예전처럼 이 기기에만 남긴다. 바뀌면 "records-changed"를 알려서 기록·고양이 위젯이 바로 다시 그린다
import { pad } from "./dom.js";
import { announce, onAnnounce, refreshWhileVisible } from "./live.js";
import { api, hasKey } from "./api.js";

const KEY = "pool-widgets:records"; // { days: { 날짜: { focus, tidy } }, snacks, synced: 서버 값을 받아 둔 것인지 }
const PENDING_KEY = "pool-widgets:records-pending"; // 아직 서버에 못 보낸 기록 [{ id, day, type }]
const DEVICE_KEY = "pool-widgets:device"; // 기기에 남아 있던 기록을 한 번만 옮기려고 정하는 기기 이름
const KEEP_DAYS = 21; // 이보다 오래된 날은 지운다 (서버 records.js와 맞춘다)
const REFRESH_MS = 60 * 1000; // 다른 기기에서 센 기록을 받아 오는 간격 (보이는 동안만)

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 남기지 못한다
  }
}

const listeners = new Set();
const read = () => load(KEY, {});

function write(data) {
  save(KEY, data);
  announce("records-changed"); // 같은 기기의 다른 위젯
  listeners.forEach((fn) => fn()); // 이 위젯 (알림은 보낸 쪽에는 오지 않는다)
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 기록 하나(type: "focus" · "tidy" · "snack")를 sign만큼 더한 새 값. 오래된 날은 지운다
function apply(data, events, sign = 1) {
  const next = { ...data, days: { ...data.days } };
  for (const { day, type } of events) {
    if (type === "snack") next.snacks = (next.snacks ?? 0) + sign;
    else next.days[day] = { ...next.days[day], [type]: (next.days[day]?.[type] ?? 0) + sign };
  }
  const oldest = dayKey(new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000));
  for (const day of Object.keys(next.days)) if (day < oldest) delete next.days[day];
  return next;
}

const pending = () => load(PENDING_KEY, []);

function deviceId() {
  let id = load(DEVICE_KEY, null);
  if (!id) save(DEVICE_KEY, (id = crypto.randomUUID()));
  return id;
}

// 서버와 맞추기: 처음이면 이 기기에 남아 있던 기록을 옮기고, 못 보낸 기록을 보내고, 서버 값을 받아 둔다.
// 한 번에 하나만 돌고, 도는 중에 생긴 기록도 같이 보낸다. 서버에 닿지 않으면 다음에 다시
let syncing = null;
const sync = () => (syncing ??= syncNow().finally(() => (syncing = null)));

async function syncNow() {
  const day = dayKey();
  let snap;
  try {
    const data = read();
    if (!data.synced) {
      // 못 보낸 기록은 따로 보내므로 옮길 값에서 뺀다
      const local = apply(data, pending(), -1);
      snap = await api("/records/import", { device: deviceId(), day, days: local.days, snacks: local.snacks ?? 0 });
    }
    for (let ev; (ev = pending()[0]); ) {
      snap = await api("/records", ev);
      save(PENDING_KEY, pending().filter((p) => p.id !== ev.id));
    }
    snap ??= await api(`/records?day=${day}`);
  } catch {
    return;
  }
  write({ ...apply({ days: snap.days, snacks: snap.snacks }, pending()), synced: true });
}

function add(type) {
  const ev = { id: crypto.randomUUID(), day: dayKey(), type };
  if (hasKey) save(PENDING_KEY, [...pending(), ev]);
  write(apply(read(), [ev])); // 화면에는 바로
  if (hasKey) sync();
}

// 오늘 기록에 1을 더한다 (type: "focus" 끝낸 집중 · "tidy" 정리한 인박스 자료)
export const record = (type) => add(type);

export const addSnack = () => add("snack");

// 주어진 날들(dayKey 목록)의 횟수
export function counts(type, days) {
  const data = read().days ?? {};
  return days.map((day) => data[day]?.[type] ?? 0);
}

export const snacks = () => read().snacks ?? 0;

// 간식 하나 쓰기 (없으면 false). 기기끼리 합치는 중이면 서버가 남은 간식을 확인한다
export async function useSnack() {
  if (!hasKey) {
    const data = read();
    if (!data.snacks) return false;
    write({ ...data, snacks: data.snacks - 1 });
    return true;
  }
  await sync(); // 못 보낸 간식이 있으면 먼저 보낸다
  try {
    const { used, days, snacks: left } = await api("/records/snack/use", { day: dayKey() });
    write({ ...apply({ days, snacks: left }, pending()), synced: true });
    return used;
  } catch {
    return false; // 서버에 닿지 않으면 간식을 줄 수 없다
  }
}

// 기록을 보여 주는 위젯: 바뀔 때마다(다른 위젯·다른 기기에서 바뀐 것까지) render.
// 기기끼리 합치는 중이면 처음과 보이는 동안 1분마다 서버와 맞춘다
export function onRecords(render) {
  listeners.add(render);
  onAnnounce("records-changed", render);
  if (!hasKey) return;
  sync();
  refreshWhileVisible(sync, REFRESH_MS);
}
