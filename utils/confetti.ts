import confetti from 'canvas-confetti';

export const fireConfetti = (event: React.MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
    colors: ['#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    ticks: 100,
    gravity: 1.2,
    scalar: 0.8,
    drift: 0
  });
};
