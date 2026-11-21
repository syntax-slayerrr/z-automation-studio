import React, { useMemo } from "react";
import * as THREE from "three";
import islandsRaw from "../../ep01/data/indonesia_islands.json";
import { santriPutra, santriPutri } from "../../../shared/HeritageKid";
import { HeritageActor3D } from "../../../shared/three3d/HeritageBillboard";
import { NOINK, twoTone } from "../../../shared/three3d/ep03Shaders";
import { dustMoteTex, plasterWallTex, tiledFloorTex, woodGrainTex } from "../../../shared/three3d/worldTextures";
import {
  clamp01,
  criticallyDampedSpring,
  poseSpring,
  poseTween,
  smoother,
} from "./ep03Camera";
import {
  ArchiveTimelineCanvas,
  plaqueGarutTex,
  prianganMapBaseTex,
  skMaklumatTex,
} from "./ep03PropTextures";

const CENTER_LNG = 109.06;
const CENTER_LAT = -7.42;

const toShapeXY = (lng: number, lat: number): [number, number] => [lng - CENTER_LNG, lat - CENTER_LAT];
const toWorldXZ = (lng: number, lat: number): [number, number] => [lng - CENTER_LNG, -(lat - CENTER_LAT)];

const PRIANGAN_PEAKS: Array<[number, number, number, number]> = [
  [107.62, -7.28, 0.25, 0.36],
  [108.16, -7.24, 0.24, 0.34],
  [107.48, -6.78, 0.22, 0.30],
  [106.92, -6.76, 0.24, 0.32],
  [108.45, -6.92, 0.22, 0.30],
  [109.24, -7.22, 0.24, 0.32],
  [110.42, -7.48, 0.26, 0.34],
];

export const SetCPrianganMap: React.FC<{ f: number }> = ({ f }) => {
  const archiveBoard = useMemo(() => new ArchiveTimelineCanvas(), []);

  const geoData = useMemo(() => {
    const features = (islandsRaw as {
      features: Array<{ properties: { country?: string; island?: string }; geometry: { coordinates: number[][][] } }>;
    }).features;

    const shapes: THREE.Shape[] = [];
    for (const feat of features) {
      if (feat.properties?.country !== "Indonesia") continue;
      const island = (feat.properties?.island || "").toLowerCase();
      const ring = feat.geometry?.coordinates?.[0];
      if (!ring || ring.length < 3) continue;
      const firstLon = ring[0][0];
      const include =
        island === "jawa" ||
        island === "sumatera" ||
        island === "nusatenggara" ||
        (island === "other" && firstLon >= 104 && firstLon <= 115);
      if (!include) continue;

      const shape = new THREE.Shape();
      ring.forEach(([lng, lat], idx) => {
        const [sx, sy] = toShapeXY(lng, lat);
        if (idx === 0) shape.moveTo(sx, sy);
        else shape.lineTo(sx, sy);
      });
      shape.closePath();
      shapes.push(shape);
    }

    const landGeo = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.20,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 4,
    });
    landGeo.rotateX(-Math.PI / 2);

    const pStart = toWorldXZ(110.82, -7.58);
    const pMid = toWorldXZ(109.45, -7.22);
    const pGarut = toWorldXZ(107.91, -7.23);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pStart[0], 0.25, pStart[1]),
      new THREE.Vector3(pMid[0], 0.34, pMid[1]),
      new THREE.Vector3(pGarut[0], 0.25, pGarut[1]),
    ]);
    const routeGeo = new THREE.TubeGeometry(curve, 48, 0.034, 8, false);

    return { landGeo, routeGeo, pGarut, pStart };
  }, []);

  const mats = useMemo(() => {
    const sea = twoTone(new THREE.MeshLambertMaterial({ map: prianganMapBaseTex() }));
    const land = twoTone(new THREE.MeshLambertMaterial({ color: "#788a50" }));
    const peak = twoTone(new THREE.MeshLambertMaterial({ color: "#556839" }));
    const monument = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#4d2f1a", "#261409", 4) }));
    const creamWall = twoTone(new THREE.MeshLambertMaterial({ color: "#efe1c2" }));
    const pendopoRoof = twoTone(new THREE.MeshLambertMaterial({ color: "#8d3422" }));
    const crimsonBanner = twoTone(new THREE.MeshLambertMaterial({ color: "#681b12" }));
    const plaque1923 = twoTone(new THREE.MeshLambertMaterial({ map: plaqueGarutTex("1923", "CABANG PERINTIS", "SK PP No. 18/Pr · Garut", false) }));
    const plaque1958 = twoTone(new THREE.MeshLambertMaterial({ map: plaqueGarutTex("1958", "KONFERENSI PEMUDA", "Gagasan Wadah Pelajar", true) }));
    const maklumatMat = twoTone(new THREE.MeshLambertMaterial({ map: skMaklumatTex() }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#e3b652", specular: "#fff3cb", shininess: 50 }));
    const route = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 0.85, 0.28), toneMapped: false });
    const ring = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.5, 1.05, 0.35),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mist = new THREE.MeshBasicMaterial({
      map: dustMoteTex(),
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const torchCore = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.65, 1.15, 0.42),
      toneMapped: false,
    });
    const archiveFloor = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = tiledFloorTex("#c8b696", "#b29e7d", "#54432e").clone();
          t.repeat.set(4, 3);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const archiveWall = twoTone(new THREE.MeshLambertMaterial({ map: plasterWallTex("#d8c8aa", "#b09b78") }));
    const archiveBoardMat = twoTone(new THREE.MeshLambertMaterial({ map: archiveBoard.tex }));
    return {
      sea,
      land,
      peak,
      monument,
      creamWall,
      pendopoRoof,
      crimsonBanner,
      plaque1923,
      plaque1958,
      maklumatMat,
      brass,
      route,
      ring,
      mist,
      torchCore,
      archiveFloor,
      archiveWall,
      archiveBoardMat,
    };
  }, [archiveBoard]);

  // Beat #22: Route speeds west across Java (f=1492..1590)
  const routeU = smoother((f - 1492) / 92);

  // Beat #23: Garut 1923 radial waves & Miniature Pendopo Garut 1923 rising on "Garut berdiri" (f=1685)
  const pulse1 = f >= 1652 ? clamp01((f - 1652) / 30) : 0;
  const pulse2 = f >= 1672 ? clamp01((f - 1672) / 30) : 0;
  const pulse3 = f >= 1690 ? clamp01((f - 1690) / 30) : 0;
  const pendopoRise = criticallyDampedSpring(f, 1685, 30, 8.5);

  // Beat #24: Colonial Veranda 1923 (two separated pioneers + 1 gesture each, ZERO looping)
  const isMonoPhase = f >= 1765 && f < 1903;
  const archiveP = f < 1765 ? 0 : clamp01((f - 1765) / 110);
  archiveBoard.update(archiveP);
  const pioneerLeftArm = poseSpring(f, 1784, 10, -28, 8.5);
  const pioneerRightTurn = poseTween(f, 1848, 1882, -0.24, 0.14);

  // Beats #25-#26: 1958 Youth Conference Stage + Speaker raising arm ONCE clearly ABOVE podium + Torch igniting at f=1999
  const torchGlow = f < 1998 ? 0.15 : criticallyDampedSpring(f, 1998, 30, 7.5);
  const speakerArm = poseSpring(f, 1986, 14, 72, 8.5);
  const speakerElbow = poseSpring(f, 1986, -24, -18, 8.5);

  const [gx, gz] = geoData.pGarut;

  return (
    <group>
      {/* Map Topography in S14, S15, S17 (hidden cleanly in S16 veranda) */}
      {!isMonoPhase && (
        <group>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.sea} receiveShadow>
            <planeGeometry args={[20, 14]} />
          </mesh>
          <mesh geometry={geoData.landGeo} material={mats.land} castShadow receiveShadow />

          {PRIANGAN_PEAKS.map(([lng, lat, r, h], idx) => {
            const [wx, wz] = toWorldXZ(lng, lat);
            return (
              <mesh key={`peak_${idx}`} position={[wx, 0.20 + h * 0.42, wz]} material={mats.peak} castShadow receiveShadow>
                <coneGeometry args={[r, h, 14]} />
              </mesh>
            );
          })}

          {[
            [gx - 0.35, 0.42, gz + 0.15, 0.9],
            [gx + 0.25, 0.46, gz - 0.25, 1.1],
          ].map(([mx, my, mz, sc], idx) => (
            <mesh
              key={`mist_${idx}`}
              position={[mx, my, mz]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={mats.mist}
              renderOrder={1}
            >
              <planeGeometry args={[sc, sc]} />
            </mesh>
          ))}

          {/* Origin Marker Yogyakarta + Glowing Route Ribbon */}
          <mesh position={[geoData.pStart[0], 0.26, geoData.pStart[1]]} material={mats.brass}>
            <cylinderGeometry args={[0.10, 0.12, 0.08, 16]} />
          </mesh>
          {routeU > 0.02 && <mesh geometry={geoData.routeGeo} material={mats.route} scale={[routeU, 1, 1]} />}

          {/* Beat #23: GARUT 1923 Plaque + Rising 3D Miniature Garut 1923 Pendopo Building (f < 1903) */}
          {f < 1903 && (
            <>
              <group position={[gx - 0.06, 0.21, gz]}>
                <mesh position={[0, 0.26, -0.09]} material={mats.monument} castShadow receiveShadow>
                  <boxGeometry args={[0.12, 0.62, 0.10]} />
                </mesh>
                <mesh position={[0, 0.60, 0]} material={mats.brass} castShadow>
                  <boxGeometry args={[0.78, 0.42, 0.07]} />
                </mesh>
                <mesh position={[0, 0.60, 0.038]} material={mats.plaque1923}>
                  <planeGeometry args={[0.72, 0.37]} />
                </mesh>

                {[pulse1, pulse2, pulse3].map((p, idx) =>
                  p > 0 && p < 1 ? (
                    <mesh
                      key={`pr_${idx}`}
                      position={[0.20, 0.04, 0]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      scale={[1 + p * 3.8, 1 + p * 3.8, 1]}
                      material={mats.ring}
                      layers={1 << NOINK}
                    >
                      <ringGeometry args={[0.24, 0.30, 32]} />
                    </mesh>
                  ) : null
                )}
              </group>

              {/* Rising 3D Miniature Pendopo / Sekolah Perintis Garut 1923 positioned cleanly forward of mountain cones */}
              <group position={[gx + 0.36, 0.21, gz + 0.32]} scale={[1, Math.max(0.02, pendopoRise), 1]}>
                <mesh position={[0, 0.03, 0]} material={mats.monument} castShadow>
                  <boxGeometry args={[0.42, 0.06, 0.32]} />
                </mesh>
                <mesh position={[0, 0.14, 0]} material={mats.creamWall} castShadow>
                  <boxGeometry args={[0.32, 0.18, 0.22]} />
                </mesh>
                {[-0.17, 0.17].map((px) => (
                  <mesh key={`pp_${px}`} position={[px, 0.14, 0.12]} material={mats.monument} castShadow>
                    <boxGeometry args={[0.026, 0.18, 0.026]} />
                  </mesh>
                ))}
                <mesh position={[0, 0.31, 0]} rotation={[0, Math.PI / 4, 0]} material={mats.pendopoRoof} castShadow>
                  <coneGeometry args={[0.28, 0.16, 4]} />
                </mesh>
                <mesh position={[0, 0.41, 0]} rotation={[0, Math.PI / 4, 0]} material={mats.pendopoRoof} castShadow>
                  <coneGeometry args={[0.15, 0.10, 4]} />
                </mesh>
              </group>
            </>
          )}
        </group>
      )}

      {/* Beat #24: Shot 16 Colonial 1923 Veranda with Maklumat Table + 2 Unclipped Pioneers */}
      {isMonoPhase && (
        <group>
          <mesh position={[-2.5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.archiveFloor} receiveShadow>
            <planeGeometry args={[8.0, 6.0]} />
          </mesh>
          <mesh position={[-2.5, 1.5, -1.25]} material={mats.archiveWall} receiveShadow>
            <boxGeometry args={[7.2, 3.0, 0.16]} />
          </mesh>
          <mesh position={[-2.5, 0.42, -1.16]} material={mats.monument} receiveShadow>
            <boxGeometry args={[7.2, 0.84, 0.06]} />
          </mesh>

          {/* Elevated Progressive Wall Chronicle (y=1.90 clearly clear of character heads) */}
          <group position={[-2.5, 1.98, -1.12]} scale={[0.64, 0.64, 1]}>
            <mesh material={mats.monument} castShadow>
              <boxGeometry args={[2.56, 0.94, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.036]} material={mats.archiveBoardMat}>
              <planeGeometry args={[2.44, 0.84]} />
            </mesh>
          </group>

          {/* Foreground Colonial Reading Table holding Maklumat Perintis Scroll (compact clear of both hands/props) */}
          <group position={[-2.50, 0, 0.16]}>
            <mesh position={[0, 0.54, 0]} material={mats.monument} castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.04, 0.38]} />
            </mesh>
            <mesh position={[0, 0.568, 0.02]} rotation={[-Math.PI / 2 + 0.35, 0, 0]} material={mats.maklumatMat} castShadow>
              <planeGeometry args={[0.42, 0.25]} />
            </mesh>
          </group>

          {/* Two Pioneers cleanly separated Left & Right with props clear of table edges */}
          <HeritageActor3D
            look={santriPutra(0, "brown")}
            f={f}
            position={[-3.08, 0, -0.34]}
            view="threeQuarter"
            pose="stand"
            worldScale={0.86}
            held="book"
            heldHand="R"
            armL={[pioneerLeftArm, 18]}
            armR={[12, -32]}
            headTurn={0.22}
            smile={0.2}
            useV2Blink
            seed={71}
            cast3DShadow
          />
          <HeritageActor3D
            look={santriPutri(1)}
            f={f}
            position={[-1.88, 0, -0.34]}
            view="threeQuarter"
            flip
            pose="stand"
            worldScale={0.86}
            held="letter"
            heldHand="L"
            armL={[-10, -24]}
            armR={[12, 16]}
            headTurn={pioneerRightTurn}
            smile={0.25}
            useV2Blink
            seed={79}
            cast3DShadow
          />
        </group>
      )}

      {/* Beats #25-#26: Shot 17 Full 1958 Youth Conference Stage + Podium Speaker + Igniting Torch */}
      {f >= 1903 && (
        <group position={[gx + 0.08, 0.22, -1.65]}>
          {/* Dignified 1958 Auditorium Backdrop Wall & Wainscoting hiding distant archipelago pebbles */}
          <mesh position={[0, 1.65, -0.18]} material={mats.creamWall} receiveShadow>
            <boxGeometry args={[3.40, 3.60, 0.06]} />
          </mesh>
          <mesh position={[0, 0.38, -0.15]} material={mats.monument} receiveShadow>
            <boxGeometry args={[2.80, 0.76, 0.06]} />
          </mesh>
          {/* Raised Stage Deck & Side Banner Pillars */}
          <mesh position={[0, 0.08, 0.15]} material={mats.monument} castShadow receiveShadow>
            <boxGeometry args={[1.55, 0.16, 0.90]} />
          </mesh>
          <mesh position={[-0.64, 0.95, -0.05]} material={mats.crimsonBanner} castShadow>
            <boxGeometry args={[0.10, 1.56, 0.08]} />
          </mesh>
          <mesh position={[0.64, 0.95, -0.05]} material={mats.crimsonBanner} castShadow>
            <boxGeometry args={[0.10, 1.56, 0.08]} />
          </mesh>

          {/* Main 1958 Stage Backdrop Banner elevated cleanly above standing speaker */}
          <mesh position={[0, 1.48, -0.06]} material={mats.brass} castShadow>
            <boxGeometry args={[1.14, 0.54, 0.08]} />
          </mesh>
          <mesh position={[0, 1.48, -0.01]} material={mats.plaque1958}>
            <planeGeometry args={[1.06, 0.46]} />
          </mesh>

          {/* Central Torch pedestal igniting cleanly on Beat #26 "menyalakan" (f=1999) */}
          <mesh position={[0, 1.82, -0.04]} material={mats.brass} castShadow>
            <cylinderGeometry args={[0.13, 0.06, 0.12, 12]} />
          </mesh>
          <mesh
            position={[0, 2.00, -0.04]}
            scale={[0.35 + torchGlow * 0.75, 0.35 + torchGlow * 0.75, 0.35 + torchGlow * 0.75]}
            material={mats.torchCore}
          >
            <coneGeometry args={[0.10, 0.28, 12]} />
          </mesh>
          {f >= 1996 && (
            <mesh
              position={[0, 2.00, -0.09]}
              scale={[0.4 + torchGlow * 1.1, 0.4 + torchGlow * 1.1, 1]}
              material={mats.ring}
              layers={1 << NOINK}
            >
              <ringGeometry args={[0.15, 0.24, 28]} />
            </mesh>
          )}

          {/* Wooden Conference Podium & 1958 Youth Speaker (upright facing forward, open inspiring orator gesture above podium) */}
          <HeritageActor3D
            look={santriPutra(2, null)}
            f={f}
            position={[0, 0.16, 0.24]}
            view="front"
            pose="stand"
            worldScale={0.72}
            billboard={false}
            yaw={0.12}
            armL={[16, -28]}
            armR={[speakerArm, speakerElbow]}
            head={0}
            smile={0.25}
            useV2Blink
            seed={83}
            showBlob={false}
            rimColor="#ffe0a6"
            rimSide="L"
            rimStrength={0.35}
          />
          <mesh position={[0, 0.36, 0.44]} material={mats.monument} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.40, 0.20]} />
          </mesh>
          <mesh position={[0, 0.57, 0.44]} material={mats.brass} castShadow>
            <boxGeometry args={[0.44, 0.04, 0.26]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
