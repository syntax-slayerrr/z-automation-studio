import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";

const LENS_FRAG = /* glsl */ `
uniform float focus;
uniform float cInf;
uniform float nearScale;
uniform float maxCoC;
#define GOLDEN 2.39996323

float cocAt(float d, float s) {
  float c = cInf * s * (1.0 - focus / max(d, 1e-3));
  if (c < 0.0) c *= nearScale;
  return clamp(c, -maxCoC * s, maxCoC * s);
}
float distAt(vec2 uv) { return -getViewZ(readDepth(uv)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (cInf < 0.25) { outputColor = inputColor; return; }
  float s = resolution.y / 1920.0;
  float d0 = -getViewZ(depth);
  float r0 = abs(cocAt(d0, s));
  float R = r0 * SPREAD;
  vec3 acc = inputColor.rgb;
  float wsum = 1.0;
  if (R > 0.5) {
    for (int i = 0; i < TAPS; i++) {
      float rr = sqrt((float(i) + 0.5) / float(TAPS)) * R;
      float a = float(i) * GOLDEN + ROT;
      vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
      float ds = distAt(suv);
      float rs = abs(cocAt(ds, s)) * SPREAD;
      if (ds > d0) rs = min(rs, R);
      float w = clamp(rs - rr + 0.5, 0.0, 1.0);
      acc += texture2D(inputBuffer, suv).rgb * w;
      wsum += w;
    }
  }
  vec3 col = acc / wsum;
#if NEAR_TAPS > 0
  float M = maxCoC * s;
  vec3 fg = vec3(0.0);
  float fw = 0.0, cov = 0.0;
  for (int i = 0; i < NEAR_TAPS; i++) {
    float rr = sqrt((float(i) + 0.5) / float(NEAR_TAPS)) * M;
    if (rr <= R) continue;
    float a = float(i) * GOLDEN + 1.0;
    vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
    float ds = distAt(suv);
    if (ds >= d0 * 0.97) continue;
    float rs = abs(cocAt(ds, s));
    float w = clamp(rs - rr + 0.5, 0.0, 1.0);
    fg += texture2D(inputBuffer, suv).rgb * w;
    fw += w;
    cov += w * (M * M) / max(rs * rs, 1.0);
  }
  if (fw > 0.0) col = mix(col, fg / fw, clamp(cov / float(NEAR_TAPS), 0.0, 1.0));
#endif
  outputColor = vec4(col, inputColor.a);
}`;

type Stage = { taps: number; spread: number; nearTaps: number; rot: number };
const PRE: Stage = { taps: 16, spread: 0.287, nearTaps: 0, rot: 0.61 };
const MAIN: Stage = { taps: 48, spread: 0.958, nearTaps: 24, rot: 0 };

export class LensBlurEffect extends Effect {
  constructor({ maxCoC = 22, nearScale = 1.25, stage = MAIN }: { maxCoC?: number; nearScale?: number; stage?: Stage } = {}) {
    super("LensBlurEffect", LENS_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      defines: new Map<string, string>([
        ["TAPS", String(stage.taps)],
        ["SPREAD", stage.spread.toFixed(4)],
        ["NEAR_TAPS", String(stage.nearTaps)],
        ["ROT", stage.rot.toFixed(4)],
      ]),
      uniforms: new Map<string, Uniform>([
        ["focus", new Uniform(4.0)],
        ["cInf", new Uniform(0.0)],
        ["nearScale", new Uniform(nearScale)],
        ["maxCoC", new Uniform(maxCoC)],
      ]),
    });
  }
  set focus(v: number) {
    this.uniforms.get("focus")!.value = v;
  }
  set cInf(v: number) {
    this.uniforms.get("cInf")!.value = v;
  }
}

/** Paired two-stage deterministic Vogel-disc depth of field effect. */
export class LensBlur {
  readonly pre: LensBlurEffect;
  readonly main: LensBlurEffect;
  constructor({ maxCoC = 22, nearScale = 1.25 } = {}) {
    this.pre = new LensBlurEffect({ maxCoC, nearScale, stage: PRE });
    this.main = new LensBlurEffect({ maxCoC, nearScale, stage: MAIN });
  }
  set focus(v: number) {
    this.pre.focus = v;
    this.main.focus = v;
  }
  set cInf(v: number) {
    this.pre.cInf = v;
    this.main.cInf = v;
  }
  dispose() {
    this.pre.dispose();
    this.main.dispose();
  }
}

const GRAIN_FRAG = /* glsl */ `
uniform float seed;
uniform float amount;
uniform float cellPx;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float h3(ivec2 c, uint k) { return float(pcg(uint(c.x) + pcg(uint(c.y) + pcg(k)))) * (1.0 / 4294967295.0) - 0.5; }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 p = uv * resolution / (cellPx * resolution.y / 1920.0);
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  uint k = uint(seed + 0.5) * 2654435761u + 1013904223u;
  float n = mix(mix(h3(i, k), h3(i + ivec2(1, 0), k), f.x), mix(h3(i + ivec2(0, 1), k), h3(i + ivec2(1, 1), k), f.x), f.y);
  vec3 g = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
  float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
  float w = 0.25 + 0.75 * clamp(4.0 * l * (1.0 - l), 0.0, 1.0);
  g = max(g + n * (amount / 0.2145) * w, 0.0);
  outputColor = vec4(pow(g, vec3(2.2)), inputColor.a);
}`;

export class GrainEffect extends Effect {
  constructor({ amount = 0.018, cellPx = 1.6 }: { amount?: number; cellPx?: number } = {}) {
    super("GrainEffect", GRAIN_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["seed", new Uniform(0)],
        ["amount", new Uniform(amount)],
        ["cellPx", new Uniform(cellPx)],
      ]),
    });
  }
  set seed(v: number) {
    this.uniforms.get("seed")!.value = v;
  }
}

const GRADE_FRAG = /* glsl */ `
uniform float gradeKy[7];
uniform float gradeKm[7];
uniform vec3 gradeSat;
uniform vec3 gradeTintS;
uniform vec3 gradeTintM;
uniform vec3 gradeTintH;
uniform vec2 gradeVig;
uniform float gradeAmount;

vec3 gradeEncode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 gradeDecode(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
float gradeHermite(float v, float x0, float x1, float y0, float y1, float m0, float m1) {
  float h = x1 - x0, t = (v - x0) / h, t2 = t * t, t3 = t2 * t;
  return (2.0 * t3 - 3.0 * t2 + 1.0) * y0 + (t3 - 2.0 * t2 + t) * h * m0 + (-2.0 * t3 + 3.0 * t2) * y1 + (t3 - t2) * h * m1;
}
float gradeCurve(float v) {
  v = clamp(v, 0.0, 1.0);
  if (v < 0.1)  return gradeHermite(v, 0.0, 0.1, gradeKy[0], gradeKy[1], gradeKm[0], gradeKm[1]);
  if (v < 0.25) return gradeHermite(v, 0.1, 0.25, gradeKy[1], gradeKy[2], gradeKm[1], gradeKm[2]);
  if (v < 0.5)  return gradeHermite(v, 0.25, 0.5, gradeKy[2], gradeKy[3], gradeKm[2], gradeKm[3]);
  if (v < 0.75) return gradeHermite(v, 0.5, 0.75, gradeKy[3], gradeKy[4], gradeKm[3], gradeKm[4]);
  if (v < 0.9)  return gradeHermite(v, 0.75, 0.9, gradeKy[4], gradeKy[5], gradeKm[4], gradeKm[5]);
  return gradeHermite(v, 0.9, 1.0, gradeKy[5], gradeKy[6], gradeKm[5], gradeKm[6]);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 src = gradeEncode(inputColor.rgb);
  vec3 c = vec3(gradeCurve(src.r), gradeCurve(src.g), gradeCurve(src.b));
  const vec3 W = vec3(0.2126, 0.7152, 0.0722);
  float y = dot(c, W);
  float wS = 1.0 - smoothstep(0.0, 0.55, y);
  float wH = smoothstep(0.45, 1.0, y);
  float wM = 1.0 - wS - wH;
  float s = gradeSat.y + (gradeSat.x - gradeSat.y) * wS + (gradeSat.z - gradeSat.y) * wH;
  c = vec3(y) + s * (c - vec3(y));
  c += wS * gradeTintS + wM * gradeTintM + wH * gradeTintH;
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p) * 0.70710678;
  c *= 1.0 - gradeVig.x * smoothstep(gradeVig.y, 1.0, r);
  c = clamp(c, 0.0, 1.0);
  outputColor = vec4(gradeDecode(mix(src, c, gradeAmount)), inputColor.a);
}`;

const E_CB: [number, number, number] = [0.0, -0.18733, 1.8556];
const E_CR: [number, number, number] = [1.5748, -0.46813, 0.0];
const tintRGB = (cb: number, cr: number) =>
  new Vector3(cb * E_CB[0] + cr * E_CR[0], cb * E_CB[1] + cr * E_CR[1], cb * E_CB[2] + cr * E_CR[2]);

export const GRADE_KX = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
export function monoTangents(ky: number[]): number[] {
  const n = GRADE_KX.length;
  const h: number[] = [];
  const d: number[] = [];
  const m = new Array(n).fill(0);
  for (let k = 0; k < n - 1; k++) {
    h.push(GRADE_KX[k + 1] - GRADE_KX[k]);
    d.push((ky[k + 1] - ky[k]) / h[k]);
  }
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    if (d[k - 1] * d[k] <= 0) {
      m[k] = 0;
      continue;
    }
    const w1 = 2 * h[k] + h[k - 1];
    const w2 = h[k] + 2 * h[k - 1];
    m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
  }
  return m;
}

export type GradeParams = {
  ky: number[];
  sat: [number, number, number];
  tintS: [number, number];
  tintM: [number, number];
  tintH: [number, number];
  vig: [number, number];
};

/** Display-referred documentary colour grading post-processing effect. */
export class GradeEffect extends Effect {
  constructor(p: GradeParams, amount = 1) {
    super("GradeEffect", GRADE_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["gradeKy", new Uniform(p.ky.slice())],
        ["gradeKm", new Uniform(monoTangents(p.ky))],
        ["gradeSat", new Uniform(new Vector3(...p.sat))],
        ["gradeTintS", new Uniform(tintRGB(...p.tintS))],
        ["gradeTintM", new Uniform(tintRGB(...p.tintM))],
        ["gradeTintH", new Uniform(tintRGB(...p.tintH))],
        ["gradeVig", new Uniform(new Vector2(...p.vig))],
        ["gradeAmount", new Uniform(amount)],
      ]),
    });
  }

  set(p: GradeParams, amount = 1): void {
    const u = this.uniforms;
    u.get("gradeKy")!.value = p.ky.slice();
    u.get("gradeKm")!.value = monoTangents(p.ky);
    (u.get("gradeSat")!.value as Vector3).set(...p.sat);
    u.get("gradeTintS")!.value = tintRGB(...p.tintS);
    u.get("gradeTintM")!.value = tintRGB(...p.tintM);
    u.get("gradeTintH")!.value = tintRGB(...p.tintH);
    (u.get("gradeVig")!.value as Vector2).set(...p.vig);
    u.get("gradeAmount")!.value = amount;
  }
}
