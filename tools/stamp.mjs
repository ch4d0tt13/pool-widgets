// 배포용 복사본 만들기: 위젯 파일을 out 폴더로 복사하면서 상대 주소(.js·.css) 뒤에 ?v=버전을 붙인다.
// 노션이 예전 파일을 기억하고 있어도 「전부 예전」 또는 「전부 새것」만 받게 되어 섞여 깨지지 않는다.
// 사용: node tools/stamp.mjs <버전> <out 폴더>   (GitHub Actions가 배포할 때 실행한다)
import { cpSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const [version, out] = process.argv.slice(2);
if (!version || !out) {
  console.error("사용: node tools/stamp.mjs <버전> <out 폴더>");
  process.exit(1);
}

// 배포에 넣지 않는 것 (서버 코드·도구·문서·설정)
const SKIP = new Set([".git", ".github", ".claude", "node_modules", "worker", "tools", "CLAUDE.md", ".gitignore", out]);
const STAMPED = new Set([".html", ".js", ".css"]);
// from "../a.js" · href="b.css" · @import url("./c.css")  (http로 시작하는 바깥 주소는 그대로)
const REF = /(from\s+|href=|@import url\()"((?!https?:)[^"?#]+\.(?:js|css))"/g;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

function copy(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const src = join(dir, name);
    const dest = join(out, src);
    if (statSync(src).isDirectory()) {
      mkdirSync(dest, { recursive: true });
      copy(src);
    } else if (STAMPED.has(extname(name))) {
      writeFileSync(dest, readFileSync(src, "utf8").replace(REF, `$1"$2?v=${version}"`));
    } else {
      cpSync(src, dest);
    }
  }
}

copy(".");
console.log(`stamped ${version} → ${out}`);
