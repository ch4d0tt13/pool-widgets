// 버튼·장식용 7×7 픽셀 아이콘 (i = 아이콘 글자색, r = 하트 빨강)
import { drawSprite } from "./sprite.js";

export const ICONS = {
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

export const setIcon = (canvas, name) => drawSprite(canvas, ICONS[name]);

// 페이지 안의 <canvas data-icon="이름"> 을 모두 그린다
export function paintIcons() {
  document.querySelectorAll("canvas[data-icon]").forEach((c) => setIcon(c, c.dataset.icon));
}
