// 버튼·장식용 7×7 픽셀 아이콘 (i = 아이콘 글자색, r = 하트 빨강). 창 제목 표시줄 버튼만 3×3
import { drawSprite } from "./sprite.js";

export const ICONS = {
  "win-min": ["...", "...", "iii"],
  "win-max": ["iii", "i.i", "iii"],
  "win-close": ["i.i", ".i.", "i.i"],
  play: [
    ".i.....",
    ".ii....",
    ".iii...",
    ".iiii..",
    ".iii...",
    ".ii....",
    ".i.....",
  ],
  pause: [
    ".......",
    ".ii.ii.",
    ".ii.ii.",
    ".ii.ii.",
    ".ii.ii.",
    ".ii.ii.",
    ".......",
  ],
  restart: [
    "..iii.i",
    ".i...ii",
    "i...iii",
    "i......",
    "i.....i",
    ".i...i.",
    "..iii..",
  ],
  heart: [
    ".......",
    ".rr.rr.",
    "rrrrrrr",
    "rrrrrrr",
    ".rrrrr.",
    "..rrr..",
    "...r...",
  ],
  "heart-empty": [
    ".......",
    ".rr.rr.",
    "r..r..r",
    "r.....r",
    ".r...r.",
    "..r.r..",
    "...r...",
  ],
  "sound-on": [
    "..i....",
    ".ii..i.",
    "iii...i",
    "iii.i.i",
    "iii...i",
    ".ii..i.",
    "..i....",
  ],
  "sound-off": [
    "..i....",
    ".ii....",
    "iii.i.i",
    "iii..i.",
    "iii.i.i",
    ".ii....",
    "..i....",
  ],
  fish: [
    ".......",
    ".iiii.i",
    "iiiiiii",
    "i.iiii.",
    "iiiiiii",
    ".iiii.i",
    ".......",
  ],
  drop: [
    "...i...",
    "..iii..",
    ".iiiii.",
    ".iiiii.",
    "iiiiiii",
    "iiiiiii",
    ".iiiii.",
  ],
};

// 분홍 튜브를 낀 검은 고양이 (물 배경 소품)
export const CAT = [
  "...k.....k...",
  "...kk...kk...",
  "...kkkkkkk...",
  "...kwkkkwk...",
  "...kkkrkkk...",
  "...kkkkkkk...",
  ".ggwwggwwggg.",
  "gggwwggwwgggg",
  "gggwwggwwgggg",
  ".ggwwggwwggg.",
];

// 기분 좋은 튜브 고양이 (눈웃음 + 발그레, 고양이 키우기 위젯)
export const CAT_HAPPY = [
  "...k.....k...",
  "...kk...kk...",
  "...kwkkkwk...",
  "...kkkkkkk...",
  "...pkkrkkp...",
  "...kkkkkkk...",
  ".ggwwggwwggg.",
  "gggwwggwwgggg",
  "gggwwggwwgggg",
  ".ggwwggwwggg.",
];

// 하늘에 흘러가는 작은 구름 (물 배경 소품)
export const CLOUD = [
  "...www....",
  ".wwwwwww..",
  "wwwwwwwwww",
  ".ssssssss.",
];

export const setIcon = (canvas, name) => drawSprite(canvas, ICONS[name]);

// 페이지 안의 <canvas data-icon="이름"> 을 모두 그린다
export function paintIcons() {
  document.querySelectorAll("canvas[data-icon]").forEach((c) => setIcon(c, c.dataset.icon));
}
