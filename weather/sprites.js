// 12×12 픽셀 날씨 아이콘. 글자 하나가 한 칸, 색은 토큰 이름으로 정한다
const PALETTE = {
  y: "--sun",
  o: "--sun-deep",
  w: "--cloud",
  s: "--cloud-shade",
  b: "--ink-soft",
  n: "--water-4",
};

const CLOUD_TOP = [
  "............",
  ".....www....",
  "....wwwww...",
  "..wwwwwwww..",
  ".wwwwwwwwww.",
  "wwwwwwwwwwww",
  ".ssssssssss.",
];

const SPRITES = {
  sun: [
    ".....yy.....",
    ".y...yy...y.",
    "..y......y..",
    "....oooo....",
    "...oyyyyo...",
    "yy.oyyyyo.yy",
    "yy.oyyyyo.yy",
    "...oyyyyo...",
    "....oooo....",
    "..y......y..",
    ".y...yy...y.",
    ".....yy.....",
  ],
  partly: [
    ".......oooo.",
    "......oyyyyo",
    "......oyyyyo",
    "....www.ooo.",
    "...wwwww....",
    ".wwwwwwww...",
    "wwwwwwwwww..",
    "wwwwwwwwww..",
    ".ssssssss...",
    "............",
    "............",
    "............",
  ],
  cloud: [
    "............",
    "............",
    ".....www....",
    "....wwwww...",
    "..wwwwwwww..",
    ".wwwwwwwwww.",
    "wwwwwwwwwwww",
    "wwwwwwwwwwww",
    ".ssssssssss.",
    "............",
    "............",
    "............",
  ],
  rain: [
    ...CLOUD_TOP,
    "............",
    "..b...b...b.",
    ".b...b...b..",
    "............",
    "...b...b....",
  ],
  snow: [
    ...CLOUD_TOP,
    "............",
    "..n...n...n.",
    "............",
    "....n...n...",
    "..n.......n.",
  ],
  storm: [
    ...CLOUD_TOP,
    "......yy....",
    ".....yy.....",
    "....yyyy....",
    "......yy....",
    ".....y......",
  ],
};

export function drawSprite(canvas, name) {
  const rows = SPRITES[name];
  const styles = getComputedStyle(document.documentElement);
  const ctx = canvas.getContext("2d");
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!PALETTE[ch]) return;
      ctx.fillStyle = styles.getPropertyValue(PALETTE[ch]).trim();
      ctx.fillRect(x, y, 1, 1);
    });
  });
}
