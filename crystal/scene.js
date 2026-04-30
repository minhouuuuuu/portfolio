import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  uniform, vec3, vec4, float, int,
  sin, cos, fract, floor, dot, mix, smoothstep, pow, sqrt, max, normalize, cross, abs, step,
  positionLocal, normalLocal, uv,
  Fn, If,
  modelWorldMatrix, cameraPosition, normalWorld,
  time as tslTime,
} from 'three/tsl';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0,5);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);
await renderer.init();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Uniforms
const uTime = uniform(0.0);
const uVoronoiScale = uniform(7.3);
const uDisplacementStrength = uniform(0.26);
const uEdgeSharpness = uniform(8.0);
const uCellJitter = uniform(0.69);
const uRoughness = uniform(0.3);
const uInnerGlow = uniform(0.4);
const uColorWhite = uniform(new THREE.Color('#000000'));
const uColorBlue = uniform(new THREE.Color('#1c52f2'));
const uColorDeep = uniform(new THREE.Color('#010d0e'));

// Dissolve uniforms
const uDissolveProgress = uniform(0.0);
const uDissolveNoiseScale = uniform(6.3);
const uDissolveEdgeWidth = uniform(0.26);
const uDissolveEdgeColor = uniform(new THREE.Color('#000000'));
const uDissolveEdgeIntensity = uniform(4.5);
const uDissolveBandWidth = uniform(0.5);

// StoneOrigin uniforms
const uStoneNoiseScale = uniform(11.4);
const uStoneRoughness = uniform(0.9);
const uStoneColor1 = uniform(new THREE.Color('#b5b5b5'));
const uStoneColor2 = uniform(new THREE.Color('#6b6b6b'));
const uStoneColor3 = uniform(new THREE.Color('#000000'));

// TSL hash function
const hash3 = Fn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const px = dot(p, vec3(127.1, 311.7, 74.7));
  const py = dot(p, vec3(269.5, 183.3, 246.1));
  const pz = dot(p, vec3(113.5, 271.9, 124.6));
  const h = vec3(px, py, pz);
  return fract(sin(h).mul(43758.5453123)).mul(2.0).sub(1.0);
});

// TSL voronoi - returns vec4(minDist, edgeDist, 0, 0)
const voronoi = Fn(([x_immutable, jitter_immutable]) => {
  const x = vec3(x_immutable).toVar();
  const jitter = float(jitter_immutable).toVar();
  const p = floor(x).toVar();
  const f = fract(x).toVar();

  const minDist = float(100.0).toVar();
  const secondMin = float(100.0).toVar();

  // Unrolled 3x3x3 neighbor search — inline to avoid TSL Fn closure issues
  for (let k = -1; k <= 1; k++) {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const b = vec3(float(i), float(j), float(k));
        const r = b.sub(f).add(hash3(p.add(b)).mul(jitter));
        const d = dot(r, r);
        If(d.lessThan(minDist), () => {
          secondMin.assign(minDist);
          minDist.assign(d);
        }).Else(() => {
          If(d.lessThan(secondMin), () => {
            secondMin.assign(d);
          });
        });
      }
    }
  }

  return vec4(sqrt(minDist), sqrt(secondMin).sub(sqrt(minDist)), float(0), float(0));
});

// Simple noise in TSL
const noise3D = Fn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const i = floor(p).toVar();
  const f = fract(p).toVar();
  const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

  const n = dot(i, vec3(1.0, 57.0, 113.0));
  const a = fract(sin(n).mul(43758.5453));
  const b = fract(sin(n.add(1.0)).mul(43758.5453));
  const c = fract(sin(n.add(57.0)).mul(43758.5453));
  const d = fract(sin(n.add(58.0)).mul(43758.5453));
  const e = fract(sin(n.add(113.0)).mul(43758.5453));
  const ff = fract(sin(n.add(114.0)).mul(43758.5453));
  const g = fract(sin(n.add(170.0)).mul(43758.5453));
  const h = fract(sin(n.add(171.0)).mul(43758.5453));

  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, ff, u.x), mix(g, h, u.x), u.y),
    u.z
  );
});

// Position node with displacement — modulated by dissolve proximity
const samplePos = positionLocal.mul(uVoronoiScale).add(uTime.mul(0.15));
const vor = voronoi(samplePos, uCellJitter);
const edgeDist = vor.y;

// Dissolve: sweeping band from right to left based on world X position
// Map world X of the sphere (-1.2 to 1.2) to 0..1 range
const _worldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0)).xyz;
const _dissolveX = _worldPos.x.add(1.4).div(2.8); // normalized 0..1 across sphere width

// Noise for organic edge breakup
const _dissolveNoisePos = positionLocal.mul(uDissolveNoiseScale);
const _dissolveNoise = noise3D(_dissolveNoisePos)
  .mul(0.6)
  .add(noise3D(_dissolveNoisePos.mul(2.3).add(vec3(7.8, 3.1, 5.4))).mul(0.3))
  .add(noise3D(_dissolveNoisePos.mul(5.1).add(vec3(13.2, 8.7, 2.9))).mul(0.1));

// Band dissolve: uDissolveProgress sweeps 0..1 (right to left)
// The band center is at uDissolveProgress, width is uDissolveBandWidth
// Inside the band = dissolved (opacity 0), outside = visible (opacity 1)
const halfBand = uDissolveBandWidth.mul(0.5);
const noiseOffset = _dissolveNoise.sub(0.5).mul(0.15); // subtle noise perturbation

// Angled band: mix in world Y so the band isn't a straight vertical slice
const uBandAngle = uniform(0.35); // how much Y influences the band position
const uBandWarp = uniform(0.12);  // large-scale warp deformation strength
// Low-freq warp noise to bend the band organically
const _bandWarpNoise = noise3D(positionLocal.mul(3.2).add(vec3(42.1, 17.3, 8.6)));
const bandWarpOffset = _bandWarpNoise.sub(0.5).mul(uBandWarp);
const bandX = float(1.0).sub(_dissolveX).add(noiseOffset)
  .add(_worldPos.y.mul(uBandAngle).div(2.8)) // angular tilt
  .add(bandWarpOffset); // organic warp

// Distance from the band center
const distFromBand = abs(bandX.sub(uDissolveProgress));
// _dissolveDiff > 0 means visible, < 0 means dissolved
const _dissolveDiff = distFromBand.sub(halfBand);

// Smooth displacement falloff near dissolve edge — inverted: visible inside band
const dissolveDisplaceFactor = smoothstep(float(0.0), float(0.25), _dissolveDiff).oneMinus();

// Compute proximity to nearest dissolve edge (either side of the band)
// Ease-out power curve: rises steeply near edge, flattens toward center
const dissolveProximityLinear = smoothstep(float(0.0), float(0.3), abs(_dissolveDiff));
const dissolveProximity = pow(dissolveProximityLinear, float(0.35));
const displacement = edgeDist.mul(uDisplacementStrength).mul(dissolveProximity);

// Compute displaced normal via finite differences
const eps = float(0.25);
const rawNormal = normalLocal.toVar();
const tangent1Candidate = cross(rawNormal, vec3(0.0, 1.0, 0.0));
const tangent1 = normalize(tangent1Candidate);
const tangent2 = normalize(cross(rawNormal, tangent1));

const posA = positionLocal.add(tangent1.mul(eps));
const spA = posA.mul(uVoronoiScale).add(uTime.mul(0.15));
const vA = voronoi(spA, uCellJitter);
const dA = vA.y.mul(uDisplacementStrength);
const displacedA = posA.add(rawNormal.mul(dA));

const posB = positionLocal.add(tangent2.mul(eps));
const spB = posB.mul(uVoronoiScale).add(uTime.mul(0.15));
const vB = voronoi(spB, uCellJitter);
const dB = vB.y.mul(uDisplacementStrength);
const displacedB = posB.add(rawNormal.mul(dB));

const displacedPos = positionLocal.add(rawNormal.mul(displacement));
const displacedNormal = normalize(cross(displacedA.sub(displacedPos), displacedB.sub(displacedPos)));

// Material
const material = new THREE.MeshStandardNodeMaterial();
material.positionNode = displacedPos;
material.normalNode = displacedNormal;

// Color node
const colorNode = Fn(() => {
  const sp = samplePos.toVar();
  const v = voronoi(sp, uCellJitter);
  const cellDist = v.x;
  const eDist = v.y;

  // Edge
  const edgeWidth = float(0.82).div(uEdgeSharpness);
  const edge = float(1.0).sub(smoothstep(float(0.0), edgeWidth, eDist));

  // Cell color
  const cellColor = mix(uColorDeep, uColorBlue, cellDist.mul(1.5));

  // Combine
  const color = cellColor.toVar();
  const edgeColor = mix(uColorBlue.mul(1.5), uColorWhite, edge.mul(0.7));
  color.assign(mix(color, edgeColor, edge.mul(0.9)));

  // Inner glow
  const glow = smoothstep(float(0.0), float(0.3), displacement).mul(uInnerGlow);
  color.addAssign(uColorBlue.mul(glow.mul(0.6)));

  // AO
  const ao = smoothstep(float(0.0), float(0.5), cellDist);
  color.mulAssign(mix(float(0.6), float(1.0), ao));

  return color;
});

// Reuse the same dissolve noise/diff computed earlier (on local pos for consistency)
const dissolveDiff = _dissolveDiff;

// Edge glow band
const edgeMask = smoothstep(float(0.0), uDissolveEdgeWidth, dissolveDiff.negate())
  .oneMinus()
  .mul(step(float(0.0), dissolveDiff.negate()));

// Darken near dissolve edges — multiplicative shadow zone
const shadowProximity = smoothstep(float(0.0), float(0.35), abs(_dissolveDiff));
const shadowDarken = mix(float(0.0), float(1.0), shadowProximity);

const dissolveColorNode = Fn(() => {
  const baseColor = colorNode().toVar();
  // Darken crystal near dissolve edges (multiply toward black)
  baseColor.mulAssign(shadowDarken);
  // Add subtle colored edge glow on top
  const edgeGlow = uDissolveEdgeColor.mul(uDissolveEdgeIntensity).mul(edgeMask).mul(0.3);
  baseColor.addAssign(edgeGlow);
  return baseColor;
});

material.colorNode = dissolveColorNode();
material.roughnessNode = uRoughness;
material.metalnessNode = float(0.1);

// Emissive — kill emissive near edges for dark shadow look
material.emissiveNode = uDissolveEdgeColor.mul(edgeMask).mul(uDissolveEdgeIntensity).mul(0.15);

// Clip away dissolved fragments — INVERTED: band reveals the mesh, outside is hidden
material.opacityNode = step(float(0.0), dissolveDiff).oneMinus();
material.transparent = true;
material.alphaTest = 0.5;

// Create high-detail sphere
const geometry = new THREE.SphereGeometry(1.2, 256, 256);
const sphere = new THREE.Mesh(geometry, material);
sphere.name = 'crystal_sphere';
scene.add(sphere);

// === StoneOrigin sphere ===
const stoneMaterial = new THREE.MeshStandardNodeMaterial();

// Stone displacement — blend between rocky noise and crystal voronoi near dissolve edge
const stoneNoisePos = positionLocal.mul(uStoneNoiseScale);
const stoneNoise1 = noise3D(stoneNoisePos);
const stoneNoise2 = noise3D(stoneNoisePos.mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5);
const stoneNoise3 = noise3D(stoneNoisePos.mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2);
const stoneDisplaceNoise = stoneNoise1.add(stoneNoise2).add(stoneNoise3);

// Morph offset — stone starts morphing earlier than crystal dissolve
const uMorphOffset = uniform(0.0);
const uMorphWidth = uniform(0.1);

// Recompute dissolve band position for stone (same logic as crystal)
const _stoneWorldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0)).xyz;
const _stoneDissolveX = _stoneWorldPos.x.add(1.4).div(2.8);
const _stoneNoisePos = positionLocal.mul(uDissolveNoiseScale);
const _stoneDissolveNoise = noise3D(_stoneNoisePos)
  .mul(0.6)
  .add(noise3D(_stoneNoisePos.mul(2.3).add(vec3(7.8, 3.1, 5.4))).mul(0.3))
  .add(noise3D(_stoneNoisePos.mul(5.1).add(vec3(13.2, 8.7, 2.9))).mul(0.1));
const stoneNoiseOffset = _stoneDissolveNoise.sub(0.5).mul(0.15);
// Match the same angled + warped band for stone
const _stoneBandWarpNoise = noise3D(positionLocal.mul(3.2).add(vec3(42.1, 17.3, 8.6)));
const stoneBandWarpOffset = _stoneBandWarpNoise.sub(0.5).mul(uBandWarp);
const stoneBandX = float(1.0).sub(_stoneDissolveX).add(stoneNoiseOffset)
  .add(_stoneWorldPos.y.mul(uBandAngle).div(2.8))
  .add(stoneBandWarpOffset);

// Shifted dissolve progress — stone reacts earlier by morphOffset
const shiftedProgress = uDissolveProgress.add(uMorphOffset);
const stoneDistFromBand = abs(stoneBandX.sub(shiftedProgress));
const stoneDissolveDiff = stoneDistFromBand.sub(halfBand);

// Morph factor: 0 = pure stone, 1 = crystal voronoi displacement
// Ramps up as we approach the dissolve edge (within morphWidth)
const morphFactor = smoothstep(uMorphWidth, float(0.0), stoneDissolveDiff).mul(
  smoothstep(float(-0.5), float(0.0), stoneDissolveDiff)
);

// Crystal-style voronoi displacement for stone
const stoneCrystalSamplePos = positionLocal.mul(uVoronoiScale).add(uTime.mul(0.15));
const stoneCrystalVor = voronoi(stoneCrystalSamplePos, uCellJitter);
const stoneCrystalDisp = stoneCrystalVor.y.mul(uDisplacementStrength);

// Separate crystal displacement strength for stone morph zone
const uStoneDispStrength = uniform(0.042);
const uStoneCrystalDispStrength = uniform(0.14);
const stoneBaseDisp = stoneDisplaceNoise.mul(uStoneDispStrength);
const stoneCrystalDispScaled = stoneCrystalVor.y.mul(uStoneCrystalDispStrength);
const stoneBlendedDisp = mix(stoneBaseDisp, stoneCrystalDispScaled, morphFactor);
const stoneDisplacedPos = positionLocal.add(normalLocal.mul(stoneBlendedDisp));

// Finite differences for stone normal (also blended)
const stoneEps = float(0.001);
const stoneTan1 = normalize(cross(normalLocal, vec3(0.0, 1.0, 0.0)));
const stoneTan2 = normalize(cross(normalLocal, stoneTan1));

const stonePosA = positionLocal.add(stoneTan1.mul(stoneEps));
const stoneNA_noise = noise3D(stonePosA.mul(uStoneNoiseScale))
  .add(noise3D(stonePosA.mul(uStoneNoiseScale).mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5))
  .add(noise3D(stonePosA.mul(uStoneNoiseScale).mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2));
const stoneNA_crystal = voronoi(stonePosA.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter).y.mul(uStoneCrystalDispStrength);
const stoneNA = mix(stoneNA_noise.mul(uStoneDispStrength), stoneNA_crystal, morphFactor);
const stoneDisplacedA = stonePosA.add(normalLocal.mul(stoneNA));

const stonePosB = positionLocal.add(stoneTan2.mul(stoneEps));
const stoneNB_noise = noise3D(stonePosB.mul(uStoneNoiseScale))
  .add(noise3D(stonePosB.mul(uStoneNoiseScale).mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5))
  .add(noise3D(stonePosB.mul(uStoneNoiseScale).mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2));
const stoneNB_crystal = voronoi(stonePosB.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter).y.mul(uStoneCrystalDispStrength);
const stoneNB = mix(stoneNB_noise.mul(uStoneDispStrength), stoneNB_crystal, morphFactor);
const stoneDisplacedB = stonePosB.add(normalLocal.mul(stoneNB));

const stoneComputedNormal = normalize(cross(stoneDisplacedA.sub(stoneDisplacedPos), stoneDisplacedB.sub(stoneDisplacedPos)));

stoneMaterial.positionNode = stoneDisplacedPos;
stoneMaterial.normalNode = stoneComputedNormal;

// Stone color — layered noise for natural rock look
const stoneColorNode = Fn(() => {
  const p = positionLocal.mul(uStoneNoiseScale).toVar();
  const n1 = noise3D(p);
  const n2 = noise3D(p.mul(3.2).add(vec3(10.0, 20.0, 30.0)));
  const n3 = noise3D(p.mul(8.5).add(vec3(50.0, 40.0, 60.0)));

  // Base color mix between stone tones
  const base = mix(uStoneColor1, uStoneColor2, n1).toVar();
  base.assign(mix(base, uStoneColor3, n2.mul(0.5)));

  // Fine grain detail
  const grain = n3.mul(0.08).sub(0.04);
  base.addAssign(vec3(grain, grain, grain));

  // Subtle AO in crevices
  const ao = smoothstep(float(0.2), float(0.7), stoneDisplaceNoise);
  base.mulAssign(mix(float(0.65), float(1.0), ao));

  return base;
});

stoneMaterial.colorNode = stoneColorNode();
stoneMaterial.roughnessNode = uStoneRoughness;
stoneMaterial.metalnessNode = float(0.05);



const uStoneSize = uniform(0.96);

// Shared geometry factory — both crystal and stone use the same base shape
const geometryTypes = {
  Sphere: () => new THREE.SphereGeometry(1.2, 256, 256),
  Torus: () => new THREE.TorusGeometry(0.9, 0.4, 128, 256),
  Knot: () => new THREE.TorusKnotGeometry(0.7, 0.25, 256, 64),
};

let currentShape = 'Torus';
let currentLOD = 'high'; // track current LOD level

// LOD thresholds
const LOD_HIGH_DIST = 5.0;   // switch to high when closer than this
const LOD_LOW_DIST = 6.0;    // switch to low when farther than this (hysteresis)

const geometryTypesLOD = {
  high: {
    Sphere: () => new THREE.SphereGeometry(1.2, 256, 256),
    Torus: () => new THREE.TorusGeometry(0.9, 0.4, 128, 256),
    Knot: () => new THREE.TorusKnotGeometry(0.7, 0.25, 256, 64),
  },
  low: {
    Sphere: () => new THREE.SphereGeometry(1.2, 64, 64),
    Torus: () => new THREE.TorusGeometry(0.9, 0.4, 48, 64),
    Knot: () => new THREE.TorusKnotGeometry(0.7, 0.25, 64, 24),
  },
};

function setGeometry(shapeName, lod) {
  lod = lod || currentLOD;
  const factory = (geometryTypesLOD[lod] || geometryTypesLOD.high)[shapeName];
  if (!factory) return;
  currentShape = shapeName;
  currentLOD = lod;

  const newGeo = factory();

  // Dispose old geometry
  sphere.geometry.dispose();
  stoneSphere.geometry.dispose();

  // Both meshes share the exact same base geometry
  sphere.geometry = newGeo;
  stoneSphere.geometry = newGeo;
}

const stoneSphere = new THREE.Mesh(geometry, stoneMaterial);
stoneSphere.name = 'stone_origin';
stoneSphere.scale.setScalar(0.96);
scene.add(stoneSphere);

// Lights
const ambientLight = new THREE.AmbientLight(0x334466, 0.5);
ambientLight.name = 'ambient_light';
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(1, 1, 1);
dirLight1.name = 'dir_light_1';
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0x4466ff, 0.8);
dirLight2.position.set(-1, 0.5, -0.5);
dirLight2.name = 'dir_light_2';
scene.add(dirLight2);

// Beautiful top-left spotlight casting toward center
const spotLight = new THREE.SpotLight(0xddeeff, 4.0, 20, Math.PI * 0.25, 0.6, 1.2);
spotLight.position.set(-4, 5, 3);
spotLight.target.position.set(0, 0, 0);
spotLight.name = 'top_left_spot';
scene.add(spotLight);
scene.add(spotLight.target);

// Soft volumetric accent — warm point light near the top-left
const accentLight = new THREE.PointLight(0x8eaaff, 1.5, 10, 1.8);
accentLight.position.set(-2.5, 3, 2);
accentLight.name = 'top_left_accent';
scene.add(accentLight);

// GUI
const { default: GUI } = await import('https://cdn.jsdelivr.net/npm/lil-gui@0.20.0/dist/lil-gui.esm.min.js');
const gui = new GUI({ width: 300 });

const params = {
  voronoiScale: 7.3,
  displacementStrength: 0.35,
  edgeSharpness: 8.0,
  cellJitter: 0.69,
  roughness: 0.3,
  innerGlow: 0.4,
  colorWhite: '#000000',
  colorBlue: '#1c52f2',
  colorDeep: '#010d0e',
  timeSpeed: 0.85,
  wireframe: false,
};

const fVoronoi = gui.addFolder('Voronoi');
fVoronoi.add(params, 'voronoiScale', 1.0, 10.0, 0.1).name('Scale').onChange(v => uVoronoiScale.value = v);
fVoronoi.add(params, 'edgeSharpness', 0.5, 8.0, 0.1).name('Edge Sharpness').onChange(v => uEdgeSharpness.value = v);
fVoronoi.add(params, 'cellJitter', 0.0, 1.0, 0.01).name('Cell Jitter').onChange(v => uCellJitter.value = v);

const fDisp = gui.addFolder('Displacement');
fDisp.add(params, 'displacementStrength', 0.0, 1.0, 0.01).name('Strength').onChange(v => uDisplacementStrength.value = v);

const fMaterial = gui.addFolder('Material');
fMaterial.add(params, 'roughness', 0.0, 1.0, 0.01).name('Roughness').onChange(v => uRoughness.value = v);
fMaterial.add(params, 'innerGlow', 0.0, 1.0, 0.01).name('Inner Glow').onChange(v => uInnerGlow.value = v);

const fColors = gui.addFolder('Colors');
fColors.addColor(params, 'colorWhite').name('Highlight').onChange(v => uColorWhite.value.set(v));
fColors.addColor(params, 'colorBlue').name('Crystal Blue').onChange(v => uColorBlue.value.set(v));
fColors.addColor(params, 'colorDeep').name('Deep Color').onChange(v => uColorDeep.value.set(v));

const fDissolve = gui.addFolder('Dissolve');

const dissolveParams = {
  running: true,
  speed: 0.18,
  bandWidth: 0.5,
  noiseScale: 6.3,
  edgeWidth: 0.35,
  edgeIntensity: 4.5,
  edgeColor: '#000000',
};

fDissolve.add(dissolveParams, 'running').name('▶ Play / Pause');
fDissolve.add(dissolveParams, 'speed', 0.05, 2.0, 0.01).name('Speed').onChange(v => dissolveParams.speed = v);
fDissolve.add(dissolveParams, 'bandWidth', 0.05, 1.0, 0.01).name('Band Width').onChange(v => uDissolveBandWidth.value = v);
fDissolve.add(dissolveParams, 'noiseScale', 0.5, 8.0, 0.1).name('Noise Scale').onChange(v => uDissolveNoiseScale.value = v);
fDissolve.add(dissolveParams, 'edgeWidth', 0.01, 0.3, 0.005).name('Edge Width').onChange(v => uDissolveEdgeWidth.value = v);
fDissolve.add(dissolveParams, 'edgeIntensity', 0.5, 8.0, 0.1).name('Edge Intensity').onChange(v => uDissolveEdgeIntensity.value = v);
fDissolve.addColor(dissolveParams, 'edgeColor').name('Edge Color').onChange(v => uDissolveEdgeColor.value.set(v));
dissolveParams.bandAngle = 0.35;
fDissolve.add(dissolveParams, 'bandAngle', -1.0, 1.0, 0.01).name('Band Angle').onChange(v => uBandAngle.value = v);
dissolveParams.bandWarp = 0.12;
fDissolve.add(dissolveParams, 'bandWarp', 0.0, 0.4, 0.005).name('Band Warp').onChange(v => uBandWarp.value = v);

const fStone = gui.addFolder('Stone Origin');
const stoneParams = {
  noiseScale: 11.4,
  roughness: 0.9,
  color1: '#b5b5b5',
  color2: '#6b6b6b',
  color3: '#000000',
};
fStone.add(stoneParams, 'noiseScale', 1.0, 12.0, 0.1).name('Noise Scale').onChange(v => uStoneNoiseScale.value = v);
fStone.add(stoneParams, 'roughness', 0.0, 1.0, 0.01).name('Roughness').onChange(v => uStoneRoughness.value = v);
fStone.addColor(stoneParams, 'color1').name('Light Tone').onChange(v => uStoneColor1.value.set(v));
fStone.addColor(stoneParams, 'color2').name('Mid Tone').onChange(v => uStoneColor2.value.set(v));
fStone.addColor(stoneParams, 'color3').name('Dark Tone').onChange(v => uStoneColor3.value.set(v));
stoneParams.size = 0.96;
fStone.add(stoneParams, 'size', 0.5, 1.5, 0.01).name('Size').onChange(v => {
  stoneSphere.scale.setScalar(v);
});
stoneParams.dispStrength = 0.042;
fStone.add(stoneParams, 'dispStrength', 0.0, 0.15, 0.001).name('Stone Disp').onChange(v => uStoneDispStrength.value = v);
stoneParams.crystalDispStrength = 0.14;
fStone.add(stoneParams, 'crystalDispStrength', 0.0, 0.5, 0.005).name('Crystal Disp').onChange(v => uStoneCrystalDispStrength.value = v);
stoneParams.morphOffset = 0.0;
stoneParams.morphWidth = 0.1;
fStone.add(stoneParams, 'morphOffset', 0.0, 1.0, 0.01).name('Morph Offset').onChange(v => uMorphOffset.value = v);
fStone.add(stoneParams, 'morphWidth', 0.05, 1.0, 0.01).name('Morph Width').onChange(v => uMorphWidth.value = v);

const fShape = gui.addFolder('Base Shape');
const shapeParams = { shape: 'Torus' };
fShape.add(shapeParams, 'shape', Object.keys(geometryTypes)).name('Geometry').onChange(v => {
  setGeometry(v);
  updateShapeLabel();
});

// Bottom navigation buttons
const shapeNames = Object.keys(geometryTypes);
let shapeIndex = shapeNames.indexOf(currentShape);

const navContainer = document.createElement('div');
navContainer.style.cssText = `
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px; z-index: 1000;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
`;

const btnStyle = `
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: #ccc; padding: 8px 18px; border-radius: 6px; cursor: pointer;
  font-size: 13px; font-family: inherit; transition: background 0.2s, border-color 0.2s;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
`;

const prevBtn = document.createElement('button');
prevBtn.textContent = '← Prev';
prevBtn.style.cssText = btnStyle;

const shapeLabel = document.createElement('span');
shapeLabel.style.cssText = `
  color: rgba(255,255,255,0.5); font-size: 13px; min-width: 60px;
  text-align: center; font-family: inherit; letter-spacing: 0.03em;
`;

const nextBtn = document.createElement('button');
nextBtn.textContent = 'Next →';
nextBtn.style.cssText = btnStyle;

function updateShapeLabel() {
  shapeIndex = shapeNames.indexOf(currentShape);
  shapeLabel.textContent = currentShape;
}

function hoverIn(btn) {
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(255,255,255,0.12)';
    btn.style.borderColor = 'rgba(255,255,255,0.25)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'rgba(255,255,255,0.06)';
    btn.style.borderColor = 'rgba(255,255,255,0.12)';
  });
}
hoverIn(prevBtn);
hoverIn(nextBtn);

prevBtn.addEventListener('click', () => {
  shapeIndex = (shapeIndex - 1 + shapeNames.length) % shapeNames.length;
  setGeometry(shapeNames[shapeIndex]);
  updateShapeLabel();
  shapeParams.shape = shapeNames[shapeIndex];
  fShape.controllers[0].updateDisplay();
});

nextBtn.addEventListener('click', () => {
  shapeIndex = (shapeIndex + 1) % shapeNames.length;
  setGeometry(shapeNames[shapeIndex]);
  updateShapeLabel();
  shapeParams.shape = shapeNames[shapeIndex];
  fShape.controllers[0].updateDisplay();
});

navContainer.appendChild(prevBtn);
navContainer.appendChild(shapeLabel);
navContainer.appendChild(nextBtn);
document.body.appendChild(navContainer);
updateShapeLabel();
setGeometry('Torus');

const fAnim = gui.addFolder('Animation');
params.timeSpeed = 0.85;
fAnim.add(params, 'timeSpeed', 0.0, 2.0, 0.01).name('Speed');
fAnim.add(params, 'wireframe').name('Wireframe').onChange(v => { material.wireframe = v; });

// Animation
const clock = new THREE.Clock();

let dissolveTime = 0;

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  uTime.value = elapsed * params.timeSpeed;


  // Ping-pong dissolve animation
  if (dissolveParams.running) {
    dissolveTime += delta * dissolveParams.speed;
  }
  // Ping-pong: triangle wave between -0.2 and 1.2 for clean full sweep
  const pingPong = Math.abs(((dissolveTime % 2.0) + 2.0) % 2.0 - 1.0);
  uDissolveProgress.value = -0.2 + pingPong * 1.4;

  // Slow Y-axis rotation for both meshes
  const rotSpeed = 0.08;
  sphere.rotation.y = elapsed * rotSpeed;
  stoneSphere.rotation.y = elapsed * rotSpeed;

  // LOD switching based on camera distance (with hysteresis to avoid flicker)
  const camDist = camera.position.length();
  const needLOD = camDist > LOD_LOW_DIST ? 'low' : camDist < LOD_HIGH_DIST ? 'high' : currentLOD;
  if (needLOD !== currentLOD) {
    setGeometry(currentShape, needLOD);
  }

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});