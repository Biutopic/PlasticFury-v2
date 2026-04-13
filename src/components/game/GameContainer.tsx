import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from './GameScene';
import HUD from './HUD';
import Leaderboard from './Leaderboard';
import Controls from './Controls';
import GameLoop from './GameLoop';
import HitEffects from './HitEffects';
import UpgradeScreen from './UpgradeScreen';
import RespawnCountdown from './RespawnCountdown';
import type { PlayerState, GarbageItem, GameInput, CollisionEvent, PirateState, BombState, UpgradeType, PlayerUpgrades } from '@/game/types';
import { MAX_HEALTH, BOT_COUNT, BOT_NAMES, PIRATE_COUNT, WORLD_RADIUS } from '@/game/constants';

const PLAYER_COLORS = ['#00ffcc', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997'];

function randomSpawn() {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a) * 30, z: Math.sin(a) * 30 };
}

function createPlayer(id: string, name: string, isBot: boolean, colorIdx: number): PlayerState {
  const { x, z } = randomSpawn();
  return {
    id, name, x, z,
    rotation: Math.random() * Math.PI * 2,
    health: MAX_HEALTH,
    plasticCount: 0,
    totalCollected: 0,
    boatLevel: 1,
    vx: 0, vz: 0,
    lastHitTime: 0,
    boostEnergy: 1,
    isBot,
    color: PLAYER_COLORS[colorIdx % PLAYER_COLORS.length],
  };
}

export default function GameContainer() {
  const [started, setStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const inputRef = useRef<GameInput>({ forward: false, backward: false, left: false, right: false, boost: false });
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [garbage, setGarbage] = useState<GarbageItem[]>([]);
  const [pirates, setPirates] = useState<PirateState[]>([]);
  const [bombs, setBombs] = useState<BombState[]>([]);
  const [collisionEvents, setCollisionEvents] = useState<CollisionEvent[]>([]);
  const [localHitTimestamp, setLocalHitTimestamp] = useState(0);
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({ solar_panel: false, speed: false, magnet: false });
  const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);
  const prevLevelRef = useRef(1);

  const handleCollisionEvents = useCallback((events: CollisionEvent[]) => {
    setCollisionEvents(prev => [...prev, ...events]);
    // Check if local player was hit
    if (events.some(e => e.victimId === 'local')) {
      setLocalHitTimestamp(performance.now());
    }
    // Clean up old events after they fade out
    setTimeout(() => {
      setCollisionEvents(prev => prev.filter(e => !events.some(ne => ne.id === e.id)));
    }, 1500);
  }, []);

  const startGame = useCallback(() => {
    const name = playerName.trim() || 'Captain';
    const allPlayers: PlayerState[] = [createPlayer('local', name, false, 0)];
    for (let i = 0; i < BOT_COUNT; i++) {
      allPlayers.push(createPlayer(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], true, i + 1));
    }
    const allPirates: PirateState[] = [];
    for (let i = 0; i < PIRATE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      allPirates.push({
        id: `pirate_${i}`,
        x: Math.cos(angle) * (WORLD_RADIUS * 0.5),
        z: Math.sin(angle) * (WORLD_RADIUS * 0.5),
        rotation: Math.random() * Math.PI * 2,
        vx: 0,
        vz: 0,
        targetId: null,
        chaseTimer: 0,
        bombTimer: 3, // first bomb after 3s so it doesn't fire instantly
      });
    }

    setPlayers(allPlayers);
    setGarbage([]);
    setPirates(allPirates);
    setBombs([]);
    setStarted(true);
  }, [playerName]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent, pressed: boolean) => {
      const input = inputRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': input.forward = pressed; break;
        case 's': case 'arrowdown': input.backward = pressed; break;
        case 'a': case 'arrowleft': input.left = pressed; break;
        case 'd': case 'arrowright': input.right = pressed; break;
        case 'shift': input.boost = pressed; break;
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Detect level-up for local player
  const localPlayer = players.find(p => p.id === 'local');
  useEffect(() => {
    if (!localPlayer) return;
    if (localPlayer.boatLevel > prevLevelRef.current) {
      // Only show if there are upgrades left to pick
      const hasAvailable = !upgrades.solar_panel || !upgrades.speed || !upgrades.magnet;
      if (hasAvailable) {
        setShowUpgradeScreen(true);
      }
    }
    prevLevelRef.current = localPlayer.boatLevel;
  }, [localPlayer?.boatLevel]);

  const handleLocalPlayerDeath = useCallback(() => {
    setIsRespawning(true);
  }, []);

  const handleLocalPlayerRespawn = useCallback(() => {
    setIsRespawning(false);
  }, []);

  const handleUpgradeSelect = useCallback((type: UpgradeType) => {
    setUpgrades(prev => ({ ...prev, [type]: true }));
    setShowUpgradeScreen(false);
  }, []);

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'hsl(var(--ocean-deep))' }}>
        <div className="game-panel p-8 flex flex-col items-center gap-5" style={{ width: 340 }}>
          <h1 className="text-2xl font-bold tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))' }}>
            🌊 Ocean Cleanup
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Collect floating plastic, upgrade your boat, and outcompete other captains!
          </p>
          <input
            className="w-full px-3 py-2 rounded-md text-sm bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter your name..."
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            maxLength={16}
            autoFocus
          />
          <button
            onClick={startGame}
            className="w-full py-2.5 rounded-md text-sm font-bold tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Set Sail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen w-screen h-screen relative" style={{ background: '#000' }}>
      <Canvas shadows camera={{ fov: 60, near: 0.1, far: 500, position: [0, 10, -15] }}>
        <GameScene localPlayer={localPlayer!} players={players} garbage={garbage} collisionEvents={collisionEvents} pirates={pirates} bombs={bombs} inputRef={inputRef} />
      </Canvas>
      <GameLoop
        inputRef={inputRef}
        players={players}
        setPlayers={setPlayers}
        garbage={garbage}
        setGarbage={setGarbage}
        pirates={pirates}
        setPirates={setPirates}
        bombs={bombs}
        setBombs={setBombs}
        onCollisionEvents={handleCollisionEvents}
        localUpgrades={upgrades}
        onLocalPlayerDeath={handleLocalPlayerDeath}
        onLocalPlayerRespawn={handleLocalPlayerRespawn}
      />
      <HitEffects hitTimestamp={localHitTimestamp} />
      <RespawnCountdown isRespawning={isRespawning} />
      {showUpgradeScreen && (
        <UpgradeScreen currentUpgrades={upgrades} onSelect={handleUpgradeSelect} />
      )}
      <HUD player={localPlayer!} />
      <Leaderboard players={players} localId="local" />
      <Controls />
    </div>
  );
}
