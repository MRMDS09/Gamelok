export type BoardModeId = 'quick' | 'balanced' | 'cards' | 'tactical';

export type OpponentMode = 'local' | 'cpu';

export type CpuDifficulty = 'easy' | 'balanced' | 'expert';

export type StartingPlayerMode = 'random' | 'player1' | 'player2';

export const DEFAULT_CPU_DIFFICULTY: CpuDifficulty = 'balanced';

export const DEFAULT_STARTING_PLAYER: StartingPlayerMode = 'random';

export type BoardEdge = {
  type: 'h' | 'v';
  row: number;
  col: number;
  key: string;
};

export interface BoardMode {
  id: BoardModeId;
  name: string;
  columns: number;
  rows: number;
  duration: string;
  description: string;
  cells: boolean[][];
  boxCount: number;
  edgeCount: number;
}

const createRectangularCells = (columns: number, rows: number): boolean[][] =>
  Array.from({ length: rows }, () => Array(columns).fill(true));

const createCardsCells = (): boolean[][] => {
  const cells = Array.from({ length: 5 }, () => Array(8).fill(false));

  for (const startRow of [0, 3]) {
    for (const startColumn of [0, 3, 6]) {
      for (let row = startRow; row < startRow + 2; row++) {
        for (let column = startColumn; column < startColumn + 2; column++) {
          cells[row][column] = true;
        }
      }
    }
  }

  return cells;
};

export const getBoardEdgesFromCells = (cells: boolean[][]): BoardEdge[] => {
  const edgeMap = new Map<string, BoardEdge>();

  cells.forEach((row, rowIndex) => row.forEach((exists, columnIndex) => {
    if (!exists) return;

    const edges: BoardEdge[] = [
      { type: 'h', row: rowIndex, col: columnIndex, key: `h-${rowIndex}-${columnIndex}` },
      { type: 'h', row: rowIndex + 1, col: columnIndex, key: `h-${rowIndex + 1}-${columnIndex}` },
      { type: 'v', row: rowIndex, col: columnIndex, key: `v-${rowIndex}-${columnIndex}` },
      { type: 'v', row: rowIndex, col: columnIndex + 1, key: `v-${rowIndex}-${columnIndex + 1}` },
    ];

    edges.forEach((edge) => edgeMap.set(edge.key, edge));
  }));

  return Array.from(edgeMap.values());
};

const createBoardMode = (
  id: BoardModeId,
  name: string,
  columns: number,
  rows: number,
  duration: string,
  description: string,
  cells: boolean[][] = createRectangularCells(columns, rows),
): BoardMode => {
  const boxCount = cells.reduce(
    (total, row) => total + row.filter(Boolean).length,
    0,
  );
  const edgeCount = getBoardEdgesFromCells(cells).length;

  return {
    id,
    name,
    columns,
    rows,
    duration,
    description,
    cells,
    boxCount,
    edgeCount,
  };
};

export const BOARD_MODES: readonly BoardMode[] = [
  createBoardMode(
    'quick',
    'السريعة',
    4,
    3,
    '3–5 دقائق',
    'جولة خفيفة وسريعة',
  ),
  createBoardMode(
    'balanced',
    'المتوازنة',
    6,
    4,
    '6–10 دقائق',
    'مساحة مناسبة لمعظم المباريات',
  ),
  createBoardMode(
    'cards',
    'البطاقات',
    8,
    5,
    '7–12 دقيقة',
    'ست مجموعات منفصلة من 2×2',
    createCardsCells(),
  ),
  createBoardMode(
    'tactical',
    'الطويلة والتكتيكية',
    8,
    6,
    '12–18 دقيقة',
    'لوحة كبيرة للعب التكتيكي',
  ),
] as const;

export const DEFAULT_BOARD_MODE_ID: BoardModeId = 'quick';

export const getBoardMode = (id: BoardModeId): BoardMode =>
  BOARD_MODES.find((mode) => mode.id === id) ?? BOARD_MODES[0];

export const isPlayableBox = (mode: BoardMode, row: number, column: number): boolean =>
  Boolean(mode.cells[row]?.[column]);

export const getBoardEdges = (mode: BoardMode): BoardEdge[] =>
  getBoardEdgesFromCells(mode.cells);
