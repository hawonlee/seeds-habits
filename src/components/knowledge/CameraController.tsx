/**
 * Camera Controller for 3D Graph
 * 
 * Provides smooth camera transitions, fly-to animations,
 * and preset camera positions for the knowledge graph visualization.
 * 
 * @module CameraController
 */

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';

export type CameraPreset = 'default' | 'top' | 'side' | 'front' | 'focused';

interface CameraTarget {
  position: Vector3;
  lookAt: Vector3;
  duration: number;
}

interface CameraControllerProps {
  /** Target position to fly to */
  target?: { x: number; y: number; z: number } | null;
  /** Camera preset to apply */
  preset?: CameraPreset;
  /** Whether to enable auto-rotation */
  autoRotate?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Get camera position and lookAt for preset views
 */
function getCameraPreset(preset: CameraPreset): { position: Vector3; lookAt: Vector3 } {
  const presets = {
    default: {
      position: new Vector3(0, 0, 50),
      lookAt: new Vector3(0, 0, 0),
    },
    top: {
      position: new Vector3(0, 50, 0),
      lookAt: new Vector3(0, 0, 0),
    },
    side: {
      position: new Vector3(50, 0, 0),
      lookAt: new Vector3(0, 0, 0),
    },
    front: {
      position: new Vector3(0, 0, 50),
      lookAt: new Vector3(0, 0, 0),
    },
    focused: {
      position: new Vector3(0, 0, 30),
      lookAt: new Vector3(0, 0, 0),
    },
  };

  return presets[preset];
}

/**
 * Smooth easing function (ease-in-out cubic)
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Camera controller component for smooth transitions
 */
export function CameraController({
  target,
  preset,
  autoRotate = false,
  onComplete,
}: CameraControllerProps) {
  const { camera } = useThree();
  const animationRef = useRef<CameraTarget | null>(null);
  const startPositionRef = useRef<Vector3>(new Vector3());
  const startLookAtRef = useRef<Vector3>(new Vector3());
  const progressRef = useRef<number>(0);
  const autoRotateAngleRef = useRef<number>(0);

  // Handle preset changes
  useEffect(() => {
    if (preset) {
      const { position, lookAt } = getCameraPreset(preset);
      startPositionRef.current.copy(camera.position);
      
      // Calculate current lookAt
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      startLookAtRef.current.copy(camera.position).add(direction);

      animationRef.current = {
        position: position.clone(),
        lookAt: lookAt.clone(),
        duration: 1500, // 1.5 seconds
      };
      progressRef.current = 0;
    }
  }, [preset, camera]);

  // Handle target changes (fly to node)
  useEffect(() => {
    if (target) {
      startPositionRef.current.copy(camera.position);
      
      // Calculate current lookAt
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      startLookAtRef.current.copy(camera.position).add(direction);

      // Calculate camera position relative to target
      const targetPos = new Vector3(target.x, target.y, target.z);
      const offset = new Vector3(10, 10, 10);
      const cameraPos = targetPos.clone().add(offset);

      animationRef.current = {
        position: cameraPos,
        lookAt: targetPos,
        duration: 400, // 0.4 seconds - fast and snappy
      };
      progressRef.current = 0;
    }
  }, [target, camera]);

  // Animation loop - ONLY runs when there's an actual animation
  useFrame((state, delta) => {
    // ONLY Handle camera animation when there's an active animation
    if (animationRef.current && progressRef.current < 1) {
      progressRef.current += (delta * 1000) / animationRef.current.duration;
      progressRef.current = Math.min(progressRef.current, 1);

      const t = easeInOutCubic(progressRef.current);

      // Interpolate position
      camera.position.lerpVectors(
        startPositionRef.current,
        animationRef.current.position,
        t
      );

      // Interpolate lookAt
      const currentLookAt = new Vector3().lerpVectors(
        startLookAtRef.current,
        animationRef.current.lookAt,
        t
      );
      camera.lookAt(currentLookAt);

      // Complete animation
      if (progressRef.current >= 1) {
        animationRef.current = null;
        onComplete?.();
      }
    }
    // Removed auto-rotate - it causes jittering
  });

  return null;
}

/**
 * Hook to control camera programmatically
 */
export function useCameraControls() {
  const { camera } = useThree();

  const flyTo = (target: { x: number; y: number; z: number }) => {
    const targetPos = new Vector3(target.x, target.y, target.z);
    const offset = new Vector3(10, 10, 10);
    const cameraPos = targetPos.clone().add(offset);

    // Smooth transition using a simple tween
    const startPos = camera.position.clone();
    const duration = 1000;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = easeInOutCubic(progress);

      camera.position.lerpVectors(startPos, cameraPos, t);
      camera.lookAt(targetPos);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const reset = () => {
    const startPos = camera.position.clone();
    const targetPos = new Vector3(0, 0, 50);
    const duration = 1000;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = easeInOutCubic(progress);

      camera.position.lerpVectors(startPos, targetPos, t);
      camera.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return { flyTo, reset };
}

