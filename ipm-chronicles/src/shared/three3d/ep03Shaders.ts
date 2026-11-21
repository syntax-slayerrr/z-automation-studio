import * as THREE from "three";
import { Pass } from "postprocessing";

/** Render layer excluded from the InkPass outline pass (2D character billboards, contact blobs, dust, light shafts). */
export const NOINK = 3;

export const TONE = {
  uLitCol: { value: new THREE.Vector3(1.38, 1.28, 1.12) },
  uShadeCol: { value: new THREE.Vector3(0.46, 0.40, 0.36) },
  uShadeLift: { value: new THREE.Vector3(0.05, 0.04, 0.03) },
  uLambert: { value: 0.36 },
  uSideK: { value: 0.86 },
  uTerm: { value: 0.24 },
  uBounce: { value: new THREE.Vector3(0.04, 0.025, 0.01) },
  uSat: { value: 1.0 },
};

export const CHAR = {
  uCharTint: { value: new THREE.Vector3(1.0, 0.94, 0.86) },
  uCharShade: { value: 0.86 },
  uGrad: { value: 0.08 },
  uBodyGrad: { value: 0.20 },
  uSideTint: { value: new THREE.Vector3(0.90, 0.84, 0.80) },
};

export const LFB = THREE.ShaderChunk.lights_fragment_begin
  .replace(
    "directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]",
    "sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]"
  )
  .replace(
    "vDirectionalShadowCoord[ i ] ) : 1.0;",
    "vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;"
  );

if (!LFB.includes("directLight.color *= sunVis")) {
  throw new Error("ep03Shaders.ts: unexpected three.js lights_fragment_begin chunk");
}

const TWO_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );
  float facing = max( dot( geometryNormal, geometryViewDir ), 0.0 );
  vec3 alb = max( mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, uSat ), 0.0 );
  reflectedLight.directDiffuse = alb * ( mix( uShadeCol, lit, sunTerm ) * skyK + uBounce * facing * clamp( 1.0 - dot( geometryNormal, upV ), 0.0, 1.0 ) * ( 1.0 - sunTerm ) )
    + uShadeLift * LIFT_K * ( 1.0 - sunTerm );
  reflectedLight.indirectDiffuse = vec3( 0.0 );
}
#endif
`;

const TONE_DECL =
  "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm; uniform vec3 uBounce; uniform float uSat;";

/** Stylised two-tone painterly gouache shading for 3D architectural & map meshes. */
export function twoTone<T extends THREE.MeshLambertMaterial | THREE.MeshPhongMaterial>(m: T, liftK = 1): T {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", TONE_DECL + `\n#define LIFT_K ${liftK.toFixed(3)}`)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
  };
  m.customProgramCacheKey = () => "ep03TwoTone_" + liftK.toFixed(3);
  return m;
}

const CARD_FRAG = /* glsl */ `
vec3 tintK = mix( vec3( 1.0 ), uCharTint, uTintK );
tintK /= pow( max( dot( tintK, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.2 ), uNorm );
vec3 outgoingLight = diffuseColor.rgb * tintK;
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float side = sign( sunV.x ) * smoothstep( 0.0, 0.35, abs( sunV.x ) );
  float head = smoothstep( 0.55, 0.62, vMapUv.y );
  float hw = mix( 0.16, 0.21, head );
  float uu = clamp( ( vMapUv.x - 0.5 ) / hw, -1.0, 1.0 ) * sign( dFdx( vMapUv.x ) + 1e-7 );
  float t = uu * side;
  float g = mix( uBodyGrad * uGradKB, min( uGrad * uGradK, 0.38 ), head );
  float dark = smoothstep( -0.15, 0.9, -t );
  vec3 sideK = mix( vec3( 1.0 ), uSideTint, dark * clamp( g / max( min( uGrad * uGradK, 0.38 ), 1e-3 ), 0.0, 1.5 ) * 0.5 );
  float top = 1.0 + 0.05 * clamp( ( vMapUv.y - 0.72 ) / 0.14, -1.0, 1.0 ) * clamp( dot( sunV, upV ) * 2.0, 0.0, 1.0 ) * head;
  float lift = 1.0 + 0.04 * smoothstep( 0.0, 0.9, t );
  outgoingLight *= mix( uCharShade, 1.0, sunVis ) * ( 1.0 - g * dark ) * sideK * top * lift * uGain;
  #ifdef USE_MAP
  {
    float warm = smoothstep( 0.08, 0.35, 1.0 - uCharTint.b );
    float sl = length( sunV.xy );
    vec2 d2 = sunV.xy / max( sl, 1e-4 );
    vec2 duv = 2.0 * uPx * ( d2.x * dFdx( vMapUv ) + d2.y * dFdy( vMapUv ) );
    float edge = step( texture2D( map, vMapUv + duv ).a, 0.5 );
    vec2 dirU = normalize( duv + vec2( 1e-9 ) );
    vec4 c1 = texture2D( map, vMapUv - dirU * vec2( 0.025, 0.015 ) );
    float skin = step( 0.5, c1.a ) * step( 0.3, c1.r ) * step( c1.b + 0.08, c1.r );
    float torso = step( 0.24, vMapUv.y ) * step( vMapUv.y, 0.58 ) * step( 0.5, c1.a );
    float rim = warm * smoothstep( 0.1, 0.4, sl ) * edge * max( skin * head, torso ) * mix( 0.55, 1.0, sunVis ) * 0.65;
    outgoingLight += vec3( 0.95, 0.58, 0.22 ) * rim;
  }
  #endif
}
#endif
`;

const CARD_DECL =
  "#include <common>\nuniform vec3 uCharTint; uniform float uCharShade; uniform float uGrad; uniform float uBodyGrad; uniform vec3 uSideTint;" +
  " uniform float uGradK; uniform float uGradKB; uniform float uTintK; uniform float uNorm; uniform float uGain; uniform float uPx;";

export const CARD_K = {
  uGradK: { value: 4.5 },
  uGradKB: { value: 1.45 },
  uTintK: { value: 0.58 },
  uNorm: { value: 0.72 },
  uGain: { value: 1.02 },
  uPx: { value: 1.0 },
};

/** Lit 2D HeritageKid billboard shader integrating sun tint, cast shadows, and subtle warm rim. */
export function cardShade(m: THREE.MeshLambertMaterial): THREE.MeshLambertMaterial {
  m.emissive.set(0x000000);
  m.emissiveIntensity = 0;
  m.emissiveMap = null;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CHAR, CARD_K);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", CARD_DECL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace(
        "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
        CARD_FRAG
      );
  };
  m.customProgramCacheKey = () => "ep03CardShade1";
  return m;
}

/** Multiply contact blob material under 2D characters and 3D furniture legs. */
export const blobMaterial = (map: THREE.Texture): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({
    map,
    transparent: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
  });

const neutralCurve = (c: number[]): number[] => {
  const x = Math.min(c[0], c[1], c[2]);
  const off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  const v = c.map((k) => k - off);
  const peak = Math.max(v[0], v[1], v[2]);
  const S = 0.76;
  if (peak < S) return v;
  const d = 1 - S;
  const np = 1 - (d * d) / (peak + d - S);
  const g = 1 - 1 / (0.15 * (peak - np) + 1);
  return v.map((k) => ((k * np) / peak) * (1 - g) + np * g);
};

export const untone = (target: THREE.ColorRepresentation, out = new THREE.Color()): THREE.Color => {
  const t = new THREE.Color(target);
  const tt = [t.r, t.g, t.b].map((k) => Math.min(k, 0.985));
  let c = tt.slice();
  for (let i = 0; i < 50; i++) {
    const y = neutralCurve(c);
    c = c.map((k, j) => Math.max(0, k + (tt[j] - y[j])));
  }
  return out.setRGB(c[0], c[1], c[2]);
};

export type InkOptions = {
  color?: THREE.ColorRepresentation;
  strength?: number;
  widthNear?: number;
  widthFar?: number;
  distNear?: number;
  distFar?: number;
  creaseScale?: number;
  depthLo?: number;
  depthHi?: number;
  angleLo?: number;
  angleHi?: number;
  concaveGain?: number;
  farOpacity?: number;
  fadeNear?: number;
  fadeFar?: number;
};

const INK_DEF: Required<InkOptions> = {
  color: "#1a0e07",
  strength: 0.92,
  widthNear: 3.4,
  widthFar: 2.1,
  distNear: 2.2,
  distFar: 26,
  creaseScale: 0.72,
  depthLo: 0.012,
  depthHi: 0.032,
  angleLo: 36,
  angleHi: 52,
  concaveGain: 0.65,
  farOpacity: 0.88,
  fadeNear: 60,
  fadeFar: 180,
};

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const NORMAL_VERT = /* glsl */ `
#include <common>
uniform mat3 cutUv;
varying vec3 vN;
varying vec3 vV;
varying vec2 vCut;
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  vN = transformedNormal;
  vCut = (cutUv * vec3(uv, 1.0)).xy;
  #include <begin_vertex>
  #include <project_vertex>
  vV = mvPosition.xyz;
}`;

const NORMAL_FRAG = /* glsl */ `
uniform sampler2D tCut;
uniform float cut;
varying vec3 vN;
varying vec3 vV;
varying vec2 vCut;
void main() {
  if (cut > 0.0 && texture2D(tCut, vCut).a < cut) discard;
  vec3 n;
  if (dot(vN, vN) < 1e-8) n = normalize(cross(dFdx(vV), dFdy(vV)));
  else n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  gl_FragColor = vec4(n, 1.0);
}`;

const MASK_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tMainDepth;
uniform vec2 texel;
uniform float cNear;
uniform float cFar;
uniform float p00;
uniform float p11;
uniform float wNear;
uniform float wFar;
uniform float dNear;
uniform float dFar;
uniform float creaseScale;
uniform float depthLo;
uniform float depthHi;
uniform float cosLo;
uniform float cosHi;
uniform float concaveGain;
uniform float farOpacity;
uniform float fadeNear;
uniform float fadeFar;
uniform float strength;
uniform float useMain;
uniform float pxScale;
uniform vec2 fogRange;
uniform float fogStart;
varying vec2 vUv;

const vec2 STEP[4] = vec2[4](vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(1.0, -1.0));
const float SLEN[4] = float[4](1.0, 1.0, 1.41421, 1.41421);
#define RMAX 7

float dist(sampler2D t, vec2 uv) { return -perspectiveDepthToViewZ(textureLod(t, uv, 0.0).x, cNear, cFar); }
vec3 viewPos(vec2 uv, float d) { vec2 n = uv * 2.0 - 1.0; return vec3(n.x * d / p00, n.y * d / p11, -d); }

float crease(vec3 n0, vec3 P0, float zc, vec2 uq, float zq) {
  vec4 nq = textureLod(tNormal, uq, 0.0);
  if (nq.a < 0.5 || abs(zq - zc) > zc * depthLo) return 0.0;
  float k = 1.0 - smoothstep(cosHi, cosLo, dot(n0, nq.xyz));
  if (dot(viewPos(uq, zq) - P0, n0) > 0.0) k *= concaveGain;
  return k;
}

void main() {
  vec4 nc = textureLod(tNormal, vUv, 0.0);
  if (nc.a < 0.5) { gl_FragColor = vec4(0.0); return; }
  float zc = dist(tDepth, vUv);

  if (useMain > 0.5) {
    float zm = dist(tMainDepth, vUv);
    zm = min(zm, dist(tMainDepth, vUv + vec2(texel.x, 0.0)));
    zm = min(zm, dist(tMainDepth, vUv - vec2(texel.x, 0.0)));
    zm = min(zm, dist(tMainDepth, vUv + vec2(0.0, texel.y)));
    zm = min(zm, dist(tMainDepth, vUv - vec2(0.0, texel.y)));
    if (zm < zc * 0.985 - 0.025) { gl_FragColor = vec4(0.0); return; }
  }

  float t = clamp(log(max(zc, dNear) / dNear) / log(dFar / dNear), 0.0, 1.0);
  float w = mix(wNear, wFar, t) * pxScale;
  float hc = 0.5 * w * creaseScale;
  float Wc = 1.0 / zc;
  vec3 n0 = nc.xyz;
  vec3 P0 = viewPos(vUv, zc);
  float eD = 0.0, eN = 0.0;
  for (int a = 0; a < 4; a++) {
    for (int r = 1; r <= RMAX; r++) {
      vec2 o = STEP[a] * texel * float(r);
      float d = (float(r) - 0.5) * SLEN[a];
      float cw = clamp(w + 0.5 - d, 0.0, 1.0);
      float ch = clamp(hc + 0.5 - d, 0.0, 1.0);
      if (cw <= 0.0 && ch <= 0.0) break;
      float z1 = dist(tDepth, vUv - o), z2 = dist(tDepth, vUv + o);
      float s = (1.0 / z1 + 1.0 / z2 - 2.0 * Wc) / Wc;
      eD = max(eD, smoothstep(depthLo, depthHi, -s) * cw);
      if (ch > 0.0) eN = max(eN, max(crease(n0, P0, zc, vUv - o, z1), crease(n0, P0, zc, vUv + o, z2)) * ch);
    }
  }

  float ink = max(eD, eN) * strength * mix(1.0, farOpacity, t) * (1.0 - smoothstep(fadeNear, fadeFar, zc));
  float f0 = max(fogRange.x, fogStart);
  float fogK = fogRange.y > f0 ? clamp((zc - f0) / (fogRange.y - f0), 0.0, 1.0) : 0.0;
  gl_FragColor = vec4(ink, fogK, 0.0, 1.0);
}`;

const COMP_FRAG = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D tMask;
uniform vec2 texel;
uniform vec3 inkColor;
uniform vec3 fogColor;
uniform float fogInk;
varying vec2 vUv;
float m(float x, float y) { return texture2D(tMask, vUv + vec2(x, y) * texel).r; }
void main() {
  float a = (4.0 * m(0.0, 0.0)
    + 2.0 * (m(1.0, 0.0) + m(-1.0, 0.0) + m(0.0, 1.0) + m(0.0, -1.0))
    + m(1.0, 1.0) + m(-1.0, 1.0) + m(1.0, -1.0) + m(-1.0, -1.0)) / 16.0;
  vec4 c = texture2D(inputBuffer, vUv);
  float fk = texture2D(tMask, vUv).g;
  vec3 inkC = mix(inkColor, fogColor, fk * fogInk);
  vec3 g = pow(max(c.rgb, 0.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(pow(mix(g, pow(inkC, vec3(1.0 / 2.2)), a), vec3(2.2)), c.a);
}`;

const COPY_FRAG = /* glsl */ `
uniform sampler2D tSrc;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tSrc, vUv);
  #include <colorspace_fragment>
}`;

/** Depth + normal crease ink outline pass that excludes NOINK objects (2D billboards & FX). */
export class InkPass extends Pass {
  private world: THREE.Scene;
  private cam: THREE.PerspectiveCamera;
  private rt: THREE.WebGLRenderTarget;
  private maskRT: THREE.WebGLRenderTarget;
  private tmpRT: THREE.WebGLRenderTarget;
  private normalMat: THREE.ShaderMaterial;
  private maskMat: THREE.ShaderMaterial;
  private compMat: THREE.ShaderMaterial;
  private copyMat: THREE.ShaderMaterial;
  private fsScene = new THREE.Scene();
  private fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private clearCol = new THREE.Color();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, options: InkOptions = {}) {
    super("InkPass");
    const o = { ...INK_DEF, ...options };
    this.world = scene;
    this.cam = camera;
    this.cam.layers.enable(NOINK);
    this.needsSwap = false;
    this.needsDepthTexture = true;

    this.rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
      samples: 0,
      depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
    });
    this.maskRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: false,
    });
    this.tmpRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
    });

    this.normalMat = new THREE.ShaderMaterial({
      vertexShader: NORMAL_VERT,
      fragmentShader: NORMAL_FRAG,
      side: THREE.DoubleSide,
      uniforms: { tCut: { value: null }, cut: { value: 0 }, cutUv: { value: new THREE.Matrix3() } },
    });
    this.normalMat.onBeforeRender = (_r, _s, _c, _g, object, group) => {
      const mat = (object as THREE.Mesh).material as THREE.Material | THREE.Material[];
      const gi = (group as unknown as { materialIndex?: number } | null)?.materialIndex ?? 0;
      const src = (Array.isArray(mat) ? mat[gi] : mat) as THREE.MeshLambertMaterial;
      const u = this.normalMat.uniforms;
      const map = src && src.alphaTest > 0 ? src.map : null;
      u.tCut.value = map;
      u.cut.value = map ? src.alphaTest : 0;
      if (map) {
        map.updateMatrix();
        (u.cutUv.value as THREE.Matrix3).copy(map.matrix);
      }
      this.normalMat.uniformsNeedUpdate = true;
    };

    const fs = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });
    const texel = new THREE.Vector2(1, 1);

    this.maskMat = fs(MASK_FRAG, {
      tNormal: { value: this.rt.texture },
      tDepth: { value: this.rt.depthTexture },
      tMainDepth: { value: null },
      texel: { value: texel },
      cNear: { value: 0.15 },
      cFar: { value: 250 },
      p00: { value: 1 },
      p11: { value: 1 },
      wNear: { value: o.widthNear },
      wFar: { value: o.widthFar },
      dNear: { value: o.distNear },
      dFar: { value: o.distFar },
      creaseScale: { value: o.creaseScale },
      depthLo: { value: o.depthLo },
      depthHi: { value: o.depthHi },
      cosLo: { value: Math.cos((o.angleLo * Math.PI) / 180) },
      cosHi: { value: Math.cos((o.angleHi * Math.PI) / 180) },
      concaveGain: { value: o.concaveGain },
      farOpacity: { value: o.farOpacity },
      fadeNear: { value: o.fadeNear },
      fadeFar: { value: o.fadeFar },
      strength: { value: o.strength },
      useMain: { value: 0 },
      pxScale: { value: 1 },
      fogRange: { value: new THREE.Vector2(0, 0) },
      fogStart: { value: 25 },
    });

    this.compMat = fs(COMP_FRAG, {
      inputBuffer: { value: null },
      tMask: { value: this.maskRT.texture },
      texel: { value: texel },
      inkColor: { value: new THREE.Color(o.color) },
      fogColor: { value: new THREE.Color() },
      fogInk: { value: 0.35 },
    });

    this.copyMat = fs(COPY_FRAG, { tSrc: { value: this.tmpRT.texture } });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.maskMat);
    this.quad.frustumCulled = false;
    this.fsScene.add(this.quad);
  }

  override setDepthTexture(depthTexture: THREE.Texture) {
    this.maskMat.uniforms.tMainDepth.value = depthTexture ?? null;
    this.maskMat.uniforms.useMain.value = depthTexture ? 1 : 0;
  }

  override setSize(width: number, height: number) {
    this.rt.setSize(width, height);
    this.maskRT.setSize(width, height);
    this.tmpRT.setSize(width, height);
    (this.maskMat.uniforms.texel.value as THREE.Vector2).set(1 / width, 1 / height);
    this.maskMat.uniforms.pxScale.value = height / 1920;
  }

  override render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget) {
    const scene = this.world;
    const cam = this.cam;
    const autoClear = renderer.autoClear;
    const shadowAuto = renderer.shadowMap.autoUpdate;
    const mask = cam.layers.mask;
    const override = scene.overrideMaterial;
    const background = scene.background;
    renderer.getClearColor(this.clearCol);
    const clearAlpha = renderer.getClearAlpha();
    renderer.autoClear = false;

    cam.layers.disable(NOINK);
    scene.overrideMaterial = this.normalMat;
    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.rt);
    renderer.clear(true, true, false);
    renderer.render(scene, cam);
    cam.layers.mask = mask;
    scene.overrideMaterial = override;
    scene.background = background;
    renderer.shadowMap.autoUpdate = shadowAuto;
    renderer.setClearColor(this.clearCol, clearAlpha);

    const u = this.maskMat.uniforms;
    const e = cam.projectionMatrix.elements;
    u.cNear.value = cam.near;
    u.cFar.value = cam.far;
    u.p00.value = e[0];
    u.p11.value = e[5];
    const fog = scene.fog as THREE.Fog | null;
    if (fog && fog.isFog) {
      (u.fogRange.value as THREE.Vector2).set(fog.near, fog.far);
      (this.compMat.uniforms.fogColor.value as THREE.Color).copy(fog.color);
    } else {
      (u.fogRange.value as THREE.Vector2).set(0, 0);
    }

    this.quad.material = this.maskMat;
    renderer.setRenderTarget(this.maskRT);
    renderer.render(this.fsScene, this.fsCam);

    this.compMat.uniforms.inputBuffer.value = inputBuffer.texture;
    this.quad.material = this.compMat;
    renderer.setRenderTarget(this.tmpRT);
    renderer.render(this.fsScene, this.fsCam);

    this.quad.material = this.copyMat;
    renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer);
    renderer.render(this.fsScene, this.fsCam);

    renderer.autoClear = autoClear;
  }

  override dispose() {
    this.rt.depthTexture?.dispose();
    this.rt.dispose();
    this.maskRT.dispose();
    this.tmpRT.dispose();
    this.normalMat.dispose();
    this.maskMat.dispose();
    this.compMat.dispose();
    this.copyMat.dispose();
    this.quad.geometry.dispose();
  }
}

/** Safety helper ensuring sprites, billboards, and transparent FX live on NOINK. */
export function noInkFallback(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!(m.isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints || (o as THREE.Line).isLine)) return;
    if (o.layers.mask === 1 << NOINK) return;
    const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.Material[];
    const card = !!m.customDepthMaterial || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints || (o as THREE.Line).isLine;
    const noDepth = mats.some((x) => x && x.depthWrite === false);
    const basicCut = mats.some((x) => x && (x as THREE.MeshBasicMaterial).isMeshBasicMaterial && x.alphaTest > 0);
    if (card || noDepth || basicCut) o.layers.set(NOINK);
  });
}
