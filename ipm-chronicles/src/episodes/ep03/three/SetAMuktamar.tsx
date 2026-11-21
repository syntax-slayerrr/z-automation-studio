import React, { useMemo } from "react";
import * as THREE from "three";
import { santriPutri } from "../../../shared/HeritageKid";
import { HeritageActor3D } from "../../../shared/three3d/HeritageBillboard";
import { twoTone } from "../../../shared/three3d/ep03Shaders";
import { dustMoteTex, plasterWallTex, tiledFloorTex, woodGrainTex } from "../../../shared/three3d/worldTextures";
import { clamp01, poseTween, smoother } from "./ep03Camera";
import { TanfidzPageCanvas, tanfidzCoverTex } from "./ep03PropTextures";

export const SetAMuktamar: React.FC<{ f: number }> = ({ f }) => {
  const tanfidzPage = useMemo(() => new TanfidzPageCanvas(), []);

  const mats = useMemo(() => {
    const teak = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#4e2f19", "#281509", 5) }));
    const walnut = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#351e0f", "#180c05", 4) }));
    const plaster = twoTone(new THREE.MeshLambertMaterial({ map: plasterWallTex("#d8c298", "#aa8e62") }));
    const hallFloor = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = tiledFloorTex("#bfa67d", "#ab9067", "#4f3a25").clone();
          t.repeat.set(3, 5);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const pages = twoTone(new THREE.MeshLambertMaterial({ color: "#eee1be" }));
    const decreePage = twoTone(new THREE.MeshLambertMaterial({ map: tanfidzPage.tex }));
    const cover = twoTone(new THREE.MeshLambertMaterial({ map: tanfidzCoverTex() }));
    const coverInner = twoTone(new THREE.MeshLambertMaterial({ color: "#5e1812" }));
    const coverEdge = twoTone(new THREE.MeshLambertMaterial({ color: "#45110d" }));
    const redWax = twoTone(new THREE.MeshLambertMaterial({ color: "#8d2416" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#c2923d", specular: "#ffefc0", shininess: 48 }));
    const lampShade = twoTone(new THREE.MeshLambertMaterial({ color: "#27402e" }));
    const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.15, 0.65), toneMapped: false });
    const hallGlow = twoTone(new THREE.MeshLambertMaterial({ color: "#edd7b4" }));
    const sunPane = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.93, 0.66), toneMapped: false });
    const dust = new THREE.MeshBasicMaterial({
      map: dustMoteTex(),
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { teak, walnut, plaster, hallFloor, pages, decreePage, cover, coverInner, coverEdge, redWax, brass, lampShade, bulb, hallGlow, sunPane, dust };
  }, [tanfidzPage]);

  // Beat #01-#02: Progressive decree & crimson stamp appear by f=58, cover opens wider then closes at f=76..95
  tanfidzPage.update(clamp01(f / 58));
  const closeU = f < 76 ? 0 : smoother((f - 76) / 19);
  const coverAngle = 1.80 * (1 - closeU);

  // Beat #02-#03: Teak door swings open into sunlit corridor (f=95..144)
  const doorU = f < 95 ? 0 : smoother((f - 95) / 48);
  const doorAngle = -1.38 * doorU;

  // Beat #03: Santriwati walks steadily down sunlit hallway at real perspective depth
  const walkU = f < 146 ? 0 : clamp01((f - 146) / 96);
  const leadZ = -2.65 - walkU * 3.55;
  const kadArmPose = poseTween(f, 146, 175, 12, -38);

  return (
    <group>
      {/* Conference floor + corridor floor beyond doorway */}
      <mesh position={[0, 0, -2.5]} rotation={[-Math.PI / 2, 0, 0]} material={mats.hallFloor} receiveShadow>
        <planeGeometry args={[8.5, 12]} />
      </mesh>

      {/* Conference room side walls */}
      <mesh position={[-3.2, 1.7, -0.2]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.18, 3.4, 5.4]} />
      </mesh>
      <mesh position={[3.2, 1.7, -0.2]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.18, 3.4, 5.4]} />
      </mesh>

      {/* Back divider wall at z=-2.45 with 1.16m x 2.10m central doorway cutout */}
      <mesh position={[-1.88, 1.7, -2.45]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[2.64, 3.4, 0.16]} />
      </mesh>
      <mesh position={[1.88, 1.7, -2.45]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[2.64, 3.4, 0.16]} />
      </mesh>
      <mesh position={[0, 2.75, -2.45]} material={mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[1.18, 1.30, 0.16]} />
      </mesh>
      <mesh position={[-0.60, 1.05, -2.44]} material={mats.walnut} castShadow>
        <boxGeometry args={[0.08, 2.12, 0.22]} />
      </mesh>
      <mesh position={[0.60, 1.05, -2.44]} material={mats.walnut} castShadow>
        <boxGeometry args={[0.08, 2.12, 0.22]} />
      </mesh>
      <mesh position={[0, 2.12, -2.44]} material={mats.walnut} castShadow>
        <boxGeometry args={[1.28, 0.08, 0.22]} />
      </mesh>

      {/* Hinged Oak Door Leaf pivoting inward */}
      <group position={[-0.56, 0, -2.44]} rotation={[0, doorAngle, 0]}>
        <mesh position={[0.56, 1.04, 0]} material={mats.teak} castShadow receiveShadow>
          <boxGeometry args={[1.10, 2.06, 0.06]} />
        </mesh>
        <mesh position={[0.96, 0.98, 0.05]} material={mats.brass} castShadow>
          <sphereGeometry args={[0.036, 12, 12]} />
        </mesh>
      </group>

      {/* Sunlit corridor beyond doorway */}
      <mesh position={[-1.35, 1.7, -5.2]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.16, 3.4, 5.6]} />
      </mesh>
      <mesh position={[1.35, 1.7, -5.2]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.16, 3.4, 5.6]} />
      </mesh>
      <mesh position={[0, 1.65, -7.6]} material={mats.hallGlow} receiveShadow>
        <planeGeometry args={[3.2, 3.4]} />
      </mesh>
      <mesh position={[0, 2.7, -4.6]} material={mats.walnut} castShadow>
        <boxGeometry args={[2.7, 0.22, 0.22]} />
      </mesh>

      {/* Real school hallway depth cues: teak pillars, tall sun windows on the left, notice board on the right, classroom door at the far end */}
      {[-3.3, -4.5, -5.7, -6.9].map((pz) => (
        <React.Fragment key={`hall_${pz}`}>
          <mesh position={[-1.19, 1.7, pz]} material={mats.walnut} castShadow receiveShadow>
            <boxGeometry args={[0.16, 3.4, 0.16]} />
          </mesh>
          <mesh position={[1.19, 1.7, pz]} material={mats.walnut} castShadow receiveShadow>
            <boxGeometry args={[0.16, 3.4, 0.16]} />
          </mesh>
          <mesh position={[-1.255, 1.55, pz - 0.6]} rotation={[0, Math.PI / 2, 0]} material={mats.sunPane}>
            <planeGeometry args={[0.72, 1.7]} />
          </mesh>
        </React.Fragment>
      ))}
      <mesh position={[1.255, 1.5, -4.1]} rotation={[0, -Math.PI / 2, 0]} material={mats.teak} castShadow>
        <boxGeometry args={[1.0, 0.7, 0.04]} />
      </mesh>
      <mesh position={[0, 1.05, -7.5]} material={mats.walnut} castShadow>
        <boxGeometry args={[1.5, 2.12, 0.1]} />
      </mesh>

      {/* Heavy Muktamar Teak Conference Table (top y=0.75m) */}
      <group position={[0, 0, 0.12]}>
        <mesh position={[0, 0.725, 0]} material={mats.teak} castShadow receiveShadow>
          <boxGeometry args={[2.25, 0.05, 1.28]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} material={mats.walnut} castShadow>
          <boxGeometry args={[2.05, 0.16, 1.08]} />
        </mesh>
        {[-0.96, 0.96].map((lx) =>
          [-0.48, 0.48].map((lz) => (
            <mesh key={`tl_${lx}_${lz}`} position={[lx, 0.35, lz]} material={mats.walnut} castShadow receiveShadow>
              <boxGeometry args={[0.09, 0.70, 0.09]} />
            </mesh>
          ))
        )}

        {/* Slanted Walnut Reading Lectern holding Hero Tanfidz Muktamar Dossier above table surface */}
        <mesh position={[0, 0.795, -0.15]} material={mats.walnut} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.09, 0.16]} />
        </mesh>
        <group position={[0, 0.875, -0.07]} rotation={[0.34, -0.02, 0]}>
          <mesh position={[0, 0.005, 0.02]} material={mats.walnut} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.025, 0.46]} />
          </mesh>
          <mesh position={[0, 0.026, 0]} material={mats.pages} castShadow receiveShadow>
            <boxGeometry args={[0.32, 0.028, 0.42]} />
          </mesh>
          <mesh position={[0.004, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.decreePage}>
            <planeGeometry args={[0.30, 0.40]} />
          </mesh>
          <group position={[-0.17, 0.044, 0]} rotation={[0, 0, coverAngle]}>
            <mesh
              position={[0.16, 0.008, 0]}
              material={[mats.coverEdge, mats.coverEdge, mats.cover, mats.coverInner, mats.coverEdge, mats.coverEdge]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.33, 0.016, 0.43]} />
            </mesh>
          </group>
        </group>

        {/* Wax seal & scroll neatly placed to top-right clear of bottom edge */}
        <group position={[0.34, 0.752, -0.24]}>
          <mesh position={[0, 0.012, 0]} rotation={[0, 0.25, 0]} material={mats.pages} castShadow>
            <boxGeometry args={[0.20, 0.020, 0.24]} />
          </mesh>
          <mesh position={[0.06, 0.032, -0.04]} material={mats.redWax} castShadow>
            <cylinderGeometry args={[0.034, 0.040, 0.036, 14]} />
          </mesh>
        </group>

        {/* Warm Brass Desk Lamp */}
        <group position={[-0.72, 0.75, -0.28]}>
          <mesh position={[0, 0.02, 0]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.08, 0.10, 0.04, 16]} />
          </mesh>
          <mesh position={[0, 0.24, 0]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.015, 0.02, 0.42, 10]} />
          </mesh>
          <mesh position={[0.06, 0.42, 0.04]} rotation={[0, 0, -0.35]} material={mats.lampShade} castShadow>
            <coneGeometry args={[0.14, 0.11, 16]} />
          </mesh>
          <mesh position={[0.08, 0.37, 0.05]} material={mats.bulb}>
            <sphereGeometry args={[0.038, 10, 10]} />
          </mesh>
        </group>
      </group>

      {/* Santriwati walking through opening doorway down corridor toward class (Beat #03, crisp bright silhouette) */}
      {f >= 98 && (
        <HeritageActor3D
          look={santriPutri(0)}
          f={f}
          position={[0.06, 0, leadZ]}
          view="back"
          pose="stand"
          walk={walkU * 3.8}
          walkAmp={f >= 146 ? 0.92 : 0.12}
          armL={[8, 12]}
          armR={[12, kadArmPose]}
          held="book"
          heldHand="R"
          seed={11}
          billboard={false}
          yaw={0}
          rimColor="#ffe4b5"
          rimSide="L"
          rimStrength={0.35}
        />
      )}

      {/* Atmospheric floating motes */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
        <mesh
          key={`s0m_${idx}`}
          position={[
            -0.9 + ((idx * 0.43) % 1.8),
            0.85 + ((idx * 0.27) % 1.1),
            -1.4 + ((idx * 0.51) % 2.1),
          ]}
          material={mats.dust}
          renderOrder={2}
        >
          <planeGeometry args={[0.045, 0.045]} />
        </mesh>
      ))}
    </group>
  );
};
