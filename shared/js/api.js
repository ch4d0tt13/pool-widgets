// 노션 중계 서버(worker/) 호출.
// 열쇠는 임베드 주소의 # 뒤(#key=...)에 둔다. # 뒤는 어느 서버로도 전송되지 않는다
// 확인용: 주소에 ?api=local 을 붙이면 로컬 중계 서버(worker/에서 npx wrangler dev)로 보낸다
const API_BASE =
  new URLSearchParams(location.search).get("api") === "local" ? "http://localhost:8787" : "https://pool-widgets-api.ch4d0tt13.workers.dev";

const key = new URLSearchParams(location.hash.slice(1)).get("key");

export const hasKey = Boolean(key);

export async function api(path, body) {
  const res = await fetch(API_BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "X-Pool-Key": key, ...(body && { "Content-Type": "application/json" }) },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}
