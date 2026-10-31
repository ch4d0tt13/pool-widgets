// 직접 그린 물 그림을 겹(레이어)별로 담은 도트 그림(shared/img/water.png, 180×60)을 읽는다
// 원본 그림은 저장소에 없고, tools/pixelate.py 로 만든 결과만 있다. 채널마다 한 겹이다
export const LAYER = { net: 0, shadow: 1, hue: 2 }; // R 빛 그물 · G 그늘 · B 물 색
const ART_URL = new URL(`../img/water.png${new URL(import.meta.url).search}`, import.meta.url);

export function loadWaterArt() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({ w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data });
    };
    img.onerror = () => resolve(null); // 못 읽으면 단색 물로 그린다
    img.src = ART_URL;
  });
}

// 그림을 좌우·위아래로 뒤집어 이어 붙인 것처럼 읽는다 (창이 그림보다 커도 이음새가 없게)
const mirror = (v, n) => {
  const p = ((v % (2 * n)) + 2 * n) % (2 * n);
  return p < n ? p : 2 * n - 1 - p;
};

// 한 겹의 값 (0 · 128 · 255)
export function layerAt(art, layer, x, y) {
  return art.data[(mirror(y, art.h) * art.w + mirror(x, art.w)) * 4 + layer];
}
