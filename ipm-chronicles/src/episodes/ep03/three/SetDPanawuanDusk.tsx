import React, { useMemo } from "react";
import * as THREE from "three";
import { santriPutra, santriPutri } from "../../../shared/HeritageKid";
import { HeritageActor3D } from "../../../shared/three3d/HeritageBillboard";
import { NOINK, twoTone } from "../../../shared/three3d/ep03Shaders";
import {
  dustMoteTex,
  plasterWallTex,
  tiledFloorTex,
  woodGrainTex,
} from "../../../shared/three3d/worldTextures";
import {
  clamp01,
  criticallyDampedSpring,
  poseSpring,
  poseTween,
} from "./ep03Camera";
import { BranchNetworkCanvas, PanawuanPlaqueCanvas } from "./ep03PropTextures";

export const SetDPanawuanDusk: React.FC<{ f: number }> = ({ f }) => {
  const networkCanvas = useMemo(() => new BranchNetworkCanvas(), []);
  const plaqueCanvas = useMemo(() => new PanawuanPlaqueCanvas(), []);

  const mats = useMemo(() => {
    const floor = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = tiledFloorTex("#b39872", "#9e825c", "#47331f").clone();
          t.repeat.set(3, 3.5);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const plaster = twoTone(new THREE.MeshLambertMaterial({ map: plasterWallTex("#cdb58c", "#9e835a") }));
    const wood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#5c381e", "#331c0c", 5) }));
    const darkWood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#3b2210", "#1c0e06", 4) }));
    const archiveRed = twoTone(new THREE.MeshLambertMaterial({ color: "#782016" }));
    const paper = twoTone(new THREE.MeshLambertMaterial({ color: "#ede0c2" }));
    const networkMat = twoTone(new THREE.MeshLambertMaterial({ map: networkCanvas.tex }));
    const plaque = twoTone(new THREE.MeshLambertMaterial({ map: plaqueCanvas.tex }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#c99b42", specular: "#ffefb8", shininess: 46 }));
    const lampShade = twoTone(new THREE.MeshLambertMaterial({ color: "#263d2c" }));
    const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.12, 0.65), toneMapped: false });
    const lanternFlame = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.25, 0.45), toneMapped: false });
    const lanternHalo = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.55, 1.08, 0.36),
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const skyDusk = new THREE.MeshBasicMaterial({ color: "#43284f", fog: false });
    const horizonGlow = new THREE.MeshBasicMaterial({ color: "#d6823a", fog: false });
    const ridgeFar = new THREE.MeshBasicMaterial({ color: "#321d3b", fog: false });
    const ridgeNear = new THREE.MeshBasicMaterial({ color: "#1f1226", fog: false });
    const dust = new THREE.MeshBasicMaterial({
      map: dustMoteTex(),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return {
      floor,
      plaster,
      wood,
      darkWood,
      archiveRed,
      paper,
      networkMat,
      plaque,
      brass,
      lampShade,
      bulb,
      lanternFlame,
      lanternHalo,
      skyDusk,
      horizonGlow,
      ridgeFar,
      ridgeNear,
      dust,
    };
  }, [networkCanvas, plaqueCanvas]);

  // Beats #27-#28: Pulsing Ranting Network Pinboard finishes drawing all 4 links cleanly by f=2215
  const netP = f < 2095 ? 0 : clamp01((f - 2095) / 120);
  networkCanvas.update(netP);

  // Beats #29-#30: Shot 19 draws the programme rail on "menjaga pengkaderan ranting" (f=2380..2450); TM lights on "Taruna" (2452), PDPM on "da'i" (2512)
  const tmLit = f < 2452 ? 0.15 : clamp01((f - 2452) / 30);
  const pdpmLit = f < 2512 ? 0.15 : clamp01((f - 2512) / 30);
  const railFlow = f < 2370 ? 0 : clamp01((f - 2370) / 80);
  plaqueCanvas.update(tmLit, pdpmLit, railFlow);

  const ridgeGeos = useMemo(() => {
    const buildRidge = (pts: [number, number][], depth = 0.6) => {
      const sh = new THREE.Shape();
      sh.moveTo(pts[0][0], -6);
      pts.forEach(([x, y]) => sh.lineTo(x, y));
      sh.lineTo(pts[pts.length - 1][0], -6);
      sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
    };
    const farGeo = buildRidge([
      [-18, 0.4],
      [-12, 1.9],
      [-6.5, 1.1],
      [-2.0, 2.3],
      [2.5, 1.4],
      [7.2, 2.5],
      [13.0, 1.2],
      [18, 0.6],
    ]);
    const nearGeo = buildRidge([
      [-18, -0.4],
      [-10, 1.1],
      [-4.2, 0.4],
      [0.5, 1.55],
      [5.0, 0.65],
      [10.5, 1.45],
      [18, -0.2],
    ]);
    return { farGeo, nearGeo };
  }, []);

  // ================= POSE-TO-POSE CHARACTER BLOCKING (ZERO Math.sin LOOPING) =================
  // Beat #28: Kader points quill ONCE smoothly toward active Ranting Hub at "Denyut sejarah" (f=2175)
  const s18Arm = poseSpring(f, 2175, 14, -36, 8.5);
  const s18Elbow = poseSpring(f, 2175, -42, -26, 8.5);

  // Beat #30: PDPM Training Stage — Speaker raises arm ONCE at f=2465, listener gives 1 attentive nod at f=2515
  const pdpmSpeakerArm = poseSpring(f, 2465, 10, -34, 8.0);
  const pdpmListenerHead = poseTween(f, 2515, 2545, -2, 6);

  // Beats #31-#32: Galang turns gracefully ONCE from twilight window to viewer + Sill Lantern ignites on "merawat api" (f=2728)
  const galangHeadTurn = poseTween(f, 2675, 2732, -0.26, 0.22);
  const galangSmile = poseTween(f, 2710, 2765, 0.12, 0.35);
  const lanternGlow = f < 2728 ? 0.18 : criticallyDampedSpring(f, 2728, 30, 7.5, 0) * 0.82 + 0.18;

  const ridgeBlend = f >= 2612;

  return (
    <group>
      {/* Interior floor */}
      <mesh position={[0, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor} receiveShadow>
        <planeGeometry args={[7.0, 6.6]} />
      </mesh>

      {/* Left & Right walls */}
      <mesh position={[-2.9, 1.7, -0.3]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.16, 3.4, 6.6]} />
      </mesh>
      <mesh position={[2.9, 1.7, -0.3]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.16, 3.4, 6.6]} />
      </mesh>

      {/* Back Wall with wide Open Teak Window */}
      <mesh position={[-1.45, 1.7, -2.95]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[2.9, 3.4, 0.16]} />
      </mesh>
      <mesh position={[2.35, 1.7, -2.95]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[1.2, 3.4, 0.16]} />
      </mesh>
      <mesh position={[0.85, 0.46, -2.95]} material={mats.darkWood} receiveShadow castShadow>
        <boxGeometry args={[1.72, 0.92, 0.18]} />
      </mesh>
      <mesh position={[0.85, 2.94, -2.95]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[1.72, 0.92, 0.16]} />
      </mesh>

      {/* Open Window Casement Frame + Mullion + Swung-Open Wooden Shutters */}
      <group position={[0.85, 1.70, -2.95]}>
        <mesh position={[0, -0.78, 0.05]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[1.80, 0.08, 0.28]} />
        </mesh>
        <mesh position={[-0.86, 0, 0]} material={mats.darkWood} castShadow>
          <boxGeometry args={[0.08, 1.56, 0.22]} />
        </mesh>
        <mesh position={[0.86, 0, 0]} material={mats.darkWood} castShadow>
          <boxGeometry args={[0.08, 1.56, 0.22]} />
        </mesh>
        <mesh position={[0, 0, 0]} material={mats.darkWood} castShadow>
          <boxGeometry args={[0.06, 1.54, 0.12]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} material={mats.darkWood} castShadow>
          <boxGeometry args={[1.72, 0.05, 0.12]} />
        </mesh>
        <mesh position={[0, 0.78, 0]} material={mats.darkWood} castShadow>
          <boxGeometry args={[1.80, 0.08, 0.22]} />
        </mesh>
        <mesh position={[-0.82, 0, 0.18]} rotation={[0, -0.55, 0]} material={mats.wood} castShadow>
          <boxGeometry args={[0.42, 1.48, 0.05]} />
        </mesh>
        <mesh position={[0.82, 0, 0.18]} rotation={[0, 0.55, 0]} material={mats.wood} castShadow>
          <boxGeometry args={[0.42, 1.48, 0.05]} />
        </mesh>
      </group>

      {/* Beat #32: Classical Brass & Glass Sill Lantern beside Galang igniting on "merawat api ini tetap menyala" */}
      {ridgeBlend && (
        <group position={[0.92, 1.00, -2.76]}>
          <mesh position={[0, 0.02, 0]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.075, 0.085, 0.04, 12]} />
          </mesh>
          <mesh position={[0, 0.20, 0]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
          </mesh>
          {[-0.048, 0.048].map((lx) => (
            <mesh key={`lp_${lx}`} position={[lx, 0.11, 0]} material={mats.darkWood}>
              <boxGeometry args={[0.012, 0.16, 0.012]} />
            </mesh>
          ))}
          <mesh
            position={[0, 0.11, 0]}
            scale={[0.45 + lanternGlow * 0.65, 0.45 + lanternGlow * 0.65, 0.45 + lanternGlow * 0.65]}
            material={mats.lanternFlame}
          >
            <sphereGeometry args={[0.042, 12, 12]} />
          </mesh>
          <mesh
            position={[0, 0.11, -0.02]}
            scale={[0.3 + lanternGlow * 1.3, 0.3 + lanternGlow * 1.3, 1]}
            material={mats.lanternHalo}
            layers={1 << NOINK}
          >
            <ringGeometry args={[0.08, 0.15, 24]} />
          </mesh>
        </group>
      )}

      {/* Exterior Twilight Priangan Sky + Sculpted Layered Ridges */}
      <group>
        <mesh position={[0.5, 4.2, -26]} material={mats.skyDusk}>
          <planeGeometry args={[48, 22]} />
        </mesh>
        <mesh position={[0.5, -0.8, -25.5]} material={mats.horizonGlow}>
          <planeGeometry args={[48, 10]} />
        </mesh>
        <mesh position={[0, 0.1, -18]} geometry={ridgeGeos.farGeo} material={mats.ridgeFar} />
        <mesh position={[0, -0.1, -12.5]} geometry={ridgeGeos.nearGeo} material={mats.ridgeNear} />
      </group>

      {/* Wall Plaque "PC IPM PANAWUAN · TAROGONG KIDUL" (shown f >= 2294, cleanly illuminating TM & PDPM) */}
      {f >= 2294 && (
        <group position={[-1.35, 1.54, -2.84]}>
          <mesh material={mats.darkWood} castShadow>
            <boxGeometry args={[1.38, 0.76, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.035]} material={mats.plaque}>
            <planeGeometry args={[1.30, 0.68]} />
          </mesh>
        </group>
      )}

      {/* Beats #27-#28: Branch Working Table + Archival Folders + Upright Tilted Branch Ranting Network Board */}
      <group position={[0, 0, -0.45]}>
        <mesh position={[0, 0.725, 0]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.05, 0.95]} />
        </mesh>
        {[-0.92, 0.92].map((lx) =>
          [-0.36, 0.36].map((lz) => (
            <mesh key={`bt_${lx}_${lz}`} position={[lx, 0.35, lz]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.07, 0.70, 0.07]} />
            </mesh>
          ))
        )}
        {/* Left archival stacks */}
        <mesh position={[-0.36, 0.78, 0.04]} rotation={[0, 0.14, 0]} material={mats.archiveRed} castShadow>
          <boxGeometry args={[0.24, 0.055, 0.32]} />
        </mesh>
        <mesh position={[-0.32, 0.82, -0.02]} rotation={[0, -0.08, 0]} material={mats.paper} castShadow>
          <boxGeometry args={[0.22, 0.024, 0.28]} />
        </mesh>

        {/* Upright 24-deg Tilted Ranting Network Pinboard facing S18 camera clearly */}
        {f >= 2088 && f < 2294 && (
          <group position={[0.25, 0.96, -0.02]} rotation={[-0.36, -0.32, 0]}>
            <mesh position={[0, 0, -0.02]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.58, 0.44, 0.03]} />
            </mesh>
            <mesh position={[0, 0, 0.002]} material={mats.networkMat}>
              <planeGeometry args={[0.52, 0.39]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Steady Hanging Lamp over Branch Table */}
      <group position={[0.05, 3.1, -0.45]}>
        <mesh position={[0, -0.62, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.013, 0.013, 1.24, 8]} />
        </mesh>
        <mesh position={[0, -1.25, 0]} material={mats.lampShade} castShadow>
          <coneGeometry args={[0.22, 0.14, 16, 1, true]} />
        </mesh>
        <mesh position={[0, -1.30, 0]} material={mats.bulb}>
          <sphereGeometry args={[0.048, 12, 12]} />
        </mesh>
      </group>

      {/* Dust motes */}
      {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
        <mesh
          key={`s4d_${idx}`}
          position={[-0.8 + ((idx * 0.41) % 2.1), 0.95 + ((idx * 0.29) % 1.0), -1.8 + ((idx * 0.43) % 1.8)]}
          material={mats.dust}
          renderOrder={2}
        >
          <planeGeometry args={[0.05, 0.05]} />
        </mesh>
      ))}

      {/* ======================== CAST: 2D PANAWUAN KADER & GALANG CLOSING (ZERO LOOPING) ======================== */}
      {/* Beats #27-#28: Kader examining & pointing quill ONCE cleanly inside left frame beside Network Board */}
      {f >= 2088 && f < 2294 && (
        <HeritageActor3D
          look={santriPutra(1, "olive")}
          f={f}
          position={[-0.12, 0.14, -0.86]}
          worldScale={0.86}
          view="threeQuarter"
          pose="sit_desk"
          billboard={false}
          yaw={0.22}
          held="quill"
          heldHand="R"
          armL={[12, 22]}
          armR={[s18Arm, s18Elbow]}
          head={-4}
          headTurn={0.18}
          smile={0.25}
          useV2Blink
          seed={73}
          showBlob={false}
          rimColor="#ffdca8"
          rimSide="R"
          rimStrength={0.34}
        />
      )}

      {/* Beat #30: PDPM Training Podium + Two Engaged Cadres (f=2452..2611, ZERO looping) */}
      {f >= 2452 && f < 2612 && (
        <group>
          {/* Illuminated Backdrop PDPM Banner Board elevated above actors so heading stays completely legible */}
          <group position={[0.60, 1.98, -2.28]}>
            <mesh material={mats.darkWood} castShadow>
              <boxGeometry args={[1.18, 0.62, 0.05]} />
            </mesh>
            <mesh position={[0, 0, 0.03]} material={mats.plaque}>
              <planeGeometry args={[1.10, 0.54]} />
            </mesh>
          </group>

          {/* Low-profile Wooden Mimbar Dakwah Podium keeping chest & arm gestures cleanly visible */}
          <mesh position={[0.28, 0.31, -1.04]} material={mats.darkWood} castShadow receiveShadow>
            <boxGeometry args={[0.36, 0.62, 0.24]} />
          </mesh>
          <mesh position={[0.28, 0.64, -1.04]} rotation={[0.16, 0, 0]} material={mats.brass} castShadow>
            <boxGeometry args={[0.42, 0.04, 0.30]} />
          </mesh>

          <HeritageActor3D
            look={santriPutra(1, "olive")}
            f={f}
            position={[0.28, 0, -1.34]}
            view="threeQuarter"
            pose="stand"
            held="book"
            heldHand="R"
            armL={[pdpmSpeakerArm, 22]}
            armR={[14, -46]}
            head={0}
            headTurn={0.24}
            open={0}
            smile={0.3}
            useV2Blink
            seed={81}
            rimColor="#ffdca8"
            rimSide="L"
            rimStrength={0.32}
            cast3DShadow
          />
          <HeritageActor3D
            look={santriPutri(2)}
            f={f}
            position={[0.94, 0, -1.52]}
            view="threeQuarter"
            flip
            pose="stand"
            held="letter"
            heldHand="L"
            armL={[-16, -34]}
            armR={[10, 14]}
            head={pdpmListenerHead}
            headTurn={-0.30}
            open={0}
            smile={0.38}
            useV2Blink
            seed={89}
            rimColor="#ffdca8"
            rimSide="R"
            rimStrength={0.32}
            cast3DShadow
          />
        </group>
      )}

      {/* Beats #31-#32: Galang framed gracefully beside twilight window & glowing lantern */}
      {ridgeBlend && (
        <HeritageActor3D
          look={santriPutra(0, "brown")}
          f={f}
          position={[0.34, 0, -1.96]}
          view="threeQuarter"
          pose="stand"
          billboard={false}
          yaw={0.28}
          headTurn={galangHeadTurn}
          held="book"
          heldHand="R"
          armL={[8, 12]}
          armR={[14, -46]}
          smile={galangSmile}
          open={0}
          useV2Blink
          seed={97}
          rimColor="#ffbe73"
          rimSide="R"
          rimStrength={0.42}
        />
      )}
    </group>
  );
};
