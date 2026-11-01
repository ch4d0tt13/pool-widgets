-- 기기끼리 합치는 기록 (src/records.js). 처음 한 번:
--   npx wrangler d1 execute pool-records --remote --file schema.sql

-- 날마다 집중(focus)·정리(tidy) 횟수. day는 기록한 기기의 현지 날짜 (YYYY-MM-DD)
CREATE TABLE IF NOT EXISTS counts (
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, type)
);

-- 날짜와 상관없는 합계 (고양이 간식 snacks)
CREATE TABLE IF NOT EXISTS totals (
  name TEXT PRIMARY KEY,
  n INTEGER NOT NULL DEFAULT 0
);

-- 이미 더한 기록 (+1을 다시 보내도 두 번 더하지 않게). 오래된 것은 지운다
CREATE TABLE IF NOT EXISTS seen (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL
);

-- 기기에 남아 있던 기록을 옮긴 기기 (한 번만 더하게)
CREATE TABLE IF NOT EXISTS imports (
  device TEXT PRIMARY KEY
);
