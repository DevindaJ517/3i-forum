// Lightweight WebGL particle engine for the hero intro.
//
// All motion runs on the GPU: every particle carries three target positions
// (a drifting cloud, the 3i logo mark, and a 3D sphere) and the vertex shader
// blends between them from a handful of uniforms. The CPU only updates those
// uniforms each frame, so it stays smooth on mid-range phones.

const VERTEX = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aText;
attribute vec3 aSphere;
attribute vec4 aRand;

uniform float uTime;
uniform float uAspect;
uniform float uMorphText;
uniform float uMorphSphere;
uniform float uBurst;
uniform float uScroll;
uniform vec2 uPointer;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uPixelRatio;
uniform float uSize;
uniform float uAlpha;

varying float vAlpha;
varying float vTint;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

void main() {
  float t = uTime;

  // 1. Drifting cloud.
  vec3 start = aStart;
  start.xy += vec2(sin(t * 0.3 + aRand.x * 6.2831), cos(t * 0.25 + aRand.y * 6.2831)) * 0.08;
  start = rotY(t * 0.05) * start;

  // 2. 3i logo mark, with a gentle shimmer.
  vec3 text = aText + vec3(sin(t * 2.0 + aRand.z * 20.0), cos(t * 1.7 + aRand.w * 20.0), 0.0) * 0.004;

  // 3. Organic sphere plus an orbiting dust ring.
  vec3 dir = aSphere;
  float n = sin(dir.x * 3.1 + t * 0.9) * sin(dir.y * 2.7 + t * 0.7) * sin(dir.z * 3.3 + t * 0.8);
  float r = uRadius * (1.0 + 0.2 * n + 0.05 * (aRand.x - 0.5));
  vec3 sp = dir * r;
  if (aRand.w > 0.86) {
    float a = aRand.x * 6.2831 + t * (0.08 + aRand.y * 0.15);
    float rr = uRadius * (1.45 + aRand.z * 0.8);
    sp = rotX(0.25) * vec3(cos(a) * rr, (aRand.y - 0.5) * 0.06, sin(a) * rr);
  }
  sp = rotX(0.3 + uPointer.y * 0.35) * rotY(t * 0.18 + uPointer.x * 0.6) * sp;
  sp *= 1.0 + uScroll * 0.9;
  sp.xy += uCenter + vec2(0.0, uScroll * 0.35);

  // Blend the three states with a per-particle stagger.
  float mt = clamp(uMorphText * 1.35 - aRand.x * 0.35, 0.0, 1.0);
  mt = mt * mt * (3.0 - 2.0 * mt);
  float ms = clamp(uMorphSphere * 1.4 - aRand.y * 0.4, 0.0, 1.0);
  ms = ms * ms * (3.0 - 2.0 * ms);

  vec3 pos = mix(mix(start, text, mt), sp, ms);

  // Burst outwards mid-way through the glyph -> sphere transition.
  vec3 away = pos - vec3(0.0, 0.0, -0.6);
  pos += normalize(away + 0.0001) * uBurst * sin(ms * 3.14159) * (0.5 + aRand.z * 1.3);

  // Simple perspective camera at z = 3.
  float depth = 3.0 - pos.z;
  float persp = 3.0 / max(depth, 0.2);
  gl_Position = vec4(pos.x * persp / uAspect, pos.y * persp, 0.0, 1.0);

  float twinkle = 0.75 + 0.25 * sin(t * 3.0 + aRand.x * 50.0);
  float glyph = mt * (1.0 - ms);
  float size = uSize * mix(0.55 + aRand.w * 0.9, 1.25, glyph) * twinkle;
  gl_PointSize = depth < 0.3 ? 0.0 : size * persp * uPixelRatio;

  vAlpha = uAlpha * mix(0.35 + 0.65 * aRand.z, 1.0, glyph) * clamp(persp * 0.85, 0.15, 1.0) * (1.0 - uScroll * 0.8);
  vTint = aRand.y;
}
`;

const FRAGMENT = /* glsl */ `
precision mediump float;
varying float vAlpha;
varying float vTint;
uniform vec3 uColorA;
uniform vec3 uColorB;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 col = mix(uColorA, uColorB, step(0.86, vTint));
  gl_FragColor = vec4(col * a * vAlpha, a * vAlpha);
}
`;

export type ParticleState = {
  morphText: number;
  morphSphere: number;
  burst: number;
  scroll: number;
  alpha: number;
};

export type ParticleEngine = {
  state: ParticleState;
  /** World-space aspect ratio (width / height) of the canvas. */
  readonly aspect: number;
  setTextTargets(points: Float32Array): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  destroy(): void;
};

type Options = { count: number; maxPixelRatio: number };

const INK = [0x15 / 255, 0x14 / 255, 0x15 / 255] as const;
const GOLD = [0xfd / 255, 0xbb / 255, 0x2b / 255] as const;
const CREAM = [1, 0.95, 0.84] as const;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

export function createParticleEngine(canvas: HTMLCanvasElement, { count, maxPixelRatio }: Options): ParticleEngine | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // --- Geometry -------------------------------------------------------------
  const start = new Float32Array(count * 3);
  const text = new Float32Array(count * 3);
  const sphere = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    // Cloud: random direction, spread in depth.
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const rr = 1.1 + Math.random() * 2.6;
    start[i * 3] = s * Math.cos(th) * rr * 1.4;
    start[i * 3 + 1] = u * rr;
    start[i * 3 + 2] = s * Math.sin(th) * rr - 1.2;

    // Fibonacci sphere: evenly spaced points.
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * golden;
    sphere[i * 3] = Math.cos(phi) * r;
    sphere[i * 3 + 1] = y;
    sphere[i * 3 + 2] = Math.sin(phi) * r;

    for (let k = 0; k < 4; k++) rand[i * 4 + k] = Math.random();
  }
  text.set(start); // until real glyph targets arrive

  const buffers: WebGLBuffer[] = [];
  const attribute = (name: string, data: Float32Array, size: number) => {
    const buffer = gl.createBuffer()!;
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return buffer;
  };
  attribute("aStart", start, 3);
  const textBuffer = attribute("aText", text, 3);
  attribute("aSphere", sphere, 3);
  attribute("aRand", rand, 4);

  // --- Uniforms -------------------------------------------------------------
  const loc = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    time: loc("uTime"),
    aspect: loc("uAspect"),
    morphText: loc("uMorphText"),
    morphSphere: loc("uMorphSphere"),
    burst: loc("uBurst"),
    scroll: loc("uScroll"),
    pointer: loc("uPointer"),
    center: loc("uCenter"),
    radius: loc("uRadius"),
    pixelRatio: loc("uPixelRatio"),
    size: loc("uSize"),
    alpha: loc("uAlpha"),
  };
  gl.uniform3fv(loc("uColorA"), GOLD);
  gl.uniform3fv(loc("uColorB"), CREAM);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // additive glow on a dark background
  gl.clearColor(INK[0], INK[1], INK[2], 1);

  // --- State ----------------------------------------------------------------
  const state: ParticleState = { morphText: 0, morphSphere: 0, burst: 0.9, scroll: 0, alpha: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let aspect = 1;
  let pixelRatio = 1;
  let raf = 0;
  let running = false;
  let lost = false;
  const t0 = performance.now();

  // Adaptive quality: if the first frames are slow, drop the resolution.
  let sampleFrames = 0;
  let sampleStart = 0;
  let degraded = false;

  function layout() {
    // Sphere sits to the right on wide screens and above the title on phones.
    if (aspect >= 1) {
      gl!.uniform2f(u.center, aspect * 0.42, 0.08);
      gl!.uniform1f(u.radius, Math.min(0.62, aspect * 0.3));
    } else {
      gl!.uniform2f(u.center, 0, 0.36);
      gl!.uniform1f(u.radius, Math.min(0.5, aspect * 0.72));
    }
    gl!.uniform1f(u.aspect, aspect);
    gl!.uniform1f(u.pixelRatio, pixelRatio);
    gl!.uniform1f(u.size, aspect >= 1 ? 3.2 : 2.8);
  }

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, degraded ? 1 : maxPixelRatio);
    const w = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    const h = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    gl!.viewport(0, 0, w, h);
    layout();
  }

  function frame(now: number) {
    if (!running || lost) return;
    raf = requestAnimationFrame(frame);

    if (!degraded && sampleFrames < 90) {
      if (sampleFrames === 30) sampleStart = now;
      sampleFrames++;
      if (sampleFrames === 90 && (now - sampleStart) / 60 > 24) {
        degraded = true;
        resize();
      }
    }

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    gl!.uniform1f(u.time, (now - t0) / 1000);
    gl!.uniform1f(u.morphText, state.morphText);
    gl!.uniform1f(u.morphSphere, state.morphSphere);
    gl!.uniform1f(u.burst, state.burst);
    gl!.uniform1f(u.scroll, state.scroll);
    gl!.uniform1f(u.alpha, state.alpha);
    gl!.uniform2f(u.pointer, pointer.x, pointer.y);

    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.POINTS, 0, count);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();

  return {
    state,
    get aspect() {
      return aspect;
    },
    setTextTargets(points) {
      gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, points.subarray(0, count * 3));
    },
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    resize,
    start() {
      if (running || lost) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

// Rasterise an SVG path on an offscreen canvas and pick `count` points
// inside it, mapped to world space (view height = 2 units at z = 0).
export function samplePathPoints(
  path: string,
  box: { width: number; height: number },
  count: number,
  { worldHeight, maxWorldWidth, offsetY = 0 }: { worldHeight: number; maxWorldWidth: number; offsetY?: number },
): Float32Array {
  const res = 400 / box.height; // raster at ~400px tall
  const w = Math.ceil(box.width * res);
  const h = Math.ceil(box.height * res);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(res, res);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(path));

  const { data } = ctx.getImageData(0, 0, w, h);
  const filled: number[] = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }

  const scale = Math.min(worldHeight / h, maxWorldWidth / w);
  const out = new Float32Array(count * 3);
  const pixels = filled.length / 2;

  for (let i = 0; i < count; i++) {
    const p = pixels ? Math.floor(Math.random() * pixels) : 0;
    const px = (filled[p * 2] ?? w / 2) + Math.random() * 2;
    const py = (filled[p * 2 + 1] ?? h / 2) + Math.random() * 2;
    out[i * 3] = (px - w / 2) * scale;
    out[i * 3 + 1] = -(py - h / 2) * scale + offsetY;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return out;
}
