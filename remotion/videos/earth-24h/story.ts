export interface SubtitleCardSpec {
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const EARTH_24H_FRAMES = 1194;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = [
  { startFrame: 20, endFrame: 90, lines: ['Bayangkan seluruh umur', 'Bumi'], highlights: [[20, 32, 0], [33, 54, 1], [55, 66, 2], [67, 90, 3]] },
  { startFrame: 92, endFrame: 158, lines: ['4,5 miliar tahun'], highlights: [[92, 114, 0], [115, 136, 1], [137, 158, 2]] },
  { startFrame: 160, endFrame: 219, lines: ['dipadatkan jadi satu hari'], highlights: [[160, 183, 0], [184, 195, 1], [196, 206, 2], [207, 219, 3]] },
  { startFrame: 238, endFrame: 311, lines: ['Tengah malam, Bumi', 'terbentuk'], highlights: [[238, 244, 0], [245, 253, 1], [254, 274, 2], [275, 311, 3]] },
  { startFrame: 314, endFrame: 378, lines: ['panas dan penuh batu pijar'], highlights: [[314, 324, 0], [325, 336, 1], [337, 352, 2], [353, 364, 3], [365, 378, 4]] },
  { startFrame: 381, endFrame: 417, lines: ['Sekitar jam 4 pagi'], highlights: [[381, 393, 0], [394, 401, 1], [402, 408, 2], [409, 417, 3]] },
  { startFrame: 420, endFrame: 488, lines: ['kehidupan pertama muncul', 'di laut'], highlights: [[420, 443, 0], [444, 461, 1], [462, 474, 2], [475, 481, 3], [482, 488, 4]] },
  { startFrame: 490, endFrame: 553, lines: ['berupa sel yang sangat', 'kecil'], highlights: [[490, 515, 0], [516, 522, 1], [523, 532, 2], [533, 543, 3], [544, 553, 4]] },
  { startFrame: 556, endFrame: 604, lines: ['Lalu berjam-jam lamanya'], highlights: [[556, 569, 0], [570, 588, 1], [589, 604, 2]] },
  { startFrame: 607, endFrame: 646, lines: ['kehidupan hanya berupa'], highlights: [[607, 628, 0], [629, 638, 1], [639, 646, 2]] },
  { startFrame: 649, endFrame: 695, lines: ['makhluk mikroskopis'], highlights: [[649, 665, 0], [666, 695, 1]] },
  { startFrame: 698, endFrame: 745, lines: ['Dinosaurus baru datang'], highlights: [[698, 722, 0], [723, 734, 1], [735, 745, 2]] },
  { startFrame: 748, endFrame: 829, lines: ['jam 10 malam lewat 47', 'menit'], highlights: [[748, 758, 0], [759, 774, 1], [775, 789, 2], [790, 804, 3], [805, 816, 4], [817, 829, 5]] },
  { startFrame: 832, endFrame: 894, lines: ['dan jam 11 lewat 39'], highlights: [[832, 842, 0], [843, 853, 1], [854, 866, 2], [867, 876, 3], [877, 894, 4]] },
  { startFrame: 905, endFrame: 941, lines: ['asteroid menghantam'], highlights: [[905, 916, 0], [917, 941, 1]] },
  { startFrame: 944, endFrame: 982, lines: ['mereka punah'], highlights: [[944, 966, 0], [967, 982, 1]] },
  { startFrame: 985, endFrame: 1015, lines: ['Lalu manusia?'], highlights: [[985, 996, 0], [997, 1015, 1]] },
  { startFrame: 1018, endFrame: 1044, lines: ['Kita baru muncul'], highlights: [[1018, 1027, 0], [1028, 1036, 1], [1037, 1044, 2]] },
  { startFrame: 1047, endFrame: 1087, lines: ['kurang dari 6 detik'], highlights: [[1047, 1068, 0], [1069, 1076, 1], [1077, 1081, 2], [1082, 1087, 3]] },
  { startFrame: 1089, endFrame: 1155, lines: ['sebelum tengah malam'], highlights: [[1089, 1106, 0], [1107, 1122, 1], [1123, 1155, 2]] },
];

export function formatMicrobeCounter(f: number): { label: string; hours: number } {
  const pts: Array<[number, number]> = [
    [580, 4 * 60 + 7],
    [584, 4 * 60 + 8],
    [588, 4 * 60 + 12],
    [590, 4 * 60 + 16],
    [594, 4 * 60 + 26],
    [598, 4 * 60 + 42],
    [600, 4 * 60 + 52],
    [606, 5 * 60 + 35],
    [612, 6 * 60 + 40],
    [618, 8 * 60 + 9],
    [624, 10 * 60 + 9],
    [630, 12 * 60 + 42],
    [636, 15 * 60 + 32],
    [642, 17 * 60 + 48],
    [648, 19 * 60 + 32],
    [654, 20 * 60 + 49],
    [660, 21 * 60 + 42],
    [666, 22 * 60 + 16],
    [672, 22 * 60 + 35],
    [678, 22 * 60 + 44],
    [684, 22 * 60 + 46],
    [690, 22 * 60 + 47],
  ];
  let mins = pts[pts.length - 1][1];
  if (f < pts[0][0]) {
    mins = pts[0][1];
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const [f0, m0] = pts[i];
      const [f1, m1] = pts[i + 1];
      if (f >= f0 && f <= f1) {
        const t = (f - f0) / Math.max(1, f1 - f0);
        mins = Math.round(m0 + (m1 - m0) * t);
        break;
      }
    }
  }
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return { label: `${hh}.${mm}`, hours: mins / 60 };
}

export function formatHumanCounter(f: number): string {
  const pts: Array<[number, number]> = [
    [1005, 47 * 60 + 21],
    [1016, 51 * 60 + 14],
    [1024, 54 * 60 + 13],
    [1032, 56 * 60 + 25],
    [1040, 57 * 60 + 58],
    [1048, 58 * 60 + 58],
    [1056, 59 * 60 + 33],
    [1064, 59 * 60 + 49],
    [1070, 59 * 60 + 54],
    [1130, 59 * 60 + 54],
  ];
  let secs = pts[pts.length - 1][1];
  if (f < pts[0][0]) {
    secs = pts[0][1];
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const [f0, s0] = pts[i];
      const [f1, s1] = pts[i + 1];
      if (f >= f0 && f <= f1) {
        const t = (f - f0) / Math.max(1, f1 - f0);
        secs = Math.round(s0 + (s1 - s0) * t);
        break;
      }
    }
  }
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `23.${mm}.${ss}`;
}
