// ============================================================
// GAME CONSTANTS — All gameplay-tuning values in one place.
// ============================================================

/** Plastic thresholds to upgrade boat level (cumulative within current level). */
export const UPGRADE_THRESHOLDS = {
  N1: 2,   // lvl1 → lvl2
  N2: 2,   // lvl2 → lvl3
  N3: 2,   // lvl3 → lvl4
  N4: 50,  // lvl4 → lvl5
} as const;

/** Maps boat level → threshold needed for next upgrade. */
export const LEVEL_THRESHOLD_MAP: Record<number, number> = {
  1: UPGRADE_THRESHOLDS.N1,
  2: UPGRADE_THRESHOLDS.N2,
  3: UPGRADE_THRESHOLDS.N3,
  4: UPGRADE_THRESHOLDS.N4,
};

export const MAX_BOAT_LEVEL = 5;

// --- Movement ---
export const BASE_MOVE_SPEED = 14;
export const BOAT_TURN_SPEED = 2.5;
export const SPEED_PER_LEVEL = 1; // bonus per boat level

// --- Health & Combat ---
export const MAX_HEALTH = 100;
export const BASE_COLLISION_DAMAGE = 15;   // base damage before level scaling
export const DAMAGE_PER_LEVEL = 5;         // extra damage per attacker level
export const DEFENSE_PER_LEVEL = 3;        // damage reduction per defender level
export const PLASTIC_STEAL_FRACTION = 0.3; // steal 30% of victim's plastic (min 1)
export const HEALTH_REGEN_RATE = 2;        // HP/s
export const HEALTH_REGEN_DELAY = 3;       // seconds after last hit
export const INVULN_AFTER_HIT = 1.0;       // seconds of invulnerability
export const RESPAWN_DELAY = 3.0;          // seconds before respawning after death

// --- Garbage ---
export const GARBAGE_SPAWN_INTERVAL = 1.5; // seconds
export const MAX_GARBAGE_COUNT = 20;
export const GARBAGE_WORLD_RADIUS = 80;

// --- World ---
export const WORLD_RADIUS = 100;
export const WAVE_AMPLITUDE = 0.4;
export const WAVE_FREQUENCY = 0.3;

// --- Camera ---
export const CAMERA_HEIGHT = 12;
export const CAMERA_FOLLOW_DISTANCE = 26;
export const CAMERA_LOOK_Y = -4;

// --- Boat collision half-extents [halfWidth (X), halfLength (Z)] per level ---
// Derived from BoatModel.tsx hull box geometry: [1.2*s, 0.5*s, 3*s]
// Level 1 uses a GLTF model — extents estimated to match its visual size.
export const BOAT_COLLISION_EXTENTS: Record<number, { halfW: number; halfL: number }> = {
  1: { halfW: 0.6, halfL: 1.5 },   // GLTF fishing boat (approx)
  2: { halfW: 0.69, halfL: 1.73 },  // s=1.15
  3: { halfW: 0.78, halfL: 1.95 },  // s=1.3
  4: { halfW: 0.90, halfL: 2.25 },  // s=1.5
  5: { halfW: 1.02, halfL: 2.55 },  // s=1.7
};

// Extra margin added to boat OBB for garbage pickup detection
export const GARBAGE_COLLECT_MARGIN = 1.0;

// --- Bots ---
export const BOT_COUNT = 1;
export const BOT_NAMES = ['Hydronaute', 'Coral', 'Marlin', 'Triton', 'Dory', 'Splash', 'Reef', 'Bubbles'];

// --- Pirates ---
export const PIRATE_COUNT = 2;
export const PIRATE_CHASE_DURATION = 20;  // seconds before switching target
export const PIRATE_SPEED = 10;           // slightly slower than base player
export const PIRATE_TURN_SPEED = 2.0;
// Pirate ship collision half-extents (GLTF at PIRATE_SCALE=0.1, ~5.4 units long)
export const PIRATE_COLLISION_EXTENTS = { halfW: 1.0, halfL: 2.7 };
export const PIRATE_COLLISION_DAMAGE = 25;

// --- Pirate bombs ---
export const PIRATE_BOMB_DAMAGE = 15;        // HP dealt on explosion
export const PIRATE_BOMB_INTERVAL = 5;       // seconds between throws
export const PIRATE_BOMB_BLAST_RADIUS = 3.5; // world-units explosion radius
export const PIRATE_BOMB_FLIGHT_TIME = 2.5;  // seconds in the air
export const PIRATE_BOMB_ARC_HEIGHT = 10;    // peak height of arc

// --- Boost ---
export const BOOST_DRAIN_RATE = 0.45;   // energy lost per second while boosting (fully drains in ~2.2s)
export const BOOST_RECHARGE_RATE = 0.2; // energy gained per second when not boosting (fully recharges in 5s)

// --- Upgrades ---
export const UPGRADE_SCREEN_DURATION = 3; // seconds to choose
export const SOLAR_PANEL_REGEN_MULTIPLIER = 2.5; // HP regen multiplier
export const SPEED_UPGRADE_BONUS = 10; // extra move speed
export const MAGNET_EXTRA_RADIUS = 6.0; // extra garbage collect margin

/** Maps upgrade combo → boat model key (all base for now). */
export const UPGRADE_MODEL_MAP: Record<string, string> = {
  '': 'base',
  'solar_panel': 'base',
  'speed': 'base',
  'magnet': 'base',
  'solar_panel+speed': 'base',
  'solar_panel+magnet': 'base',
  'speed+magnet': 'base',
  'solar_panel+speed+magnet': 'base',
};

// --- Asset mapping (swap these when real models arrive) ---
export const BOAT_MODEL_MAP: Record<number, string> = {
  1: 'boat_lvl1',
  2: 'boat_lvl2',
  3: 'boat_lvl3',
  4: 'boat_lvl4',
  5: 'boat_lvl5',
};

export const GARBAGE_MODEL_MAP: Record<string, { path: string; scale: number; yOffset: number }> = {
  water_bottle: {
    path: '/assets/plastic/water_bottle_free_gltf/scene.gltf',
    scale: 5.0,       // native ~0.08 units, need ~0.6
    yOffset: 0.2,
  },
  canister: {
    path: '/assets/plastic/canister/scene.gltf',
    scale: 0.2,      // native ~12 units, need ~0.6
    yOffset: -0.8,
  },
  plastic_bucket: {
    path: '/assets/plastic/plastic_bucket_gltf/scene.gltf',
    scale: 0.04,     // native ~45 units, need ~0.6
    yOffset: 0.2,
  },
  traffic_cone: {
    path: '/assets/plastic/traffic_cone_uhrhabqfa_gltf_low/Traffic_Cone_uhrhabqfa_Low.gltf',
    scale: 0.03,      // native ~68 units, need ~0.6
    yOffset: 0.15,
  },
};
