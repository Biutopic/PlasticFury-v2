import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { WORLD_RADIUS } from '@/game/constants';

export default function Ocean() {
  const { scene } = useThree();
  const waterRef = useRef<Water>(null);

  const water = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(WORLD_RADIUS * 5, WORLD_RADIUS * 5);
    const waterNormals = new THREE.TextureLoader().load(
      '/assets/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    );

    const waterObj = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0.7, 0.5, 0.6).normalize(),
      sunColor: 0xfff8e7,
      waterColor: 0x001e3d,
      distortionScale: 4.0,
      fog: scene.fog !== undefined,
      alpha: 0.95,
    });

    waterObj.rotation.x = -Math.PI / 2;
    return waterObj;
  }, [scene.fog]);

  useFrame((_state, delta) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms['time'].value += delta * 0.6;
    }
  });

  return <primitive ref={waterRef} object={water} />;
}
