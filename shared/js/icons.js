// 버튼·장식용 7×7 픽셀 아이콘 (i = 아이콘 글자색, r = 하트 빨강).
// 글자 옆에 작게 쓰는 것은 5×5(-small, .icon--small), 창 제목 표시줄 버튼은 3×3. 늘 도트 1칸 = 그림 1칸으로 그린다
import { drawSprite } from "./sprite.js";

export const ICONS = {
  "win-min": ["...", "...", "iii"],
  "win-max": ["iii", "i.i", "iii"],
  "win-close": ["i.i", ".i.", "i.i"],
  "heart-small": [".r.r.", "rrrrr", "rrrrr", ".rrr.", "..r.."],
  "heart-empty-small": [".r.r.", "r.r.r", "r...r", ".r.r.", "..r.."],
  "fish-small": [".....", ".ii.i", "i.iii", ".ii.i", "....."],
  "pin-small": [".rrr.", "rwrrr", "rrrrr", ".rrr.", "..k.."],
  "play-small": [".i...", ".ii..", ".iii.", ".ii..", ".i..."],
  "pause-small": [".i.i.", ".i.i.", ".i.i.", ".i.i.", ".i.i."],
  "restart-small": [".ii.i", "i..ii", "i....", "i...i", ".iii."],
  "sound-on-small": [".i...", "ii.i.", "ii..i", "ii.i.", ".i..."],
  "sound-off-small": [".i...", "iir.r", "ii.r.", "iir.r", ".i..."], // 5칸에 ×를 띄울 자리가 없어 빨간 ×로 스피커와 구분
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

// 멀리 있는 작은 구름
export const CLOUD_SMALL = [
  ".www..",
  "wwwwww",
  ".ssss.",
];

// 갈매기 두 장면 (날개 올림 · 날개 펼침)
export const GULL = [
  ["b...b", ".b.b.", "..b.."],
  [".....", "bb.bb", "..b.."],
];

export const setIcon = (canvas, name) => drawSprite(canvas, ICONS[name]);

// 페이지 안의 <canvas data-icon="이름"> 을 모두 그린다
export function paintIcons() {
  document.querySelectorAll("canvas[data-icon]").forEach((c) => setIcon(c, c.dataset.icon));
}
