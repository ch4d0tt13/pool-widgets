// 기기끼리 합치는 기록: 날마다 집중·정리 횟수와 고양이 간식 (D1, 표는 schema.sql)
// 모든 요청은 보내는 기기의 오늘 날짜(day)를 함께 받아, 그날부터 KEEP_DAYS일 전까지만 돌려주고 그보다 오래된 날은 지운다
import { httpError } from "./notion.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[\w-]{8,64}$/;
const DAY_TYPES = ["focus", "tidy"];
const KEEP_DAYS = 21; // 위젯 records.js와 맞춘다
const MAX_IMPORT = 10000; // 옮기기 한 칸에 받을 수 있는 가장 큰 수 (잘못 보낸 값 막기)

function checkDay(day) {
  if (!DATE.test(day ?? "")) throw httpError(400, "day must be YYYY-MM-DD");
}

// day에서 KEEP_DAYS일 전
function oldestDay(day) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - KEEP_DAYS);
  return d.toISOString().slice(0, 10);
}

// { days: { "YYYY-MM-DD": { focus, tidy } }, snacks }
async function snapshot(env, day) {
  const [rows, snack] = await env.DB.batch([
    env.DB.prepare("SELECT day, type, n FROM counts WHERE day >= ?").bind(oldestDay(day)),
    env.DB.prepare("SELECT n FROM totals WHERE name = 'snacks'"),
  ]);
  const days = {};
  for (const { day: d, type, n } of rows.results) (days[d] ??= {})[type] = n;
  return { days, snacks: snack.results[0]?.n ?? 0 };
}

// GET /records?day=YYYY-MM-DD
export async function getRecords(env, day) {
  checkDay(day);
  return snapshot(env, day);
}

// POST /records { id, day, type: focus | tidy | snack } 하나 더하기.
// 기기가 못 받은 응답 때문에 같은 기록을 다시 보내도 id가 같으면 한 번만 더한다
export async function addRecord(env, { id, day, type } = {}) {
  checkDay(day);
  if (!ID.test(id ?? "")) throw httpError(400, "bad id");
  if (![...DAY_TYPES, "snack"].includes(type)) throw httpError(400, "bad type");

  const fresh = "WHERE NOT EXISTS (SELECT 1 FROM seen WHERE id = ?)";
  const add =
    type === "snack"
      ? env.DB.prepare(`INSERT INTO totals (name, n) SELECT 'snacks', 1 ${fresh} ON CONFLICT (name) DO UPDATE SET n = n + 1`).bind(id)
      : env.DB.prepare(`INSERT INTO counts (day, type, n) SELECT ?, ?, 1 ${fresh} ON CONFLICT (day, type) DO UPDATE SET n = n + 1`).bind(day, type, id);
  const oldest = oldestDay(day);
  await env.DB.batch([
    add,
    env.DB.prepare("INSERT OR IGNORE INTO seen (id, day) VALUES (?, ?)").bind(id, day),
    env.DB.prepare("DELETE FROM counts WHERE day < ?").bind(oldest),
    env.DB.prepare("DELETE FROM seen WHERE day < ?").bind(oldest),
  ]);
  return snapshot(env, day);
}

// POST /records/snack/use { day } 간식 하나 쓰기 (남아 있을 때만). used: 썼는지
export async function useSnack(env, { day } = {}) {
  checkDay(day);
  const res = await env.DB.prepare("UPDATE totals SET n = n - 1 WHERE name = 'snacks' AND n > 0").run();
  return { used: res.meta.changes > 0, ...(await snapshot(env, day)) };
}

// POST /records/import { device, day, days, snacks } 기기에 남아 있던 기록을 기기마다 한 번만 더한다.
// 옮긴 기기 표시를 맨 앞에 두어, 이미 옮긴 기기면 묶음 전체가 취소된다 (imported: false)
export async function importRecords(env, { device, day, days = {}, snacks = 0 } = {}) {
  checkDay(day);
  if (!ID.test(device ?? "")) throw httpError(400, "bad device");
  const count = (n) => Number.isInteger(n) && n > 0 && n <= MAX_IMPORT;
  const oldest = oldestDay(day);

  const stmts = [env.DB.prepare("INSERT INTO imports (device) VALUES (?)").bind(device)];
  const addDay = env.DB.prepare("INSERT INTO counts (day, type, n) VALUES (?, ?, ?) ON CONFLICT (day, type) DO UPDATE SET n = n + excluded.n");
  for (const [d, row] of Object.entries(days)) {
    if (!DATE.test(d) || d < oldest) continue;
    for (const type of DAY_TYPES) if (count(row?.[type])) stmts.push(addDay.bind(d, type, row[type]));
  }
  if (count(snacks)) {
    stmts.push(env.DB.prepare("INSERT INTO totals (name, n) VALUES ('snacks', ?) ON CONFLICT (name) DO UPDATE SET n = n + excluded.n").bind(snacks));
  }

  let imported = true;
  try {
    await env.DB.batch(stmts);
  } catch (err) {
    if (!/UNIQUE/i.test(err.message)) throw err;
    imported = false;
  }
  return { imported, ...(await snapshot(env, day)) };
}
