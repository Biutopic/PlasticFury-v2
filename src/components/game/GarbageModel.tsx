import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getWaveHeight } from '@/game/waveUtils';
import { GARBAGE_MODEL_MAP } from '@/game/constants';
import type { GarbageItem } from '@/game/types';

const MAX_INSTANCES = 30;
const _obj = new THREE.Object3D();

/**
 * Extracts all Mesh geometries + materials from a GLTF scene.
 * We create one InstancedMesh per sub-mesh, sharing transforms.
 */
function extractMeshes(scene: THREE.Group) {
  const meshes: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }[] = [];
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      meshes.push({ geometry: m.geometry, material: m.material });
    }
  });
  return meshes;
}

interface TypeGroupProps {
  type: string;
  items: GarbageItem[];
}

function GarbageTypeGroup({ type, items }: TypeGroupProps) {
  const config = GARBAGE_MODEL_MAP[type];
  const { scene } = useGLTF(config.path);

  const meshData = useMemo(() => extractMeshes(scene), [scene]);
  const instancedRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

  // Keep ref array the right length
  useEffect(() => {
    instancedRefs.current = instancedRefs.current.slice(0, meshData.length);
  }, [meshData.length]);

  // Update instance count when items change
  useEffect(() => {
    for (const im of instancedRefs.current) {
      if (im) im.count = items.length;
    }
  }, [items.length]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const waveY = getWaveHeight(item.x, item.z, t);
      _obj.position.set(item.x, waveY + config.yOffset, item.z);
      _obj.rotation.set(
        Math.sin(t + item.bobOffset) * 0.15,
        t * 0.5 + item.bobOffset,
        0,
      );
      _obj.scale.setScalar(config.scale);
      _obj.updateMatrix();
      for (const im of instancedRefs.current) {
        if (im) im.setMatrixAt(i, _obj.matrix);
      }
    }
    for (const im of instancedRefs.current) {
      if (im) im.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {meshData.map((md, idx) => (
        <instancedMesh
          key={idx}
          ref={(el) => { instancedRefs.current[idx] = el; }}
          args={[md.geometry, undefined, MAX_INSTANCES]}
          castShadow
          frustumCulled={false}
        >
          {Array.isArray(md.material)
            ? <meshStandardMaterial />
            : <primitive object={md.material} attach="material" />
          }
        </instancedMesh>
      ))}
    </group>
  );
}

// Preload all GLTF models
for (const cfg of Object.values(GARBAGE_MODEL_MAP)) {
  useGLTF.preload(cfg.path);
}

interface Props {
  items: GarbageItem[];
}

export default function GarbageInstances({ items }: Props) {
  // Group items by type
  const grouped = useMemo(() => {
    const map: Record<string, GarbageItem[]> = {};
    for (const item of items) {
      if (!GARBAGE_MODEL_MAP[item.type]) continue;
      (map[item.type] ??= []).push(item);
    }
    return map;
  }, [items]);

  return (
    <>
      {Object.entries(grouped).map(([type, typeItems]) => (
        <GarbageTypeGroup key={type} type={type} items={typeItems} />
      ))}
    </>
  );
}
