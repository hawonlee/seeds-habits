/**
 * Graph3D - Main 3D visualization component for knowledge graph
 * 
 * Renders nodes and edges in 3D space using Three.js via react-three-fiber
 * Includes camera controls, lighting, and interactive elements
 * 
 * @module Graph3D
 */

import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { LKGNode, LKGEdge } from '@/lib/knowledge/queries';
import { getLearningTypeColor } from '@/lib/knowledge/learningTypes';
import { CameraController } from './CameraController';
import * as THREE from 'three';

interface Graph3DProps {
  /** Array of nodes to render */
  nodes: LKGNode[];
  /** Array of edges connecting nodes */
  edges: LKGEdge[];
  /** ID of currently selected node */
  selectedNodeId: string | null;
  /** Callback when node is clicked */
  onNodeClick: (node: LKGNode) => void;
}

/**
 * Enhanced node visualization with hover and selection states
 */
function Node3D({ 
  node, 
  position, 
  isSelected,
  isConnected,
  isDimmed,
  onClick,
  onHover,
}: { 
  node: LKGNode; 
  position: [number, number, number]; 
  isSelected: boolean;
  isConnected: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onHover: (nodeId: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Get color based on learning type
  const baseColor = node.learning_type 
    ? getLearningTypeColor(node.learning_type as 'conceptual' | 'practical' | 'debugging' | 'exploratory' | 'deep-dive')
    : '#00d4ff';
  
  // Calculate visual states
  const baseScale = 0.3;
  let scale = baseScale;
  let emissiveIntensity = 0.3;
  let opacity = 1;
  
  if (isSelected) {
    scale = baseScale * 1.8;
    emissiveIntensity = 1.0;
  } else if (hovered) {
    scale = baseScale * 1.4;
    emissiveIntensity = 0.7;
  } else if (isConnected) {
    scale = baseScale * 1.1;
    emissiveIntensity = 0.5;
  } else if (isDimmed) {
    opacity = 0.2;
    emissiveIntensity = 0.1;
  }
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(node.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={emissiveIntensity}
        roughness={0.3}
        metalness={0.8}
        transparent
        opacity={opacity}
      />
      
      {/* Selection ring */}
      {isSelected && (
        <mesh scale={1.3}>
          <ringGeometry args={[0.9, 1.0, 32]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </mesh>
  );
}

/**
 * Enhanced edge visualization with highlighting
 */
function Edge3D({
  start,
  end,
  isHighlighted,
  isDimmed,
  opacity = 0.3,
}: {
  start: [number, number, number];
  end: [number, number, number];
  isHighlighted: boolean;
  isDimmed: boolean;
  opacity?: number;
}) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);
  
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);
  
  // Calculate visual properties
  let finalOpacity = opacity;
  let color = '#4a5568';
  
  if (isHighlighted) {
    finalOpacity = 0.8;
    color = '#00ffc8';
  } else if (isDimmed) {
    finalOpacity = 0.05;
  }
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={color} opacity={finalOpacity} transparent />
    </line>
  );
}

/**
 * Main 3D Graph Component
 * 
 * Renders the complete knowledge graph in 3D space with nodes and edges
 */
export function Graph3D({ nodes, edges, selectedNodeId, onNodeClick }: Graph3DProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ x: number; y: number; z: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  // Build position map from node data
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    
    nodes.forEach((node, index) => {
      // Use UMAP coordinates if available, otherwise use simple layout
      let x, y, z;
      
      if (node.umap_x !== null && node.umap_y !== null) {
        // Scale UMAP coordinates to reasonable 3D space
        x = (node.umap_x - 0.5) * 20;
        y = (node.umap_y - 0.5) * 20;
        z = node.umap_z !== null ? (node.umap_z - 0.5) * 20 : 0;
      } else {
        // Use spherical golden spiral for natural-looking 3D distribution
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
        const theta = phi * index;
        const r = 10; // radius
        x = r * Math.cos(theta) * Math.sqrt(index / nodes.length);
        y = r * Math.sin(theta) * Math.sqrt(index / nodes.length);
        z = (index / nodes.length - 0.5) * 15; // spread along z-axis
      }
      
      positions.set(node.id, [x, y, z]);
    });
    
    return positions;
  }, [nodes]);
  
  // Build node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, LKGNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);
  
  // Build connected nodes map
  const connectedNodes = useMemo(() => {
    const connections = new Map<string, Set<string>>();
    
    edges.forEach(edge => {
      if (!connections.has(edge.source_id)) {
        connections.set(edge.source_id, new Set());
      }
      if (!connections.has(edge.target_id)) {
        connections.set(edge.target_id, new Set());
      }
      connections.get(edge.source_id)?.add(edge.target_id);
      connections.get(edge.target_id)?.add(edge.source_id);
    });
    
    return connections;
  }, [edges]);
  
  // Determine which nodes are connected to active node (selected or hovered)
  const activeNodeId = selectedNodeId || hoveredNodeId;
  const activeConnections = activeNodeId ? connectedNodes.get(activeNodeId) : null;
  
  // Fly camera to selected node
  useEffect(() => {
    if (selectedNodeId) {
      const position = nodePositions.get(selectedNodeId);
      if (position) {
        setIsAnimating(true);
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
        setCameraTarget({ x: position[0], y: position[1], z: position[2] });
      }
    } else {
      setCameraTarget(null);
    }
  }, [selectedNodeId, nodePositions]);
  
  return (
    <Canvas
      style={{ background: '#0a0a0f' }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={75} />
      
      {/* Camera Controller for smooth transitions */}
      <CameraController 
        target={cameraTarget}
        onComplete={() => {
          setIsAnimating(false);
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        }}
      />
      
      {/* Controls - NO DAMPING to prevent jittering */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={10}
        maxDistance={100}
        enabled={!isAnimating}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a9eff" />
      
      {/* Background stars - STATIC (speed=0) to prevent jittering */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade={false}
        speed={0}
      />
      
      {/* Edges */}
      <Suspense fallback={null}>
        {edges.map(edge => {
          const sourcePos = nodePositions.get(edge.source_id);
          const targetPos = nodePositions.get(edge.target_id);
          
          if (!sourcePos || !targetPos) return null;
          
          // Highlight edge if either end is active
          const isHighlighted = activeNodeId && (
            edge.source_id === activeNodeId || edge.target_id === activeNodeId
          );
          
          // Dim edge if there's an active node and this edge isn't connected to it
          const isDimmed = activeNodeId && !isHighlighted;
          
          return (
            <Edge3D
              key={edge.id}
              start={sourcePos}
              end={targetPos}
              isHighlighted={!!isHighlighted}
              isDimmed={!!isDimmed}
              opacity={edge.weight * 0.5}
            />
          );
        })}
      </Suspense>
      
      {/* Nodes */}
      <Suspense fallback={null}>
        {nodes.map(node => {
          const position = nodePositions.get(node.id);
          if (!position) return null;
          
          const isSelected = node.id === selectedNodeId;
          const isConnected = activeConnections?.has(node.id) || false;
          const isDimmed = activeNodeId && !isSelected && !isConnected && node.id !== activeNodeId;
          
          return (
            <Node3D
              key={node.id}
              node={node}
              position={position}
              isSelected={isSelected}
              isConnected={isConnected}
              isDimmed={!!isDimmed}
              onClick={() => onNodeClick(node)}
              onHover={setHoveredNodeId}
            />
          );
        })}
      </Suspense>
    </Canvas>
  );
}

