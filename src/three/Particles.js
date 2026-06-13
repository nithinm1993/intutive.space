/**
 * @fileoverview Neural network particle system for Intutive.space
 *
 * Renders ~1500 particle nodes with dynamic connection lines,
 * 6 animation states, theme-aware colors, and custom shaders
 * for a soft circular glow.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total number of particles in the system */
const PARTICLE_COUNT = 1500;

/** Maximum distance between two particles to draw a connection line */
const CONNECTION_DISTANCE = 2.8;

/** Maximum number of line segments (pre-allocated buffer) */
const MAX_CONNECTIONS = 4000;

/** Interpolation speed for position transitions (per second) */
const LERP_SPEED = 1.8;

/** Brownian drift intensity for idle state */
const DRIFT_INTENSITY = 0.15;

/** Radius of the default idle sphere */
const IDLE_RADIUS = 15;

// ---------------------------------------------------------------------------
// Theme color palettes
// ---------------------------------------------------------------------------

const THEME_DARK = {
  colorA: new THREE.Color('#6366f1'), // purple (top)
  colorB: new THREE.Color('#06b6d4'), // cyan   (bottom)
  lineColor: new THREE.Color(99 / 255, 102 / 255, 241 / 255),
  lineAlpha: 0.15,
};

const THEME_LIGHT = {
  colorA: new THREE.Color('#4f46e5'), // deeper purple
  colorB: new THREE.Color('#0891b2'), // deeper cyan
  lineColor: new THREE.Color(79 / 255, 70 / 255, 229 / 255),
  lineAlpha: 0.1,
};

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size attenuation: particles farther from camera appear smaller
    float attenuation = uSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(attenuation, 1.0, 64.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    // Circular soft glow — smooth falloff from center
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Two-stage falloff for a bright core + soft bloom halo
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float halo = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = core * 0.9 + halo * 0.45;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fill a Float32Array with random positions inside a sphere.
 * @param {Float32Array} arr
 * @param {number} radius
 */
function fillSphere(arr, radius) {
  for (let i = 0; i < arr.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random()); // uniform volume
    arr[i] = r * Math.sin(phi) * Math.cos(theta);
    arr[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i + 2] = r * Math.cos(phi);
  }
}

/**
 * Fill target array for the 'pulse' state — sphere wave outward.
 * @param {Float32Array} arr
 * @param {Float32Array} current - current positions used to derive direction
 */
function fillPulse(arr, current) {
  for (let i = 0; i < arr.length; i += 3) {
    const cx = current[i];
    const cy = current[i + 1];
    const cz = current[i + 2];
    const len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 0.001;
    const expand = IDLE_RADIUS * 1.6 + Math.random() * 4;
    arr[i] = (cx / len) * expand;
    arr[i + 1] = (cy / len) * expand;
    arr[i + 2] = (cz / len) * expand;
  }
}

/**
 * Fill target array for the 'cluster' state — dense mass at center.
 * @param {Float32Array} arr
 */
function fillCluster(arr) {
  fillSphere(arr, 5);
}

/**
 * Fill target array for the 'grid' state — 8×8×8 3D grid.
 * @param {Float32Array} arr
 */
function fillGrid(arr) {
  const size = 8;
  const spacing = 2.4;
  const offset = ((size - 1) * spacing) / 2;
  let idx = 0;

  for (let i = 0; i < arr.length; i += 3) {
    const gx = idx % size;
    const gy = Math.floor(idx / size) % size;
    const gz = Math.floor(idx / (size * size)) % size;

    arr[i] = gx * spacing - offset + (Math.random() - 0.5) * 0.2;
    arr[i + 1] = gy * spacing - offset + (Math.random() - 0.5) * 0.2;
    arr[i + 2] = gz * spacing - offset + (Math.random() - 0.5) * 0.2;

    idx = (idx + 1) % (size * size * size);
  }
}

/**
 * Fill target array for the 'orbit' state — 3 concentric rings.
 * @param {Float32Array} arr
 */
function fillOrbit(arr) {
  const rings = [
    { radius: 6, y: -2, count: 0 },
    { radius: 10, y: 0, count: 0 },
    { radius: 14, y: 2, count: 0 },
  ];
  const perRing = Math.floor(PARTICLE_COUNT / 3);

  for (let i = 0; i < arr.length; i += 3) {
    const pIdx = i / 3;
    const ringIdx = Math.min(Math.floor(pIdx / perRing), 2);
    const ring = rings[ringIdx];

    const angle = (Math.PI * 2 * ring.count) / perRing + Math.random() * 0.1;
    const rJitter = ring.radius + (Math.random() - 0.5) * 1.5;

    arr[i] = rJitter * Math.cos(angle);
    arr[i + 1] = ring.y + (Math.random() - 0.5) * 1.0;
    arr[i + 2] = rJitter * Math.sin(angle);

    ring.count++;
  }
}

/**
 * Fill target array for the 'converge' state — all to origin.
 * @param {Float32Array} arr
 */
function fillConverge(arr) {
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] = (Math.random() - 0.5) * 0.3;
    arr[i + 1] = (Math.random() - 0.5) * 0.3;
    arr[i + 2] = (Math.random() - 0.5) * 0.3;
  }
}

// ---------------------------------------------------------------------------
// ParticleSystem class
// ---------------------------------------------------------------------------

export class ParticleSystem {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add meshes to.
   */
  constructor(scene) {
    this._scene = scene;
    this._state = 'idle';
    this._elapsed = 0;
    this._isDark = true;
    this._palette = { ...THEME_DARK };

    // ----- Position buffers -----
    const count3 = PARTICLE_COUNT * 3;
    this._currentPositions = new Float32Array(count3);
    this._targetPositions = new Float32Array(count3);
    this._driftVelocities = new Float32Array(count3);

    // Initialise both buffers to idle sphere
    fillSphere(this._currentPositions, IDLE_RADIUS);
    this._targetPositions.set(this._currentPositions);
    this._initDriftVelocities();

    // ----- Color buffer -----
    this._colors = new Float32Array(count3);
    this._updateColors();

    // ----- Points geometry & material -----
    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this._currentPositions, 3),
    );
    this._geometry.setAttribute(
      'aColor',
      new THREE.BufferAttribute(this._colors, 3),
    );

    this._material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSize: { value: 1.6 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._points = new THREE.Points(this._geometry, this._material);
    this._scene.add(this._points);

    // ----- Connection lines -----
    this._linePositions = new Float32Array(MAX_CONNECTIONS * 6); // 2 verts × 3 per segment
    this._lineColors = new Float32Array(MAX_CONNECTIONS * 8); // 2 verts × 4 (rgba)

    this._lineGeometry = new THREE.BufferGeometry();
    this._lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this._linePositions, 3),
    );
    this._lineGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this._lineColors, 4),
    );
    this._lineGeometry.setDrawRange(0, 0);

    this._lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._lines = new THREE.LineSegments(this._lineGeometry, this._lineMaterial);
    this._scene.add(this._lines);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Transition to a named animation state.
   * Generates new target positions that particles will lerp toward.
   * @param {'idle'|'pulse'|'cluster'|'grid'|'orbit'|'converge'} state
   */
  setState(state) {
    this._state = state;

    switch (state) {
      case 'idle':
        fillSphere(this._targetPositions, IDLE_RADIUS);
        break;
      case 'pulse':
        fillPulse(this._targetPositions, this._currentPositions);
        break;
      case 'cluster':
        fillCluster(this._targetPositions);
        break;
      case 'grid':
        fillGrid(this._targetPositions);
        break;
      case 'orbit':
        fillOrbit(this._targetPositions);
        break;
      case 'converge':
        fillConverge(this._targetPositions);
        break;
      default:
        fillSphere(this._targetPositions, IDLE_RADIUS);
    }
  }

  /**
   * Update particle positions and connection lines each frame.
   * @param {number} deltaTime - Seconds since last frame.
   */
  update(deltaTime) {
    this._elapsed += deltaTime;
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * deltaTime);
    const pos = this._currentPositions;
    const tgt = this._targetPositions;

    // --- Lerp positions toward targets ---
    for (let i = 0; i < pos.length; i++) {
      pos[i] += (tgt[i] - pos[i]) * lerpFactor;
    }

    // --- Brownian drift in idle state ---
    if (this._state === 'idle') {
      const drift = this._driftVelocities;
      const t = this._elapsed;
      for (let i = 0; i < pos.length; i += 3) {
        // Slowly vary drift with time for organic motion
        const dIdx = i;
        pos[i] += Math.sin(t * drift[dIdx] * 2.0) * DRIFT_INTENSITY * deltaTime;
        pos[i + 1] += Math.cos(t * drift[dIdx + 1] * 2.0) * DRIFT_INTENSITY * deltaTime;
        pos[i + 2] += Math.sin(t * drift[dIdx + 2] * 1.5 + 1.0) * DRIFT_INTENSITY * deltaTime;
      }
    }

    // --- Orbit rotation ---
    if (this._state === 'orbit') {
      const perRing = Math.floor(PARTICLE_COUNT / 3);
      const speeds = [0.15, -0.1, 0.2];
      for (let i = 0; i < pos.length; i += 3) {
        const pIdx = i / 3;
        const ringIdx = Math.min(Math.floor(pIdx / perRing), 2);
        const speed = speeds[ringIdx] * deltaTime;
        const x = pos[i];
        const z = pos[i + 2];
        const cosS = Math.cos(speed);
        const sinS = Math.sin(speed);
        pos[i] = x * cosS - z * sinS;
        pos[i + 2] = x * sinS + z * cosS;

        // Also rotate targets so lerp doesn't fight the spin
        const tx = tgt[i];
        const tz = tgt[i + 2];
        tgt[i] = tx * cosS - tz * sinS;
        tgt[i + 2] = tx * sinS + tz * cosS;
      }
    }

    // Mark position buffer for GPU upload
    this._geometry.attributes.position.needsUpdate = true;

    // --- Update connection lines ---
    this._updateConnections();
  }

  /**
   * Switch colour palette based on the current theme.
   * @param {boolean} isDark - true for dark theme, false for light.
   */
  setTheme(isDark) {
    this._isDark = isDark;
    this._palette = isDark ? { ...THEME_DARK } : { ...THEME_LIGHT };
    this._updateColors();
    this._geometry.attributes.aColor.needsUpdate = true;
  }

  /**
   * Release all GPU resources. Call when removing the scene.
   */
  dispose() {
    this._scene.remove(this._points);
    this._scene.remove(this._lines);
    this._geometry.dispose();
    this._material.dispose();
    this._lineGeometry.dispose();
    this._lineMaterial.dispose();
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Populate random drift velocities for idle Brownian motion. */
  _initDriftVelocities() {
    for (let i = 0; i < this._driftVelocities.length; i++) {
      this._driftVelocities[i] = (Math.random() - 0.5) * 2;
    }
  }

  /** Recompute the per-particle colour buffer from the current palette. */
  _updateColors() {
    const { colorA, colorB } = this._palette;
    const tmpA = new THREE.Color();
    const tmpB = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Blend by normalised y position in the idle sphere
      const y = this._currentPositions[i * 3 + 1];
      const t = THREE.MathUtils.clamp((y + IDLE_RADIUS) / (IDLE_RADIUS * 2), 0, 1);
      tmpA.copy(colorA);
      tmpB.copy(colorB);
      tmpA.lerp(tmpB, t);

      this._colors[i * 3] = tmpA.r;
      this._colors[i * 3 + 1] = tmpA.g;
      this._colors[i * 3 + 2] = tmpA.b;
    }
  }

  /**
   * Rebuild connection lines between nearby particles.
   * Uses a simple distance check — acceptable for 1500 particles when
   * we cap the max connections.
   */
  _updateConnections() {
    const pos = this._currentPositions;
    const lp = this._linePositions;
    const lc = this._lineColors;
    const { lineColor, lineAlpha } = this._palette;
    const maxDist = CONNECTION_DISTANCE;
    const maxDistSq = maxDist * maxDist;

    let segIdx = 0;

    // Sample a subset per frame for performance — stride through pairs
    // We check every 4th particle against its neighbours to cap work.
    const step = 4;

    for (let i = 0; i < PARTICLE_COUNT && segIdx < MAX_CONNECTIONS; i += step) {
      const ix = pos[i * 3];
      const iy = pos[i * 3 + 1];
      const iz = pos[i * 3 + 2];

      for (let j = i + 1; j < PARTICLE_COUNT && segIdx < MAX_CONNECTIONS; j += step) {
        const dx = pos[j * 3] - ix;
        const dy = pos[j * 3 + 1] - iy;
        const dz = pos[j * 3 + 2] - iz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          const alpha = lineAlpha * (1 - Math.sqrt(distSq) / maxDist);
          const base = segIdx * 6;
          const cBase = segIdx * 8;

          // Vertex A
          lp[base] = ix;
          lp[base + 1] = iy;
          lp[base + 2] = iz;

          // Vertex B
          lp[base + 3] = pos[j * 3];
          lp[base + 4] = pos[j * 3 + 1];
          lp[base + 5] = pos[j * 3 + 2];

          // Color A
          lc[cBase] = lineColor.r;
          lc[cBase + 1] = lineColor.g;
          lc[cBase + 2] = lineColor.b;
          lc[cBase + 3] = alpha;

          // Color B
          lc[cBase + 4] = lineColor.r;
          lc[cBase + 5] = lineColor.g;
          lc[cBase + 6] = lineColor.b;
          lc[cBase + 7] = alpha;

          segIdx++;
        }
      }
    }

    this._lineGeometry.setDrawRange(0, segIdx * 2);
    this._lineGeometry.attributes.position.needsUpdate = true;
    this._lineGeometry.attributes.color.needsUpdate = true;
  }
}
