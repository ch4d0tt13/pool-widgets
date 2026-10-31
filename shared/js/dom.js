// 위젯들이 같이 쓰는 작은 도우미
export const $ = (sel) => document.querySelector(sel);

export const pad = (n) => String(n).padStart(2, "0");
