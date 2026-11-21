import React, { useMemo } from "react";
import * as THREE from "three";
import { santriPutra, santriPutri } from "../../../shared/HeritageKid";
import { HeritageActor3D } from "../../../shared/three3d/HeritageBillboard";
import { NOINK, twoTone } from "../../../shared/three3d/ep03Shaders";
import {
  ChalkboardCanvas,
  dustMoteTex,
  plasterWallTex,
  sunbeamTex,
  tiledFloorTex,
  woodGrainTex,
} from "../../../shared/three3d/worldTextures";
import { mouthOpenAt } from "./ep03LipSync";
import {
  clamp01,
  criticallyDampedSpring,
  poseSpring,
  poseTween,
  smoother,
} from "./ep03Camera";
import {
  AgendaCanvas,
  QuestionDiagramCanvas,
  SpiBookSpreadCanvas,
  basisMiniPlaqueTex,
  fortasiBannerTex,
  fortasiOrientationEaselTex,
  tmTierTex,
} from "./ep03PropTextures";

const SchoolDeskUnit: React.FC<{
  x: number;
  z: number;
  wood: THREE.Material;
  darkWood: THREE.Material;
  paper: THREE.Material;
  brass: THREE.Material;
}> = ({ x, z, wood, darkWood, paper, brass }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.625, 0]} material={wood} castShadow receiveShadow>
      <boxGeometry args={[1.18, 0.04, 0.50]} />
    </mesh>
    <mesh position={[0, 0.47, -0.21]} material={darkWood} castShadow receiveShadow>
      <boxGeometry args={[1.08, 0.27, 0.035]} />
    </mesh>
    {[-0.52, 0.52].map((lx) =>
      [-0.2, 0.2].map((lz) => (
        <mesh key={`dl_${lx}_${lz}`} position={[lx, 0.31, lz]} material={darkWood} castShadow receiveShadow>
          <boxGeometry args={[0.055, 0.62, 0.055]} />
        </mesh>
      ))
    )}
    <mesh position={[-0.18, 0.658, 0.04]} rotation={[0, 0.14, 0]} material={paper} castShadow>
      <boxGeometry args={[0.24, 0.024, 0.18]} />
    </mesh>
    <mesh position={[0.32, 0.662, -0.1]} material={brass} castShadow>
      <cylinderGeometry args={[0.025, 0.032, 0.036, 12]} />
    </mesh>
    <mesh position={[0, 0.4, 0.44]} material={wood} castShadow receiveShadow>
      <boxGeometry args={[1.14, 0.038, 0.3]} />
    </mesh>
    {[-0.48, 0.48].map((bx) => (
      <mesh key={`bl_${bx}`} position={[bx, 0.2, 0.44]} material={darkWood} castShadow receiveShadow>
        <boxGeometry args={[0.055, 0.4, 0.26]} />
      </mesh>
    ))}
  </group>
);

export const SetBClassroomSpi: React.FC<{ f: number }> = ({ f }) => {
  const chalk = useMemo(() => new ChalkboardCanvas(), []);
  const questionSheet = useMemo(() => new QuestionDiagramCanvas(), []);
  const spiSpread = useMemo(() => new SpiBookSpreadCanvas(), []);
  const agenda = useMemo(() => new AgendaCanvas(), []);

  const mats = useMemo(() => {
    const floor = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = tiledFloorTex().clone();
          t.repeat.set(3.5, 4.5);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const plaster = twoTone(
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = plasterWallTex().clone();
          t.repeat.set(3, 1.5);
          t.needsUpdate = true;
          return t;
        })(),
      })
    );
    const wood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#6b4426", "#3d2311", 5) }));
    const darkWood = twoTone(new THREE.MeshLambertMaterial({ map: woodGrainTex("#452a16", "#251409", 4) }));
    const bookBinding = twoTone(new THREE.MeshLambertMaterial({ color: "#682018" }));
    const paper = twoTone(new THREE.MeshLambertMaterial({ color: "#e9dec0" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#b68838", specular: "#fff0bf", shininess: 42 }));
    const cream = twoTone(new THREE.MeshLambertMaterial({ color: "#f1e3c4" }));
    const tileRoof = twoTone(new THREE.MeshLambertMaterial({ color: "#8d3422" }));
    const emeraldDome = twoTone(new THREE.MeshLambertMaterial({ color: "#2d5e40" }));
    const ochreWall = twoTone(new THREE.MeshLambertMaterial({ color: "#e6b873" }));
    const amberGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.15, 0.55), toneMapped: false });
    const slate = new THREE.MeshLambertMaterial({
      map: chalk.tex,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: chalk.tex,
      emissiveIntensity: 0.24,
    });
    const ray = new THREE.MeshBasicMaterial({
      map: sunbeamTex(),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const windowGlow = new THREE.MeshBasicMaterial({ color: "#ffebd0", fog: false });
    const lampShade = twoTone(new THREE.MeshLambertMaterial({ color: "#2d4232" }));
    const bulbGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.15, 0.72), toneMapped: false });
    const dust = new THREE.MeshBasicMaterial({
      map: dustMoteTex(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const spiLeft = twoTone(new THREE.MeshLambertMaterial({ map: spiSpread.leftTex }));
    const spiRight = twoTone(new THREE.MeshLambertMaterial({ map: spiSpread.rightTex }));
    const fortasiLintel = twoTone(new THREE.MeshLambertMaterial({ map: fortasiBannerTex() }));
    const orientEasel = twoTone(new THREE.MeshLambertMaterial({ map: fortasiOrientationEaselTex() }));
    const agendaMat = twoTone(new THREE.MeshLambertMaterial({ map: agenda.tex }));
    const questionMat = twoTone(new THREE.MeshLambertMaterial({ map: questionSheet.tex }));
    const tierLit = [0, 1, 2, 3].map((i) => {
      const labels = [
        ["TM I", "Ranting & Cabang"],
        ["TM II", "Tingkat Daerah"],
        ["TM III", "Tingkat Wilayah"],
        ["TM UTAMA", "Tingkat Pusat"],
      ];
      return {
        dim: twoTone(new THREE.MeshLambertMaterial({ map: tmTierTex(labels[i][0], labels[i][1], false) })),
        lit: twoTone(new THREE.MeshLambertMaterial({ map: tmTierTex(labels[i][0], labels[i][1], true) })),
      };
    });
    const basisPlaques = [
      ["1", "SEKOLAH", "Pelajar Muhammadiyah"],
      ["2", "MADRASAH", "Lingkungan Pendidikan"],
      ["3", "PANTI ASUHAN", "Rumah Pembinaan"],
      ["4", "KAMPUNG", "Basis Masyarakat"],
    ].map(([n, t, s]) => ({
      dim: twoTone(new THREE.MeshLambertMaterial({ map: basisMiniPlaqueTex(n, t, s, false) })),
      lit: twoTone(new THREE.MeshLambertMaterial({ map: basisMiniPlaqueTex(n, t, s, true) })),
    }));
    const goldPop = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.05, 0.35), toneMapped: false });
    const ring = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.5, 1.05, 0.35),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    return {
      floor,
      plaster,
      wood,
      darkWood,
      bookBinding,
      paper,
      brass,
      cream,
      tileRoof,
      emeraldDome,
      ochreWall,
      amberGlow,
      slate,
      ray,
      windowGlow,
      lampShade,
      bulbGlow,
      dust,
      spiLeft,
      spiRight,
      fortasiLintel,
      orientEasel,
      agendaMat,
      questionMat,
      tierLit,
      basisPlaques,
      goldPop,
      ring,
    };
  }, [chalk, questionSheet, spiSpread, agenda]);

  // Beat #05 B-roll: Question sheet drawing ATURAN PUSAT -> ? -> SISWA BARU on desk (f=312..385)
  questionSheet.update(f < 312 ? 0 : clamp01((f - 312) / 68));

  // Beats #06-#09: Word-synced chalkboard PP(415) -> PW(472) -> PD(502) -> PC(528) -> PR(588)
  const flowP = clamp01((f - 392) / (610 - 392));
  const prPulse = f >= 588 ? 0.55 + 0.45 * clamp01((f - 588) / 20) : 0;
  chalk.update(flowP, prPulse, 0);

  // Beats #10-#13: 4 Miniature 3D Basis Buildings popping cleanly at Sekolah(652), Madrasah(679), Panti Asuhan(707), Kampung(735)
  const basisPop = [
    criticallyDampedSpring(f, 650, 30, 10.5),
    criticallyDampedSpring(f, 677, 30, 10.5),
    criticallyDampedSpring(f, 705, 30, 10.5),
    criticallyDampedSpring(f, 733, 30, 10.5),
  ];

  // Beats #14-#15: Open SPI Book diagram + 3D Pop-Up Blueprint rising off pages at "hadir Sistem Perkaderan IPM" (869)
  const spiP = f < 785 ? 0 : clamp01((f - 785) / 145);
  spiSpread.update(spiP);
  const paperDriftU = f < 810 ? 0 : smoother((f - 810) / 52);
  const blueprintPop = criticallyDampedSpring(f, 868, 30, 8.5);

  // Beat #20-#21: Orientation Pinboard checkmarks + "punya rumah" badge glow (f=1453)
  const agendaP = f < 1338 ? 0 : clamp01((f - 1338) / 62);
  const homeGlow = f < 1445 ? 0 : clamp01((f - 1445) / 22);
  agenda.update(agendaP, homeGlow);

  const dustCoords = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: -2.4 + ((i * 0.71) % 4.0),
        y: 0.75 + ((i * 0.43) % 1.9),
        z: -2.6 + ((i * 0.89) % 4.6),
      })),
    []
  );

  // ================= POSE-TO-POSE CHARACTER BLOCKING (ZERO Math.sin LOOPING) =================
  // Beat #04-#05: Andi enters aisle (f=243..292), pauses calm, raises hand ONCE on "aturan pusat" (f=325) & holds
  const andiWalkU = clamp01((f - 243) / 48);
  const andiZ = f < 296 ? -2.30 + andiWalkU * 0.45 : -1.85;
  const andiTurn = poseTween(f, 294, 314, -0.15, -0.34);
  const andiArmLift = poseSpring(f, 322, 10, 32, 8.5);
  const andiBrow = poseSpring(f, 322, 0.05, 0.30, 8.5);
  const andiMouth = mouthOpenAt(f, "andi", 30);

  // Beats #06-#09: Blackboard kader walks laterally (x: -0.82 -> 1.24) keeping step with boxes, then points PR once at f=594
  const writerWalkU = clamp01((f - 405) / 180);
  const writerX = poseTween(f, 405, 588, -0.82, 1.24);
  const writerFacing = poseTween(f, 588, 608, -0.20, 0.16);
  const writerArmLift = poseSpring(f, 592, -16, -42, 9.0);

  // Beats #10-#13: Basis student hands letter forward ONCE at f=705 & holds
  const basisLetterLift = poseSpring(f, 705, -10, -28, 8.5);

  // Beats #16-#17: FORTASI student walks smoothly through portal (z: 2.45 -> 1.72, f=955..1020); mentor lifts book ONCE at f=1075
  const fortasiWalkU = f < 955 ? 0 : clamp01((f - 955) / 65);
  const fortasiJuniorZ = 2.45 - smoother(fortasiWalkU) * 0.73;
  const easelRise = criticallyDampedSpring(f, 1072, 30, 8.5);
  const mentorArm = poseSpring(f, 1074, 10, 28, 8.0);
  const juniorHead = poseTween(f, 1118, 1145, -0.34, -0.18);

  // Beats #18-#19: 4 Taruna Melati tiers spring up individually at f=1218, 1244, 1270, 1296
  const tmPop = [
    criticallyDampedSpring(f, 1216, 30, 9.5),
    criticallyDampedSpring(f, 1242, 30, 9.5),
    criticallyDampedSpring(f, 1268, 30, 9.5),
    criticallyDampedSpring(f, 1294, 30, 9.5),
  ];
  const tmTorchRise = criticallyDampedSpring(f, 1298, 30, 8.0);

  // Beats #20-#21: Anisa sweeps quill ONCE down schedule (f=1340..1392), rests quill cleanly (f=1412..1442), smiles warmly
  const anisaQuillAngle = f < 1408 ? poseTween(f, 1340, 1392, 22, -6) : poseTween(f, 1410, 1442, -6, 12);
  const anisaElbowAngle = f < 1408 ? poseTween(f, 1340, 1392, -60, -40) : poseTween(f, 1410, 1442, -40, -34);
  const anisaSmileLift = criticallyDampedSpring(f, 1442, 30, 7.0);
  const anisaMouth = mouthOpenAt(f, "anisa", 30);

  const showClassroomDesks = f < 649 || f >= 780;

  return (
    <group>
      {/* Floor & Room Walls */}
      <mesh position={[0, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor} receiveShadow>
        <planeGeometry args={[7.4, 9.2]} />
      </mesh>
      <mesh position={[0, 1.7, -3.65]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[7.4, 3.4, 0.16]} />
      </mesh>
      <mesh position={[0, 0.46, -3.55]} material={mats.darkWood} receiveShadow castShadow>
        <boxGeometry args={[7.4, 0.92, 0.06]} />
      </mesh>
      <mesh position={[3.65, 1.7, 0.5]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.16, 3.4, 9.2]} />
      </mesh>
      <mesh position={[3.55, 0.46, 0.5]} material={mats.darkWood} receiveShadow>
        <boxGeometry args={[0.05, 0.92, 9.2]} />
      </mesh>

      {/* Left Wall + Window Bays */}
      <mesh position={[-3.45, 0.44, 0.5]} material={mats.darkWood} receiveShadow>
        <boxGeometry args={[0.18, 0.88, 9.2]} />
      </mesh>
      <mesh position={[-3.45, 2.95, 0.5]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[0.18, 0.95, 9.2]} />
      </mesh>
      {[
        { z: -2.65, len: 2.2 },
        { z: 0.15, len: 1.0 },
        { z: 3.15, len: 2.6 },
      ].map((p, idx) => (
        <mesh key={`pier_${idx}`} position={[-3.45, 1.68, p.z]} material={mats.plaster} receiveShadow castShadow>
          <boxGeometry args={[0.18, 1.62, p.len]} />
        </mesh>
      ))}
      {[-0.95, 1.25].map((wz) => (
        <group key={`win_${wz}`} position={[-3.46, 1.68, wz]}>
          <mesh position={[-0.45, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.windowGlow}>
            <planeGeometry args={[2.2, 2.2]} />
          </mesh>
          <mesh position={[0, 0, 0]} material={mats.darkWood} castShadow>
            <boxGeometry args={[0.08, 1.6, 0.05]} />
          </mesh>
          <mesh position={[0, 0.15, 0]} material={mats.darkWood} castShadow>
            <boxGeometry args={[0.08, 0.05, 1.2]} />
          </mesh>
          <mesh position={[0, -0.8, 0]} material={mats.wood} castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.06, 1.28]} />
          </mesh>
        </group>
      ))}

      {/* Front Chalkboard */}
      <group position={[0.1, 1.72, -3.52]}>
        <mesh position={[0, 0, 0.04]} material={mats.slate}>
          <planeGeometry args={[3.04, 1.46]} />
        </mesh>
        <mesh position={[0, 0.76, 0.02]} material={mats.wood} castShadow>
          <boxGeometry args={[3.22, 0.08, 0.09]} />
        </mesh>
        <mesh position={[0, -0.77, 0.04]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[3.26, 0.09, 0.14]} />
        </mesh>
        <mesh position={[-1.56, 0, 0.02]} material={mats.wood} castShadow>
          <boxGeometry args={[0.09, 1.56, 0.09]} />
        </mesh>
        <mesh position={[1.56, 0, 0.02]} material={mats.wood} castShadow>
          <boxGeometry args={[0.09, 1.56, 0.09]} />
        </mesh>
      </group>

      {/* Ceiling beams + steady hanging lamps */}
      {[-2.2, -0.4, 1.4].map((bz) => (
        <mesh key={`beam_${bz}`} position={[0, 3.22, bz]} material={mats.darkWood} castShadow>
          <boxGeometry args={[7.2, 0.16, 0.18]} />
        </mesh>
      ))}
      <group position={[0.2, 3.22, -1.75]}>
        <mesh position={[0, -0.45, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.014, 0.014, 0.9, 8]} />
        </mesh>
        <mesh position={[0, -0.92, 0]} material={mats.lampShade} castShadow>
          <coneGeometry args={[0.22, 0.14, 16, 1, true]} />
        </mesh>
        <mesh position={[0, -0.97, 0]} material={mats.bulbGlow}>
          <sphereGeometry args={[0.05, 12, 12]} />
        </mesh>
      </group>

      <group position={[-1.25, 3.22, 1.42]}>
        <mesh position={[0, -0.62, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.012, 0.012, 1.24, 8]} />
        </mesh>
        <mesh position={[0, -1.25, 0]} material={mats.lampShade} castShadow>
          <coneGeometry args={[0.20, 0.12, 16, 1, true]} />
        </mesh>
        <mesh position={[0, -1.30, 0]} material={mats.bulbGlow}>
          <sphereGeometry args={[0.048, 12, 12]} />
        </mesh>
      </group>

      {/* School Desks (cleared briefly during S08 architectural diorama showcase so stage stays clean) */}
      {showClassroomDesks &&
        [-1.55, -0.15, 1.55].map((dz) =>
          [-1.35, 1.35].map((dx) => (
            <SchoolDeskUnit
              key={`desk_${dx}_${dz}`}
              x={dx}
              z={dz}
              wood={mats.wood}
              darkWood={mats.darkWood}
              paper={mats.paper}
              brass={mats.brass}
            />
          ))
        )}

      {/* Beat #05 B-roll: Slanted Question Diagram Lectern Sheet on foreground left student desk */}
      {f >= 243 && f < 405 && (
        <group position={[-0.96, 0.725, -1.48]} rotation={[0.42, 0.34, 0]}>
          <mesh position={[0, -0.012, 0]} material={mats.darkWood} castShadow>
            <boxGeometry args={[0.48, 0.02, 0.34]} />
          </mesh>
          <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.questionMat}>
            <planeGeometry args={[0.44, 0.30]} />
          </mesh>
        </group>
      )}

      {/* ================= BEATS #10-#13: S08 4 ARCHITECTURAL DIORAMA BUILDINGS (f=649..779) ================= */}
      {f >= 649 && f < 780 && (
        <group position={[0, 0, -0.58]}>
          {/* Showcase Plinth Table lowered to y=0.56 so domes/flagpoles sit cleanly below rear students' chins */}
          <mesh position={[0, 0.56, 0]} material={mats.wood} castShadow receiveShadow>
            <boxGeometry args={[1.38, 0.05, 0.56]} />
          </mesh>
          <mesh position={[-0.58, 0.28, 0]} material={mats.darkWood} castShadow>
            <boxGeometry args={[0.08, 0.56, 0.42]} />
          </mesh>
          <mesh position={[0.58, 0.28, 0]} material={mats.darkWood} castShadow>
            <boxGeometry args={[0.08, 0.56, 0.42]} />
          </mesh>

          {/* [1] SEKOLAH (f=652) */}
          <group position={[-0.45, 0.585, 0.04]} scale={[1, Math.max(0.02, basisPop[0]), 1]}>
            <mesh position={[0, 0.11, 0]} material={mats.cream} castShadow>
              <boxGeometry args={[0.22, 0.21, 0.16]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} rotation={[0, Math.PI / 4, 0]} material={mats.tileRoof} castShadow>
              <coneGeometry args={[0.17, 0.11, 4]} />
            </mesh>
            <mesh position={[0.12, 0.17, 0.07]} material={mats.brass}>
              <cylinderGeometry args={[0.008, 0.008, 0.34, 8]} />
            </mesh>
            <mesh position={[0, 0.056, 0.14]} rotation={[-0.36, 0, 0]} material={basisPop[0] > 0.4 ? mats.basisPlaques[0].lit : mats.basisPlaques[0].dim}>
              <planeGeometry args={[0.26, 0.11]} />
            </mesh>
          </group>

          {/* [2] MADRASAH (f=679) */}
          <group position={[-0.15, 0.585, -0.06]} scale={[1, Math.max(0.02, basisPop[1]), 1]}>
            <mesh position={[0, 0.12, 0]} material={mats.cream} castShadow>
              <boxGeometry args={[0.21, 0.22, 0.16]} />
            </mesh>
            <mesh position={[0, 0.27, 0]} material={mats.emeraldDome} castShadow>
              <sphereGeometry args={[0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
            <mesh position={[0, 0.056, 0.14]} rotation={[-0.36, 0, 0]} material={basisPop[1] > 0.4 ? mats.basisPlaques[1].lit : mats.basisPlaques[1].dim}>
              <planeGeometry args={[0.26, 0.11]} />
            </mesh>
          </group>

          {/* [3] PANTI ASUHAN (f=707) */}
          <group position={[0.15, 0.585, 0.04]} scale={[1, Math.max(0.02, basisPop[2]), 1]}>
            <mesh position={[0, 0.10, 0]} material={mats.ochreWall} castShadow>
              <boxGeometry args={[0.21, 0.19, 0.16]} />
            </mesh>
            <mesh position={[0, 0.24, 0]} rotation={[0, Math.PI / 4, 0]} material={mats.tileRoof} castShadow>
              <coneGeometry args={[0.16, 0.10, 4]} />
            </mesh>
            <mesh position={[0, 0.10, 0.085]} material={mats.amberGlow}>
              <planeGeometry args={[0.06, 0.06]} />
            </mesh>
            <mesh position={[0, 0.056, 0.14]} rotation={[-0.36, 0, 0]} material={basisPop[2] > 0.4 ? mats.basisPlaques[2].lit : mats.basisPlaques[2].dim}>
              <planeGeometry args={[0.26, 0.11]} />
            </mesh>
          </group>

          {/* [4] KAMPUNG (f=735) */}
          <group position={[0.45, 0.585, -0.06]} scale={[1, Math.max(0.02, basisPop[3]), 1]}>
            <mesh position={[-0.08, 0.13, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.036, 0.26, 0.05]} />
            </mesh>
            <mesh position={[0.08, 0.13, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.036, 0.26, 0.05]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={mats.wood} castShadow>
              <boxGeometry args={[0.24, 0.055, 0.08]} />
            </mesh>
            <mesh position={[0, 0.19, 0.035]} material={mats.amberGlow}>
              <sphereGeometry args={[0.028, 10, 10]} />
            </mesh>
            <mesh position={[0, 0.056, 0.14]} rotation={[-0.36, 0, 0]} material={basisPop[3] > 0.4 ? mats.basisPlaques[3].lit : mats.basisPlaques[3].dim}>
              <planeGeometry args={[0.26, 0.11]} />
            </mesh>
          </group>
        </group>
      )}

      {/* ================= S2 PROPS (visible f >= 780) ================= */}
      {f >= 780 && (
        <>
          {/* Beats #14-#15: Slanted 34-deg Mahogany Reading Lectern + Non-Obstructing 3D Pop-Up Compass Ring & Edge Beads */}
          <group position={[-1.35, 0.66, 1.42]}>
            {[-0.34, 0.32].map((px, i) => (
              <mesh
                key={`drift_${i}`}
                position={[px + (i === 0 ? -1 : 1) * paperDriftU * 0.24, 0.008 + paperDriftU * 0.06, 0.10 - paperDriftU * 0.16]}
                rotation={[-Math.PI / 2, 0, (i === 0 ? 0.35 : -0.4) + paperDriftU * 0.4]}
                material={mats.paper}
                castShadow
              >
                <planeGeometry args={[0.20, 0.26]} />
              </mesh>
            ))}

            {/* 34-degree tilted book stand facing camera clearly */}
            <group position={[0, 0.10, 0]} rotation={[0.52, 0, 0]}>
              <mesh position={[0, -0.02, 0]} material={mats.darkWood} castShadow>
                <boxGeometry args={[0.66, 0.02, 0.46]} />
              </mesh>
              <mesh position={[0, 0, 0]} material={mats.bookBinding} castShadow receiveShadow>
                <boxGeometry args={[0.60, 0.024, 0.42]} />
              </mesh>
              <mesh position={[-0.14, 0.022, 0]} rotation={[0, 0, 0.04]} material={mats.spiLeft} castShadow>
                <boxGeometry args={[0.26, 0.016, 0.38]} />
              </mesh>
              <mesh position={[0.14, 0.022, 0]} rotation={[0, 0, -0.04]} material={mats.spiRight} castShadow>
                <boxGeometry args={[0.26, 0.016, 0.38]} />
              </mesh>

              {/* 3D Pop-Up Gold Compass Halo + Spine Ribbon Markers placed cleanly OUTSIDE text boxes */}
              {blueprintPop > 0.05 && (
                <group position={[0, 0.036, 0]} scale={[1, blueprintPop, 1]}>
                  <mesh position={[-0.14, 0.022, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ring} layers={1 << NOINK}>
                    <ringGeometry args={[0.052, 0.066, 24]} />
                  </mesh>
                  {[0, 1, 2, 3, 4].map((bi) => (
                    <mesh
                      key={`pop_${bi}`}
                      position={[0.285, 0.014 + bi * 0.010, -0.09 + bi * 0.052]}
                      material={mats.goldPop}
                    >
                      <boxGeometry args={[0.024, 0.014, 0.024]} />
                    </mesh>
                  ))}
                </group>
              )}
            </group>
          </group>

          {/* Beats #16-#17: FORTASI Portal Gate + Orientation Easel */}
          <group position={[0.46, 0, 1.85]}>
            <mesh position={[-0.72, 1.04, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.09, 2.08, 0.10]} />
            </mesh>
            <mesh position={[0.72, 1.04, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[0.09, 2.08, 0.10]} />
            </mesh>
            <mesh position={[0, 2.12, 0]} material={mats.darkWood} castShadow>
              <boxGeometry args={[1.56, 0.36, 0.12]} />
            </mesh>
            <mesh position={[0, 2.12, 0.07]} material={mats.fortasiLintel}>
              <planeGeometry args={[1.42, 0.32]} />
            </mesh>
          </group>

          {f >= 1057 && f < 1216 && (
            <group position={[-0.62, 0, 2.30]} rotation={[0, 0.26, 0]} scale={[1, Math.max(0.05, easelRise), 1]}>
              <mesh position={[0, 0.66, -0.04]} material={mats.darkWood} castShadow>
                <boxGeometry args={[0.06, 1.32, 0.06]} />
              </mesh>
              <mesh position={[0, 1.26, 0]} material={mats.darkWood} castShadow>
                <boxGeometry args={[0.56, 0.42, 0.04]} />
              </mesh>
              <mesh position={[0, 1.26, 0.025]} material={mats.orientEasel}>
                <planeGeometry args={[0.50, 0.37]} />
              </mesh>
            </group>
          )}

          {/* Beats #18-#19: 4 Rising Stepped Taruna Melati Podiums + Golden Torch atop TM UTAMA */}
          <group position={[2.35, 0, 0.42]}>
            {[0, 1, 2, 3].map((i) => {
              const sc = Math.max(0.02, tmPop[i]);
              const m = sc > 0.35 ? mats.tierLit[i].lit : mats.tierLit[i].dim;
              return (
                <group
                  key={`tm_blk_${i}`}
                  position={[0, (0.26 + i * 0.35) * sc, -i * 0.16]}
                  scale={[1, sc, 1]}
                >
                  <mesh material={mats.wood} castShadow receiveShadow>
                    <boxGeometry args={[0.88, 0.32, 0.38]} />
                  </mesh>
                  <mesh position={[0, 0, 0.195]} material={m}>
                    <planeGeometry args={[0.82, 0.27]} />
                  </mesh>
                </group>
              );
            })}
            {f >= 1294 && (
              <group position={[0, 1.48, -0.48]} scale={[tmTorchRise, tmTorchRise, tmTorchRise]}>
                <mesh position={[0, 0.08, 0]} material={mats.brass} castShadow>
                  <cylinderGeometry args={[0.10, 0.05, 0.12, 12]} />
                </mesh>
                <mesh position={[0, 0.22, 0]} material={mats.amberGlow}>
                  <coneGeometry args={[0.075, 0.22, 12]} />
                </mesh>
              </group>
            )}
          </group>

          {/* Beats #20-#21: Slanted RUMAH PELAJAR Clipboard resting flush on desk facing S2_13 camera head-on */}
          {f >= 1332 && (
            <group position={[0.92, 0.88, -0.02]} rotation={[0, -0.24, 0]}>
              <group rotation={[-0.58, 0, 0]}>
                <mesh position={[0, 0, 0.012]} material={mats.darkWood} castShadow>
                  <boxGeometry args={[0.46, 0.54, 0.02]} />
                </mesh>
                <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]} material={mats.agendaMat}>
                  <planeGeometry args={[0.42, 0.50]} />
                </mesh>
              </group>
            </group>
          )}
        </>
      )}

      {/* Volumetric Sunbeams + Dust */}
      {[-0.95, 1.25].map((wz) => (
        <mesh
          key={`ray_${wz}`}
          position={[-1.45, 1.25, wz + 0.15]}
          rotation={[0.05, 0.15, -0.78]}
          material={mats.ray}
          renderOrder={2}
        >
          <planeGeometry args={[2.6, 3.4]} />
        </mesh>
      ))}
      {dustCoords.map((d, idx) => (
        <mesh key={`dust_${idx}`} position={[d.x, d.y, d.z]} material={mats.dust} renderOrder={2}>
          <planeGeometry args={[0.048, 0.048]} />
        </mesh>
      ))}

      {/* ======================== CAST: 2D HERITAGE KID ACTORS IN 3D ROOM (ZERO LOOPING) ======================== */}
      {/* Beats #04-#05: Andi entering aisle & holding 1 clear question pose */}
      {f >= 243 && f < 399 && (
        <HeritageActor3D
          look={santriPutra(0, "brown")}
          f={f}
          position={[0.16, 0, andiZ]}
          view={f < 296 ? "threeQuarter" : "front"}
          pose="stand"
          walk={f < 296 ? (f - 243) * 0.048 : 0}
          walkAmp={f < 296 ? 0.9 : 0}
          head={0}
          headTurn={andiTurn}
          brow={andiBrow}
          open={andiMouth}
          held="book"
          heldHand="R"
          armL={[andiArmLift, 18]}
          armR={[14, -46]}
          useV2Blink
          seed={11}
          rimColor="#ffdca8"
          rimSide="L"
          rimStrength={0.34}
          cast3DShadow
        />
      )}

      {/* Beat #05: Seated classmate OTS shoulder */}
      {f >= 243 && f < 649 && (
        <HeritageActor3D
          look={santriPutri(1)}
          f={f}
          position={[-1.26, 0, -1.11]}
          view="back"
          pose="sit_desk"
          billboard={false}
          yaw={-0.18}
          seed={23}
          showBlob={false}
        />
      )}

      {/* Beats #06-#09: Blackboard writer walking laterally with chart, stopping beside PR & pointing ONCE (f=592) */}
      {f >= 399 && f < 649 && (
        <HeritageActor3D
          look={santriPutra(2, null)}
          f={f}
          position={[writerX, 0, -2.92]}
          view="threeQuarter"
          flip
          pose="stand"
          walk={f < 588 ? writerWalkU * 4.5 : 0}
          walkAmp={f < 588 ? 0.85 : 0}
          billboard={false}
          yaw={writerFacing}
          armL={[writerArmLift, -26]}
          armR={[10, 14]}
          head={-4}
          headTurn={f >= 588 ? -0.16 : -0.30}
          smile={0.22}
          useV2Blink
          seed={37}
          rimColor="#ffdfaa"
          rimSide="L"
          rimStrength={0.3}
          cast3DShadow
        />
      )}

      {/* Beats #10-#13: Basis students standing proudly behind 4 architectural dioramas, passing letter ONCE at f=705 */}
      {f >= 649 && f < 780 && (
        <>
          <HeritageActor3D
            look={santriPutra(1, "indigo")}
            f={f}
            position={[-0.36, 0, -1.24]}
            worldScale={0.94}
            view="threeQuarter"
            pose="stand"
            armL={[8, 14]}
            armR={[14, -46]}
            held="book"
            heldHand="R"
            headTurn={0.22}
            smile={0.3}
            useV2Blink
            seed={41}
            cast3DShadow
          />
          <HeritageActor3D
            look={santriPutri(2)}
            f={f}
            position={[0.36, 0, -1.24]}
            worldScale={0.94}
            view="threeQuarter"
            flip
            pose="stand"
            armL={[basisLetterLift, -36]}
            armR={[8, 12]}
            held="letter"
            heldHand="L"
            headTurn={-0.22}
            smile={0.35}
            useV2Blink
            seed={47}
            cast3DShadow
          />
        </>
      )}

      {/* Beats #16-#17: FORTASI student walks forward through arch to mentor; 1 calm book presentation pose */}
      {f >= 955 && f < 1216 && (
        <>
          <HeritageActor3D
            look={santriPutra(3, "olive")}
            f={f}
            position={[0.20, 0, 1.80]}
            view="threeQuarter"
            pose="stand"
            held="book"
            heldHand="R"
            armL={[mentorArm, 22]}
            armR={[14, -48]}
            head={0}
            headTurn={0.28}
            smile={0.35}
            useV2Blink
            seed={51}
            cast3DShadow
          />
          <HeritageActor3D
            look={santriPutri(0)}
            f={f}
            position={[0.72, 0, fortasiJuniorZ]}
            view="threeQuarter"
            flip
            pose="stand"
            walk={f < 1020 ? fortasiWalkU * 2.5 : 0}
            walkAmp={f < 1020 ? 0.85 : 0}
            armL={[-16, -28]}
            armR={[8, 12]}
            headTurn={juniorHead}
            smile={0.40}
            useV2Blink
            seed={59}
            cast3DShadow
          />
        </>
      )}

      {/* Beats #20-#21: Anisa checking Pinboard ONCE smoothly then smiling warmly with natural D-shape lip-sync */}
      {f >= 1320 && (
        <HeritageActor3D
          look={santriPutri(0)}
          f={f}
          position={[1.32, 0, 0.29]}
          view="threeQuarter"
          pose="sit_desk"
          billboard={false}
          yaw={Math.PI + 0.24}
          armL={[10, 16]}
          armR={[anisaQuillAngle, anisaElbowAngle]}
          held={f >= 1435 ? null : "quill"}
          head={0}
          brow={0.18}
          smile={0.25 + anisaSmileLift * 0.50}
          open={anisaMouth}
          headTurn={0.14 * anisaSmileLift}
          useV2Blink
          seed={61}
          showBlob={false}
          rimColor="#ffdfaa"
          rimSide="L"
          rimStrength={0.32}
        />
      )}
    </group>
  );
};
