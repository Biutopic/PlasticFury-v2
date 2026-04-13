export default function Controls() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 select-none pointer-events-none">
      <div className="game-panel px-4 py-2 flex gap-4 text-[10px] text-muted-foreground tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
        <span><kbd className="text-foreground">W</kbd> Forward</span>
        <span><kbd className="text-foreground">S</kbd> Reverse</span>
        <span><kbd className="text-foreground">A</kbd>/<kbd className="text-foreground">D</kbd> Turn</span>
        <span><kbd className="text-foreground">Shift</kbd> Boost</span>
      </div>
    </div>
  );
}
