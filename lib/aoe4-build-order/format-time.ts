export function formatMinSec(seconds: number): string {
  const total = Math.round(seconds);
  const sec = total % 60;
  return `${Math.floor(total / 60)}:${sec < 10 ? '0' : ''}${sec}`;
}
