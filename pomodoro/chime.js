// 끝 알림: 물방울 세 음을 세 번. 파일 없이 브라우저가 만든다.
// 시작할 때 끝나는 시각에 미리 예약해 둔다: 소리 시계는 탭이 뒤에 있어도 늦어지지 않는다 (타이머는 느려진다)
const NOTES = [784, 988, 1175]; // 솔·시·레
const NOTE_S = 0.16; // 음 사이
const REPEAT = 3;
const REPEAT_S = 1; // 묶음 사이
const VOLUME = 0.18;

export function createChime(getContext) {
  let scheduled = [];

  // 물방울 한 음: 살짝 높게 떨어졌다가 제 음으로 내려앉고 빠르게 사라진다
  function drop(ctx, freq, t) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(VOLUME, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
    scheduled.push(osc);
  }

  // delayS초 뒤에 울리게 예약한다 (앞서 예약한 것은 지운다)
  function schedule(delayS) {
    cancel();
    const ctx = getContext();
    ctx.resume();
    const at = ctx.currentTime + Math.max(0, delayS);
    for (let r = 0; r < REPEAT; r++) {
      NOTES.forEach((freq, i) => drop(ctx, freq, at + r * REPEAT_S + i * NOTE_S));
    }
  }

  // 멈추거나 처음으로 돌리면 예약한 소리를 지운다
  function cancel() {
    scheduled.forEach((osc) => {
      osc.stop();
      osc.disconnect();
    });
    scheduled = [];
  }

  return { schedule, cancel };
}
