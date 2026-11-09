/** Authored off-road driving course; the paths are landmarks, never movement rails. */
export const COURSE_HOLES = [
  { id: "pit-south", x: 0, z: 24, radius: 5.5 },
  { id: "pit-pass", x: 12, z: -11, radius: 5 },
  { id: "pit-east", x: 30, z: 15, radius: 4.8 },
  { id: "pit-return", x: 23, z: 32, radius: 5.5 },
  { id: "pit-north", x: -12, z: -31, radius: 4 },
] as const;
export const COURSE_ROCKS = [
  [-26, 17, 1.8],
  [-21, 27, 1.7],
  [-17, 12, 1.5],
  [-6, 12, 1.5],
  [-4, 0, 1.6],
  [4, -5, 1.8],
  [-38, 4, 2],
  [-26, 5, 1.5],
  [-32, -8, 1.7],
  [-22, -9, 1.8],
  [-37, -16, 2.1],
  [-20, -17, 1.8],
  [-37, -26, 2],
  [-19, -26, 1.7],
  [-23, -34, 1.8],
  [-4, -22, 1.5],
  [7, -28, 1.7],
  [17, 4, 1.5],
  [21, -2, 2],
  [34, -3, 1.5],
  [41, -13, 2],
  [23, -15, 1.6],
  [36, -29, 1.8],
  [16, -31, 1.7],
  [40, 32, 1.8],
  [33, 36, 1.5],
  [12, 36, 1.7],
  [-6, 37, 1.7],
  [-22, 39, 1.8],
].map(([x, z, radius], index) => ({
  id: `course-rock-${index}`,
  x,
  z,
  radius,
}));
export const COURSE_PATHS = [
  {
    name: "Slalom Run",
    points: [
      [-32, 25],
      [-28, 26],
      [-23, 21],
      [-13, 18],
      [-7, 6],
      [8, 3],
    ],
  },
  {
    name: "Ridge Climb",
    points: [
      [-32, 25],
      [-33, 12],
      [-20, -3],
      [-27, -12],
      [-28, -23],
      [-27, -36],
      [0, -34],
    ],
  },
  {
    name: "Crater Pass",
    points: [
      [8, 3],
      [28, 6],
      [39, 0],
      [35, -13],
      [27, -24],
      [8, -38],
      [0, -34],
    ],
  },
  {
    name: "Needle Bend",
    points: [
      [28, 6],
      [40, 11],
      [37, 23],
      [36, 39],
      [8, 41],
      [-15, 32],
      [-32, 25],
    ],
  },
] as const;
export function courseHeight(x: number, z: number) {
  const ridge = 5.2 * Math.exp(-((x + 28) ** 2 / 85 + (z + 23) ** 2 / 190));
  const north = 3.1 * Math.exp(-((x - 1) ** 2 / 150 + (z + 34) ** 2 / 55));
  const east = 2.8 * Math.exp(-((x - 34) ** 2 / 70 + (z - 24) ** 2 / 95));
  return ridge + north + east + Math.sin(x * 0.19) * Math.cos(z * 0.14) * 0.18;
}
export function courseGroundHeight(x: number, z: number) {
  return (
    courseHeight(x, z) -
    COURSE_HOLES.reduce(
      (depth, hole) =>
        depth +
        4 *
          Math.exp(
            -((x - hole.x) ** 2 + (z - hole.z) ** 2) / (hole.radius * 0.7) ** 2,
          ),
      0,
    )
  );
}
