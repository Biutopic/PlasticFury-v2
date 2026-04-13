// ============================================================
// Core game types
// ============================================================

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number; // Y-axis heading
  health: number;
  plasticCount: number;      // plastic in current level
  totalCollected: number;    // lifetime total (leaderboard)
  boatLevel: number;
  vx: number;                // current velocity x (units/s)
  vz: number;                // current velocity z (units/s)
  lastHitTime: number;       // timestamp of last damage taken
  boostEnergy: number;       // 0–1, drains while boosting, recharges otherwise
  isBot: boolean;
  color: string;
}

export interface GarbageItem {
  id: string;
  x: number;
  z: number;
  type: string; // key into GARBAGE_MODEL_MAP
  bobOffset: number; // random phase for animation
}

export interface GameState {
  players: Map<string, PlayerState>;
  garbage: GarbageItem[];
  time: number;
}

export interface GameInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export interface PirateState {
  id: string;
  x: number;
  z: number;
  rotation: number;
  vx: number;
  vz: number;
  targetId: string | null;  // ID of player being chased
  chaseTimer: number;        // seconds remaining before target switch
  bombTimer: number;         // seconds until next bomb throw
}

export interface BombState {
  id: string;
  originX: number;   // where it was thrown from
  originZ: number;
  targetX: number;   // where it will land
  targetZ: number;
  progress: number;  // 0 → 1 (0 = just thrown, 1 = landed)
  pirateId: string;  // which pirate threw it
}

export type UpgradeType = 'solar_panel' | 'speed' | 'magnet';

export interface PlayerUpgrades {
  solar_panel: boolean;
  speed: boolean;
  magnet: boolean;
}

export interface CollisionEvent {
  id: string;
  x: number;
  z: number;
  text: string;
  color: string;
  time: number;           // timestamp when it happened
  victimId: string;       // who got hit
  attackerId: string;     // who dealt the hit
}
