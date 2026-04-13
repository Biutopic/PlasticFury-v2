import { useEffect, useRef } from 'react';
import type { PlayerState, GarbageItem, GameInput, CollisionEvent, PirateState, BombState, PlayerUpgrades } from '@/game/types';
import {
  movePlayer, checkGarbageCollection, checkBoatCollisions,
  handleDeath, regenHealth, spawnGarbageIfNeeded, createGarbage,
} from '@/game/gameEngine';
import { computeBotInput } from '@/game/botAI';
import { updatePirate, checkPiratePirateCollisions } from '@/game/pirateAI';
import {
  PIRATE_BOMB_DAMAGE, PIRATE_BOMB_BLAST_RADIUS, PIRATE_BOMB_FLIGHT_TIME, INVULN_AFTER_HIT,
  RESPAWN_DELAY,
} from '@/game/constants';

let bombExplosionIdCounter = 0;

interface Props {
  inputRef: React.RefObject<GameInput>;
  players: PlayerState[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerState[]>>;
  garbage: GarbageItem[];
  setGarbage: React.Dispatch<React.SetStateAction<GarbageItem[]>>;
  pirates: PirateState[];
  setPirates: React.Dispatch<React.SetStateAction<PirateState[]>>;
  bombs: BombState[];
  setBombs: React.Dispatch<React.SetStateAction<BombState[]>>;
  onCollisionEvents: (events: CollisionEvent[]) => void;
  localUpgrades: PlayerUpgrades;
  onLocalPlayerDeath?: () => void;
  onLocalPlayerRespawn?: () => void;
}

export default function GameLoop({
  inputRef, players, setPlayers, garbage, setGarbage,
  pirates, setPirates, bombs, setBombs, onCollisionEvents, localUpgrades,
  onLocalPlayerDeath, onLocalPlayerRespawn,
}: Props) {
  const lastTimeRef = useRef(performance.now() / 1000);
  const spawnTimerRef = useRef(0);
  const playersRef = useRef(players);
  const garbageRef = useRef(garbage);
  const piratesRef = useRef(pirates);
  const bombsRef = useRef(bombs);
  const localUpgradesRef = useRef(localUpgrades);
  const deathStartRef = useRef<number | null>(null);
  const onLocalPlayerDeathRef = useRef(onLocalPlayerDeath);
  const onLocalPlayerRespawnRef = useRef(onLocalPlayerRespawn);
  playersRef.current = players;
  garbageRef.current = garbage;
  piratesRef.current = pirates;
  bombsRef.current = bombs;
  localUpgradesRef.current = localUpgrades;
  onLocalPlayerDeathRef.current = onLocalPlayerDeath;
  onLocalPlayerRespawnRef.current = onLocalPlayerRespawn;

  useEffect(() => {
    // Initial garbage
    const initial: GarbageItem[] = [];
    for (let i = 0; i < 40; i++) initial.push(createGarbage());
    setGarbage(initial);
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(now - lastTimeRef.current, 0.1);
      lastTimeRef.current = now;

      const pList = [...playersRef.current];
      let gList = [...garbageRef.current];
      const pirateList = [...piratesRef.current];
      let bombList = [...bombsRef.current];

      // Move players
      for (const p of pList) {
        if (p.id === 'local') {
          if (deathStartRef.current === null) {
            movePlayer(p, inputRef.current!, dt, localUpgradesRef.current);
          }
        } else if (p.isBot) {
          const botInput = computeBotInput(p, gList, pList, dt);
          movePlayer(p, botInput, dt);
        }
      }

      // Garbage collection
      const collectedIds: string[] = [];
      for (const p of pList) {
        const ids = checkGarbageCollection(p, gList, p.id === 'local' ? localUpgradesRef.current : undefined);
        collectedIds.push(...ids);
      }
      if (collectedIds.length > 0) {
        const idSet = new Set(collectedIds);
        gList = gList.filter(g => !idSet.has(g.id));
      }

      // Boat collisions
      const collisionEvents = checkBoatCollisions(pList, now);

      // Pirate updates (movement + ram collisions + bomb throws)
      const newBombs: BombState[] = [];
      for (const pirate of pirateList) {
        const result = updatePirate(pirate, pList, dt, now);
        collisionEvents.push(...result.events);
        newBombs.push(...result.newBombs);
      }
      if (newBombs.length > 0) bombList.push(...newBombs);

      // Pirate-pirate push-apart (no damage, just prevent overlap)
      checkPiratePirateCollisions(pirateList);

      // Bomb flight updates
      const survivingBombs: BombState[] = [];
      for (const bomb of bombList) {
        bomb.progress += dt / PIRATE_BOMB_FLIGHT_TIME;

        if (bomb.progress >= 1.0) {
          // Bomb landed — check blast radius
          for (const p of pList) {
            const dx = bomb.targetX - p.x;
            const dz = bomb.targetZ - p.z;
            if (dx * dx + dz * dz < PIRATE_BOMB_BLAST_RADIUS * PIRATE_BOMB_BLAST_RADIUS) {
              if (now - p.lastHitTime > INVULN_AFTER_HIT) {
                p.health -= PIRATE_BOMB_DAMAGE;
                p.lastHitTime = now;
                collisionEvents.push({
                  id: `bexp_${bombExplosionIdCounter++}`,
                  x: bomb.targetX,
                  z: bomb.targetZ,
                  text: `-${PIRATE_BOMB_DAMAGE} HP`,
                  color: '#ff8800',
                  time: now,
                  victimId: p.id,
                  attackerId: bomb.pirateId,
                });
              }
            }
          }
          // bomb is consumed — do not push to survivingBombs
        } else {
          survivingBombs.push(bomb);
        }
      }
      bombList = survivingBombs;

      if (collisionEvents.length > 0) onCollisionEvents(collisionEvents);

      // Death / regen
      for (const p of pList) {
        if (p.id === 'local') {
          if (p.health <= 0) {
            if (deathStartRef.current === null) {
              // Just died — start the countdown
              deathStartRef.current = now;
              onLocalPlayerDeathRef.current?.();
            } else if (now - deathStartRef.current >= RESPAWN_DELAY) {
              // Countdown finished — respawn
              handleDeath(p);
              deathStartRef.current = null;
              onLocalPlayerRespawnRef.current?.();
            }
            // Frozen during countdown: no regen
          } else {
            regenHealth(p, now, dt, localUpgradesRef.current);
          }
        } else {
          handleDeath(p);
          regenHealth(p, now, dt);
        }
      }

      // Spawn garbage
      spawnTimerRef.current += dt;
      const { newGarbage, spawnTimer } = spawnGarbageIfNeeded(gList, spawnTimerRef.current);
      spawnTimerRef.current = spawnTimer;
      if (newGarbage.length > 0) gList.push(...newGarbage);

      setPlayers(pList);
      setGarbage(gList);
      setPirates(pirateList);
      setBombs(bombList);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
