'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let particles: THREE.Points | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let torusGeom1: THREE.TorusGeometry | null = null;
    let torusGeom2: THREE.TorusGeometry | null = null;
    let icoGeom: THREE.IcosahedronGeometry | null = null;

    try {
      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || window.innerHeight || 600;

      // 1. Scene & Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 24;

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // 3. Particles
      const particleCount = 500;
      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 60;
        positions[i + 1] = (Math.random() - 0.5) * 60;
        positions[i + 2] = (Math.random() - 0.5) * 60;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMaterial = new THREE.PointsMaterial({
        color: 0xe6b84a,
        size: 0.16,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(geometry, particleMaterial);
      scene.add(particles);

      // 4. Rings
      const ringGroup = new THREE.Group();

      const ringMat1 = new THREE.MeshBasicMaterial({
        color: 0xd4a73b,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });

      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });

      torusGeom1 = new THREE.TorusGeometry(8, 0.08, 16, 60);
      const ring1 = new THREE.Mesh(torusGeom1, ringMat1);
      ringGroup.add(ring1);

      torusGeom2 = new THREE.TorusGeometry(6.5, 0.06, 16, 50);
      const ring2 = new THREE.Mesh(torusGeom2, ringMat2);
      ring2.rotation.x = Math.PI / 3;
      ringGroup.add(ring2);

      icoGeom = new THREE.IcosahedronGeometry(3.5, 1);
      const icoMesh = new THREE.Mesh(icoGeom, ringMat1);
      ringGroup.add(icoMesh);

      scene.add(ringGroup);

      // 5. Lighting
      const ambientLight = new THREE.AmbientLight(0xfff1c5, 0.8);
      scene.add(ambientLight);

      // Mouse & Scroll
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;
      let scrollY = 0;
      let targetScrollY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseX = (e.clientX - windowHalfX) * 0.0005;
        mouseY = (e.clientY - windowHalfY) * 0.0005;
      };

      const handleScroll = () => {
        scrollY = window.scrollY * 0.0035;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });

      const handleResize = () => {
        if (!renderer || !camera || !containerRef.current) return;
        const w = containerRef.current.clientWidth || window.innerWidth;
        const h = containerRef.current.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Render Loop with performance.now()
      let startTime = performance.now();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const elapsedTime = (performance.now() - startTime) * 0.001;

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        targetScrollY += (scrollY - targetScrollY) * 0.08;

        if (ringGroup) {
          ringGroup.rotation.y = elapsedTime * 0.1 + targetX * 3;
          ringGroup.rotation.x = elapsedTime * 0.06 + targetY * 3 + targetScrollY * 0.4;
          ringGroup.rotation.z = targetScrollY * 0.2;
        }

        if (camera) {
          camera.position.y = -targetScrollY * 1.2;
          camera.position.z = 24 - Math.min(targetScrollY * 2, 8);
        }

        if (particles) {
          particles.rotation.y = elapsedTime * 0.02;
          particles.rotation.x = elapsedTime * 0.01;
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer?.dispose();
        geometry?.dispose();
        torusGeom1?.dispose();
        torusGeom2?.dispose();
        icoGeom?.dispose();
      };
    } catch (e) {
      console.warn('Three.js background initialization error (gracefully falling back to CSS background):', e);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  );
}
