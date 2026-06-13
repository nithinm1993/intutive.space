/**
 * @fileoverview Main 3D scene orchestrator for Intutive.space.
 *
 * Creates and owns the WebGL renderer, camera, particle system, and
 * post-processing pipeline.  Exposes a minimal public API that the
 * main application layer can call from its own requestAnimationFrame
 * loop.
 */

import * as THREE from 'three';
import { ParticleSystem } from './Particles.js';
import { PostProcessing } from './PostProcessing.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Camera field of view in degrees */
const FOV = 60;

/** Camera near / far planes */
const NEAR = 0.1;
const FAR = 200;

/** Initial camera Z distance */
const CAMERA_Z = 28;

/** Maximum parallax rotation in radians (≈ 2°) */
const MAX_ROTATION = THREE.MathUtils.degToRad(2);

/** Parallax lerp speed (per second) */
const PARALLAX_SPEED = 2.5;

/** Bloom strength per theme */
const BLOOM_DARK = 1.2;
const BLOOM_LIGHT = 0.6;

// ---------------------------------------------------------------------------
// NeuralScene class
// ---------------------------------------------------------------------------

export class NeuralScene {
  /**
   * Initialise the entire 3D experience.
   * @param {HTMLElement} container - DOM element that will hold the canvas.
   */
  constructor(container) {
    if (!container) {
      throw new Error('NeuralScene: a valid DOM container is required.');
    }

    this._container = container;
    this._isDark = true;
    this._destroyed = false;

    // Clock for delta time
    this._clock = new THREE.Clock();

    // ---- Renderer ----
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;
    this._renderer.setClearColor(0x000000, 0); // transparent by default

    // Style the canvas as a fixed background layer
    const canvas = this._renderer.domElement;
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '0',
      pointerEvents: 'none',
    });
    container.appendChild(canvas);

    // ---- Scene ----
    this._scene = new THREE.Scene();

    // ---- Camera ----
    const aspect = window.innerWidth / window.innerHeight;
    this._camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
    this._camera.position.set(0, 0, CAMERA_Z);

    // ---- Parallax state ----
    this._targetRotationX = 0;
    this._targetRotationY = 0;
    this._currentRotationX = 0;
    this._currentRotationY = 0;

    // ---- Particle system ----
    this._particles = new ParticleSystem(this._scene);

    // ---- Post-processing ----
    this._postProcessing = new PostProcessing(
      this._renderer,
      this._scene,
      this._camera,
    );

    // Initial resize to fill viewport
    this.resize();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Transition the particle system to a new animation state.
   * @param {'idle'|'pulse'|'cluster'|'grid'|'orbit'|'converge'} state
   */
  setState(state) {
    this._particles.setState(state);
  }

  /**
   * Receive normalised mouse coordinates for parallax.
   * Values should be in the range [-1, 1] where (0, 0) is viewport centre.
   * @param {number} nx - Normalised X (-1 = left, 1 = right).
   * @param {number} ny - Normalised Y (-1 = top,  1 = bottom).
   */
  onMouseMove(nx, ny) {
    this._targetRotationX = -ny * MAX_ROTATION;
    this._targetRotationY = nx * MAX_ROTATION;
  }

  /**
   * Update renderer / camera / post-processing to match current viewport.
   * Call on window resize.
   */
  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this._renderer.setSize(width, height);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._postProcessing.resize(width, height);
  }

  /**
   * Main per-frame update.  Call this from your external rAF loop.
   */
  animate() {
    if (this._destroyed) return;

    const delta = this._clock.getDelta();

    // ---- Parallax camera rotation (smooth lerp) ----
    const pFactor = 1 - Math.exp(-PARALLAX_SPEED * delta);
    this._currentRotationX += (this._targetRotationX - this._currentRotationX) * pFactor;
    this._currentRotationY += (this._targetRotationY - this._currentRotationY) * pFactor;

    this._camera.rotation.x = this._currentRotationX;
    this._camera.rotation.y = this._currentRotationY;

    // ---- Update particles ----
    this._particles.update(delta);

    // ---- Render via post-processing ----
    this._postProcessing.render();
  }

  /**
   * Switch the visual theme (dark / light).
   * Updates particle colours, bloom intensity, and renderer clear colour.
   * @param {boolean} isDark - true for dark theme, false for light.
   */
  setTheme(isDark) {
    this._isDark = isDark;

    // Particles
    this._particles.setTheme(isDark);

    // Bloom
    this._postProcessing.setBloomStrength(isDark ? BLOOM_DARK : BLOOM_LIGHT);

    // Clear colour — fully transparent in both themes so the HTML
    // background shows through, but we adjust tone mapping exposure
    // slightly to compensate for the brighter light-mode page.
    this._renderer.toneMappingExposure = isDark ? 1.0 : 0.8;
  }

  /**
   * Tear down the entire scene and release GPU resources.
   * After calling this the instance should not be used again.
   */
  destroy() {
    this._destroyed = true;

    this._particles.dispose();
    this._postProcessing.dispose();
    this._renderer.dispose();

    // Remove canvas from DOM
    const canvas = this._renderer.domElement;
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}
