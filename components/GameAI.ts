import { BoardEdge, BoardMode, CpuDifficulty, getBoardEdges, isPlayableBox } from './BoardModes';

type LineState = number | false | null;

export interface CpuBoardState {
  horizontalLines: LineState[][];
  verticalLines: LineState[][];
  boxes: (number | null)[][];
}

type EvaluatedMove = {
  edge: BoardEdge;
  completed: number;
  opportunities: number;
};

const isDrawnLine = (line: LineState): line is number => typeof line === 'number';

const chooseRandom = <T,>(items: readonly T[]): T | null =>
  items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;

const getLegalEdges = (mode: BoardMode, state: CpuBoardState): BoardEdge[] =>
  getBoardEdges(mode).filter((edge) => (
    edge.type === 'h'
      ? state.horizontalLines[edge.row]?.[edge.col] === false
      : state.verticalLines[edge.row]?.[edge.col] === false
  ));

const cloneLinesWithMove = (
  state: CpuBoardState,
  edge: BoardEdge,
  playerIndex: number,
) => {
  const horizontalLines = state.horizontalLines.map((row) => [...row]);
  const verticalLines = state.verticalLines.map((row) => [...row]);
  if (edge.type === 'h') horizontalLines[edge.row][edge.col] = playerIndex;
  else verticalLines[edge.row][edge.col] = playerIndex;
  return { horizontalLines, verticalLines };
};

const getCompletedBoxCoordinates = (
  mode: BoardMode,
  state: CpuBoardState,
  horizontalLines: LineState[][],
  verticalLines: LineState[][],
): { row: number; column: number }[] => {
  const completed: { row: number; column: number }[] = [];
  for (let row = 0; row < mode.rows; row++) {
    for (let column = 0; column < mode.columns; column++) {
      if (!isPlayableBox(mode, row, column) || state.boxes[row][column] !== null) continue;
      if (
        isDrawnLine(horizontalLines[row][column])
        && isDrawnLine(horizontalLines[row + 1][column])
        && isDrawnLine(verticalLines[row][column])
        && isDrawnLine(verticalLines[row][column + 1])
      ) completed.push({ row, column });
    }
  }
  return completed;
};

const countReadyBoxes = (
  mode: BoardMode,
  state: CpuBoardState,
  horizontalLines: LineState[][],
  verticalLines: LineState[][],
): number => {
  let ready = 0;
  for (let row = 0; row < mode.rows; row++) {
    for (let column = 0; column < mode.columns; column++) {
      if (!isPlayableBox(mode, row, column) || state.boxes[row][column] !== null) continue;
      const drawnSides = [
        horizontalLines[row][column],
        horizontalLines[row + 1][column],
        verticalLines[row][column],
        verticalLines[row][column + 1],
      ].filter(isDrawnLine).length;
      if (drawnSides === 3) ready++;
    }
  }
  return ready;
};

const evaluateMoves = (mode: BoardMode, state: CpuBoardState): EvaluatedMove[] =>
  getLegalEdges(mode, state).map((edge) => {
    const lines = cloneLinesWithMove(state, edge, 1);
    return {
      edge,
      completed: getCompletedBoxCoordinates(
        mode,
        state,
        lines.horizontalLines,
        lines.verticalLines,
      ).length,
      opportunities: countReadyBoxes(
        mode,
        state,
        lines.horizontalLines,
        lines.verticalLines,
      ),
    };
  });

const applySimulatedMove = (
  mode: BoardMode,
  state: CpuBoardState,
  edge: BoardEdge,
  playerIndex: number,
): { state: CpuBoardState; completed: number } => {
  const lines = cloneLinesWithMove(state, edge, playerIndex);
  const completedBoxes = getCompletedBoxCoordinates(
    mode,
    state,
    lines.horizontalLines,
    lines.verticalLines,
  );
  const boxes = state.boxes.map((row) => [...row]);
  completedBoxes.forEach(({ row, column }) => {
    boxes[row][column] = playerIndex;
  });
  return {
    state: { ...lines, boxes },
    completed: completedBoxes.length,
  };
};

const chooseBestCompletion = (moves: EvaluatedMove[]): BoardEdge | null => {
  const bestCompletion = Math.max(...moves.map((candidate) => candidate.completed));
  if (bestCompletion <= 0) return null;
  return chooseRandom(
    moves.filter((candidate) => candidate.completed === bestCompletion),
  )?.edge ?? null;
};

const chooseBalancedMove = (moves: EvaluatedMove[]): BoardEdge | null => {
  const completion = chooseBestCompletion(moves);
  if (completion) return completion;

  const safeMoves = moves.filter((candidate) => candidate.opportunities === 0);
  if (safeMoves.length > 0) return chooseRandom(safeMoves)?.edge ?? null;

  const fewestOpportunities = Math.min(...moves.map((candidate) => candidate.opportunities));
  return chooseRandom(
    moves.filter((candidate) => candidate.opportunities === fewestOpportunities),
  )?.edge ?? null;
};

const estimateOpponentCaptureChain = (
  mode: BoardMode,
  state: CpuBoardState,
  sacrifice: BoardEdge,
): number => {
  let simulation = applySimulatedMove(mode, state, sacrifice, 1).state;
  let captured = 0;

  // A chain cannot contain more captures than the board contains boxes.
  for (let step = 0; step < mode.boxCount; step++) {
    const captures = evaluateMoves(mode, simulation).filter((candidate) => candidate.completed > 0);
    if (captures.length === 0) break;
    const best = Math.max(...captures.map((candidate) => candidate.completed));
    const next = chooseRandom(captures.filter((candidate) => candidate.completed === best));
    if (!next) break;
    const result = applySimulatedMove(mode, simulation, next.edge, 0);
    simulation = result.state;
    captured += result.completed;
  }

  return captured;
};

const chooseExpertMove = (
  mode: BoardMode,
  state: CpuBoardState,
  moves: EvaluatedMove[],
): BoardEdge | null => {
  const completion = chooseBestCompletion(moves);
  if (completion) return completion;

  const safeMoves = moves.filter((candidate) => candidate.opportunities === 0);
  if (safeMoves.length > 0) return chooseRandom(safeMoves)?.edge ?? null;

  const sacrifices = moves.map((candidate) => ({
    ...candidate,
    chainCost: estimateOpponentCaptureChain(mode, state, candidate.edge),
  }));
  const smallestChain = Math.min(...sacrifices.map((candidate) => candidate.chainCost));
  const bestChains = sacrifices.filter((candidate) => candidate.chainCost === smallestChain);
  const fewestOpportunities = Math.min(...bestChains.map((candidate) => candidate.opportunities));
  return chooseRandom(
    bestChains.filter((candidate) => candidate.opportunities === fewestOpportunities),
  )?.edge ?? null;
};

export const chooseCpuMove = (
  mode: BoardMode,
  state: CpuBoardState,
  difficulty: CpuDifficulty,
): BoardEdge | null => {
  const moves = evaluateMoves(mode, state);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    const scoringMoves = moves.filter((candidate) => candidate.completed > 0);
    const captureChance = 0.65 + Math.random() * 0.05;
    if (scoringMoves.length > 0 && Math.random() < captureChance) {
      return chooseBestCompletion(scoringMoves);
    }
    const nonScoringMoves = moves.filter((candidate) => candidate.completed === 0);
    return chooseRandom(nonScoringMoves.length > 0 ? nonScoringMoves : moves)?.edge ?? null;
  }

  if (difficulty === 'expert') return chooseExpertMove(mode, state, moves);
  return chooseBalancedMove(moves);
};

const CPU_DELAYS: Record<CpuDifficulty, {
  normal: readonly [number, number];
  consecutive: readonly [number, number];
}> = {
  easy: { normal: [900, 1300], consecutive: [650, 900] },
  balanced: { normal: [1200, 1700], consecutive: [750, 1050] },
  expert: { normal: [1500, 2200], consecutive: [900, 1250] },
};

export const getCpuMoveDelay = (difficulty: CpuDifficulty, consecutive: boolean): number => {
  const [minimum, maximum] = CPU_DELAYS[difficulty][consecutive ? 'consecutive' : 'normal'];
  return Math.round(minimum + Math.random() * (maximum - minimum));
};
