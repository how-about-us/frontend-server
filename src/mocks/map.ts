import { MOCK_SEARCH_RESULTS } from "./search";

export const HIKONE_CENTER = { lat: 35.276, lng: 136.258 };

const OFFSET_SEEDS = [
  [0.004, -0.003],
  [-0.005, 0.006],
  [0.007, 0.002],
  [-0.003, -0.007],
  [0.001, 0.008],
  [-0.006, 0.001],
  [0.008, -0.005],
  [-0.002, 0.004],
];

export const MOCK_MARKERS = MOCK_SEARCH_RESULTS.map((r, i) => ({
  ...r,
  id: i,
  position: {
    lat: HIKONE_CENTER.lat + OFFSET_SEEDS[i % OFFSET_SEEDS.length][0],
    lng: HIKONE_CENTER.lng + OFFSET_SEEDS[i % OFFSET_SEEDS.length][1],
  },
}));

export type MapMarker = (typeof MOCK_MARKERS)[number];
