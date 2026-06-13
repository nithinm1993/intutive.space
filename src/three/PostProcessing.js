/**
 * @fileoverview Post-processing pipeline for the Intutive.space 3D scene.
 *
 * Wraps Three.js EffectComposer with an Unreal-style bloom pass
 * to give the neural-network particles a soft glow.
 */

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Vector2 } from 'three';

// ---------------------------------------------------------------------------
// Default bloom configuration
// ---------------------------------------------------------------------------

const DEFAULT_BLOOM_STRENGTH = 1.2;
const DEFAULT_BLOOM_RADIUS = 0.4;
const DEFAULT_BLOOM_THRESHOLD = 0.85;

// ---------------------------------------------------------------------------
// PostProcessing class
// ---------------------------------------------------------------------------

export class PostProcessing {
  /**
   * Create the post-processing pipeline.
   * @param {import('three').WebGLRenderer} renderer
   * @param {import('three').Scene}         scene
   * @param {import('three').Camera}        camera
   */
  constructor(renderer, scene, camera) {
    this._renderer = renderer;

    // Resolution vector (updated on resize)
    const size = renderer.getSize(new Vector2());
    this._resolution = new Vector2(size.x, size.y);

    // Composer
    this._composer = new EffectComposer(renderer);

    // Render pass — renders the scene normally first
    this._renderPass = new RenderPass(scene, camera);
    this._composer.addPass(this._renderPass);

    // Bloom pass — additive glow on bright areas
    this._bloomPass = new UnrealBloomPass(
      this._resolution,
      DEFAULT_BLOOM_STRENGTH,
      DEFAULT_BLOOM_RADIUS,
      DEFAULT_BLOOM_THRESHOLD,
    );
    this._composer.addPass(this._bloomPass);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Render one frame through the post-processing pipeline.
   */
  render() {
    this._composer.render();
  }

  /**
   * Update internal buffers when the viewport resizes.
   * @param {number} width  - New width in CSS pixels.
   * @param {number} height - New height in CSS pixels.
   */
  resize(width, height) {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);

    this._composer.setSize(w, h);
    this._bloomPass.resolution.set(w, h);
  }

  /**
   * Adjust bloom intensity at runtime (e.g. when switching themes).
   * @param {number} val - Bloom strength (0 = no bloom).
   */
  setBloomStrength(val) {
    this._bloomPass.strength = val;
  }

  /**
   * Release all GPU resources owned by the composer and its passes.
   */
  dispose() {
    // EffectComposer exposes renderTarget1 / renderTarget2
    this._composer.renderTarget1.dispose();
    this._composer.renderTarget2.dispose();

    // Dispose individual passes that hold their own resources
    if (this._bloomPass.dispose) {
      this._bloomPass.dispose();
    }
  }
}
