import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAudioManager } from './AudioManager';
import {
  BoardEdge,
  BoardMode,
  CpuDifficulty,
  getBoardEdges,
  isPlayableBox,
  OpponentMode,
  StartingPlayerMode,
} from './BoardModes';
import { chooseCpuMove, getCpuMoveDelay } from './GameAI';
import { COLORS } from './theme';

// --- Interfaces (تعريف أنواع البيانات) ---
export interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
}

export interface GameState {
  players: Player[];
  currentPlayer: number;
  horizontalLines: LineState[][];
  verticalLines: LineState[][];
  boxes: (number | null)[][]; // تخزن رقم اللاعب الذي أكمل المربع أو null
  gameOver: boolean;
  endedEarly: boolean;
  moveCount: number;
  boxesCompletedLastMove: number;
}

// --- Constants (الثوابت) ---
const BOARD_TOUCH_PADDING = 14;
const RESULT_DELAY = 1000;

type LineState = number | false | null;

type Edge = BoardEdge & {
  startX: number; startY: number; endX: number; endY: number };
type EdgeDistance = { edge: Edge; distance: number };
type BoardHit = { edge: Edge | null; nearest: EdgeDistance | null;
  second: EdgeDistance | null; result: 'selected' | 'ambiguous' | 'too-far' };
const AMBIGUITY_TOLERANCE = 2;

const mixHexColor = (color: string, target: number, ratio: number) => {
  const normalized = color.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  return `#${channels.map((channel) => Math.round(channel + (target - channel) * ratio)
    .toString(16).padStart(2, '0')).join('')}`;
};

const createCompletedSquareGradient = (color: string) => ({
  center: mixHexColor(color, 0, 0.3),
  base: color,
  edge: mixHexColor(color, 255, 0.3),
});

const distancePointToSegment = (pointX: number, pointY: number,
  startX: number, startY: number, endX: number, endY: number): number => {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((pointX - startX) * dx + (pointY - startY) * dy) / lengthSquared));
  return Math.hypot(pointX - (startX + projection * dx),
    pointY - (startY + projection * dy));
};

const createBoardEdges = (mode: BoardMode, cellSize: number, inset: number): Edge[] =>
  getBoardEdges(mode).map((edge) => ({
    ...edge,
    startX: inset + edge.col * cellSize,
    startY: inset + edge.row * cellSize,
    endX: inset + (edge.col + (edge.type === 'h' ? 1 : 0)) * cellSize,
    endY: inset + (edge.row + (edge.type === 'v' ? 1 : 0)) * cellSize,
  }));

const findBoardEdge = (pointX: number, pointY: number, edges: Edge[], hitRadius: number): BoardHit => {
  let nearest: EdgeDistance | null = null;
  let second: EdgeDistance | null = null;
  for (const edge of edges) {
    const distance = distancePointToSegment(pointX, pointY,
      edge.startX, edge.startY, edge.endX, edge.endY);
    const candidate = { edge, distance };
    if (!nearest || distance < nearest.distance) {
      second = nearest;
      nearest = candidate;
    } else if (!second || distance < second.distance) {
      second = candidate;
    }
  }
  if (!nearest || nearest.distance > hitRadius) return { edge: null, nearest, second, result: 'too-far' };
  if (second && second.distance - nearest.distance <= AMBIGUITY_TOLERANCE) {
    return { edge: null, nearest, second, result: 'ambiguous' };
  }
  return { edge: nearest.edge, nearest, second, result: 'selected' };
};

const isEdgeSelected = (edge: Edge, horizontalLines: GameState['horizontalLines'],
  verticalLines: GameState['verticalLines']): boolean => edge.type === 'h'
  ? horizontalLines[edge.row][edge.col] !== false
  : verticalLines[edge.row][edge.col] !== false;

const isDrawnLine = (line: LineState): line is number => typeof line === 'number';

const getStartingPlayerIndex = (mode: StartingPlayerMode): number => {
  if (mode === 'player1') return 0;
  if (mode === 'player2') return 1;
  return Math.random() < 0.5 ? 0 : 1;
};

const CPU_DIFFICULTY_LABELS: Record<CpuDifficulty, string> = {
  easy: 'سهل',
  balanced: 'متوازن',
  expert: 'خبير',
};

// --- The Main Game Component (المكون الرئيسي للعبة) ---
interface GameProps {
  onBackToHome?: () => void;
  onOpenSettings?: () => void;
  paused?: boolean;
  player1Color?: string;
  player2Color?: string;
  boardMode: BoardMode;
  opponentMode: OpponentMode;
  cpuDifficulty: CpuDifficulty;
  startingPlayer: StartingPlayerMode;
  onGameEnd?: (
    players: {id: number, name: string, score: number, color: string}[],
    endedEarly: boolean,
  ) => void;
}

export const Game: React.FC<GameProps> = ({ 
  onBackToHome, 
  onOpenSettings,
  paused = false,
  player1Color = COLORS.playerRed,
  player2Color = COLORS.playerBlue,
  boardMode,
  opponentMode,
  cpuDifficulty,
  startingPlayer,
  onGameEnd
}) => {
  const { playClickSound, playBoxCompleteSound, playGameOverSound } = useAudioManager();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const completedSquareGradients = useMemo(() => [player1Color, player2Color]
    .map(createCompletedSquareGradient), [player1Color, player2Color]);
  const sidePanelWidth = Math.min(340, Math.max(244,
    Math.min(284, layout.width * 0.36) + Math.max(0, windowWidth - 900) * 0.15,
  ));
  const compactControls = (layout.height || windowHeight) < 600;
  const panelPadding = compactControls ? 12 : 22;
  const layoutGap = compactControls ? 12 : 24;
  const availableBoardWidth = Math.max(0, layout.width - 32 - layoutGap - sidePanelWidth - BOARD_TOUCH_PADDING * 2);
  const availableBoardHeight = Math.max(0, layout.height - 16 - BOARD_TOUCH_PADDING * 2);
  // Reserve enough room for the largest visible dot and edge before fitting square cells.
  const unconstrainedCellSize = Math.max(0, Math.floor(Math.min(
    availableBoardWidth / boardMode.columns,
    availableBoardHeight / boardMode.rows,
  )));
  const insetDotRadius = Math.max(4, Math.min(7, unconstrainedCellSize * 0.1));
  const insetEdgeThickness = Math.max(7, Math.min(13, unconstrainedCellSize * 0.16));
  const BOARD_INSET = Math.ceil(Math.max(insetDotRadius + 3, insetEdgeThickness / 2 + 3));
  const cellSize = Math.max(0, Math.floor(Math.min(
    (availableBoardWidth - BOARD_INSET * 2) / boardMode.columns,
    (availableBoardHeight - BOARD_INSET * 2) / boardMode.rows,
  )));
  const boardWidth = cellSize * boardMode.columns + BOARD_INSET * 2;
  const boardHeight = cellSize * boardMode.rows + BOARD_INSET * 2;
  const lineThickness = Math.max(7, Math.min(13, cellSize * 0.16));
  const dotRadius = Math.max(4, Math.min(7, cellSize * 0.1));
  const completedSquareBorderInset = Math.max(2, lineThickness * 0.45);
  const completedSquareBorderWidth = Math.max(2, lineThickness * 0.28);
  const EDGE_HIT_RADIUS = Math.min(30, Math.max(20, cellSize * 0.32));
  const boardEdges = useMemo(
    () => createBoardEdges(boardMode, cellSize, BOARD_INSET),
    [BOARD_INSET, boardMode, cellSize],
  );
  const controlHeight = layout.height || windowHeight;
  const controlGap = compactControls ? 8 : 16;
  const playerCardHeight = compactControls ? 80 : 108;
  const turnBadgeHeight = compactControls ? 44 : 60;
  const actionHeight = Math.max(44, Math.min(54, controlHeight * 0.12));

  
  // --- State Management (إدارة حالة اللعبة) ---
  const createInitialState = useCallback((): GameState => {
    const horizontalLines: LineState[][] = Array.from(
      { length: boardMode.rows + 1 },
      () => Array(boardMode.columns).fill(null),
    );
    const verticalLines: LineState[][] = Array.from(
      { length: boardMode.rows },
      () => Array(boardMode.columns + 1).fill(null),
    );
    getBoardEdges(boardMode).forEach((edge) => {
      if (edge.type === 'h') horizontalLines[edge.row][edge.col] = false;
      else verticalLines[edge.row][edge.col] = false;
    });

    return {
      players: [
        { id: 1, name: 'اللاعب الأول', score: 0, color: player1Color },
        {
          id: 2,
          name: opponentMode === 'cpu' ? 'الهاتف' : 'اللاعب الثاني',
          score: 0,
          color: player2Color,
        },
      ],
      currentPlayer: getStartingPlayerIndex(startingPlayer),
      horizontalLines,
      verticalLines,
      boxes: Array.from(
        { length: boardMode.rows },
        () => Array(boardMode.columns).fill(null),
      ),
      gameOver: false,
      endedEarly: false,
      moveCount: 0,
      boxesCompletedLastMove: 0,
    };
  }, [boardMode, opponentMode, player1Color, player2Color, startingPlayer]);

  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const gameStateRef = useRef(gameState);
  const moveHandlerRef = useRef<(edge: BoardEdge) => void>(() => undefined);
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameSessionRef = useRef(0);
  const pausedRef = useRef(paused);
  const gameEndNotifiedRef = useRef(false);
  const onGameEndRef = useRef(onGameEnd);
  const playBoxCompleteSoundRef = useRef(playBoxCompleteSound);
  const playGameOverSoundRef = useRef(playGameOverSound);

  gameStateRef.current = gameState;
  pausedRef.current = paused || leaveConfirmationOpen;
  onGameEndRef.current = onGameEnd;
  playBoxCompleteSoundRef.current = playBoxCompleteSound;
  playGameOverSoundRef.current = playGameOverSound;

  const cancelPendingTimers = useCallback(() => {
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }, []);

  // --- Game Logic (منطق اللعبة) ---
  const handleLinePress = useCallback((type: 'h' | 'v', row: number, col: number) => {
    const latestState = gameStateRef.current;
    const line = type === 'h'
      ? latestState.horizontalLines[row]?.[col]
      : latestState.verticalLines[row]?.[col];
    if (pausedRef.current || latestState.gameOver || line !== false) return;

    playClickSound();
    setGameState((previous) => {
      if (pausedRef.current || previous.gameOver) return previous;
      const previousLine = type === 'h'
        ? previous.horizontalLines[row]?.[col]
        : previous.verticalLines[row]?.[col];
      if (previousLine !== false) return previous;

      const newHorizontalLines = previous.horizontalLines.map((lineRow) => [...lineRow]);
      const newVerticalLines = previous.verticalLines.map((lineRow) => [...lineRow]);
      const newBoxes = previous.boxes.map((boxRow) => [...boxRow]);
      const newPlayers = previous.players.map((player) => ({ ...player }));

      if (type === 'h') newHorizontalLines[row][col] = previous.currentPlayer;
      else newVerticalLines[row][col] = previous.currentPlayer;

      let boxesCompleted = 0;
      for (let boxRow = 0; boxRow < boardMode.rows; boxRow++) {
        for (let boxColumn = 0; boxColumn < boardMode.columns; boxColumn++) {
          if (!isPlayableBox(boardMode, boxRow, boxColumn)) continue;
          if (
            newBoxes[boxRow][boxColumn] === null
            && isDrawnLine(newHorizontalLines[boxRow][boxColumn])
            && isDrawnLine(newHorizontalLines[boxRow + 1][boxColumn])
            && isDrawnLine(newVerticalLines[boxRow][boxColumn])
            && isDrawnLine(newVerticalLines[boxRow][boxColumn + 1])
          ) {
            newBoxes[boxRow][boxColumn] = previous.currentPlayer;
            boxesCompleted++;
          }
        }
      }

      let nextPlayer = previous.currentPlayer;
      if (boxesCompleted > 0) {
        newPlayers[previous.currentPlayer].score += boxesCompleted;
      } else {
        nextPlayer = (previous.currentPlayer + 1) % previous.players.length;
      }

      const completedBoxes = newPlayers.reduce((total, player) => total + player.score, 0);
      const remainingBoxes = boardMode.boxCount - completedBoxes;
      const scoreDifference = Math.abs(newPlayers[0].score - newPlayers[1].score);
      const fullBoardComplete = completedBoxes === boardMode.boxCount;
      const endedEarly = boxesCompleted > 0
        && !fullBoardComplete
        && scoreDifference > remainingBoxes;

      return {
        ...previous,
        players: newPlayers,
        currentPlayer: nextPlayer,
        horizontalLines: newHorizontalLines,
        verticalLines: newVerticalLines,
        boxes: newBoxes,
        gameOver: fullBoardComplete || endedEarly,
        endedEarly,
        moveCount: previous.moveCount + 1,
        boxesCompletedLastMove: boxesCompleted,
      };
    });
  }, [boardMode, playClickSound]);

  moveHandlerRef.current = (edge) => handleLinePress(edge.type, edge.row, edge.col);

  const humanInputLocked = paused || leaveConfirmationOpen || gameState.gameOver
    || (opponentMode === 'cpu' && gameState.currentPlayer === 1)
    || isCpuThinking;

  // دالة لمعالجة اللمس على اللوحة
  const handleBoardTouch = (event: any) => {
    if (pausedRef.current || humanInputLocked) return;
    const { locationX, locationY } = event.nativeEvent;
    const hit = findBoardEdge(locationX, locationY, boardEdges, EDGE_HIT_RADIUS);
    const alreadySelected = hit.edge && isEdgeSelected(
      hit.edge,
      gameState.horizontalLines,
      gameState.verticalLines,
    );
    if (hit.edge && !alreadySelected) {
      handleLinePress(hit.edge.type, hit.edge.row, hit.edge.col);
    }
  };

  useEffect(() => {
    if (gameState.boxesCompletedLastMove > 0) {
      playBoxCompleteSoundRef.current();
    }
  }, [gameState.boxesCompletedLastMove, gameState.moveCount]);

  useEffect(() => {
    if (!gameState.gameOver || gameEndNotifiedRef.current) return;
    gameEndNotifiedRef.current = true;
    playGameOverSoundRef.current();
    const session = gameSessionRef.current;
    const finalPlayers = gameStateRef.current.players.map((player) => ({ ...player }));
    const endedEarly = gameStateRef.current.endedEarly;
    resultTimerRef.current = setTimeout(() => {
      if (gameSessionRef.current !== session) return;
      onGameEndRef.current?.(finalPlayers, endedEarly);
    }, RESULT_DELAY);
  }, [gameState.gameOver]);

  useEffect(() => {
    if (
      paused || leaveConfirmationOpen
      || opponentMode !== 'cpu'
      || gameState.gameOver
      || gameState.currentPlayer !== 1
    ) {
      setIsCpuThinking(false);
      return;
    }

    setIsCpuThinking(true);
    let active = true;
    const session = gameSessionRef.current;
    const delay = getCpuMoveDelay(
      cpuDifficulty,
      gameState.boxesCompletedLastMove > 0,
    );
    cpuTimerRef.current = setTimeout(() => {
      if (!active || pausedRef.current || gameSessionRef.current !== session) return;
      cpuTimerRef.current = null;
      const latestState = gameStateRef.current;
      if (latestState.gameOver || latestState.currentPlayer !== 1) return;
      const edge = chooseCpuMove(boardMode, latestState, cpuDifficulty);
      if (edge) {
        moveHandlerRef.current(edge);
      } else {
        setGameState((previous) => previous.gameOver ? previous : {
          ...previous,
          gameOver: true,
          endedEarly: false,
        });
      }
      setIsCpuThinking(false);
    }, delay);

    return () => {
      active = false;
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
    };
  }, [
    boardMode,
    cpuDifficulty,
    gameState.boxesCompletedLastMove,
    gameState.currentPlayer,
    gameState.gameOver,
    gameState.moveCount,
    opponentMode,
    paused,
    leaveConfirmationOpen,
  ]);

  useEffect(() => () => {
    gameSessionRef.current++;
    cancelPendingTimers();
  }, [cancelPendingTimers]);

  const resetGame = () => {
    if (pausedRef.current) return;
    gameSessionRef.current++;
    cancelPendingTimers();
    gameEndNotifiedRef.current = false;
    setIsCpuThinking(false);
    setGameState(createInitialState());
  };

  const leaveGame = useCallback(() => {
    pausedRef.current = true;
    gameSessionRef.current++;
    cancelPendingTimers();
    onBackToHome?.();
  }, [cancelPendingTimers, onBackToHome]);

  const handleBackToHome = useCallback(() => {
    if (pausedRef.current || !onBackToHome) return;
    const latestState = gameStateRef.current;
    if (latestState.moveCount === 0 || latestState.gameOver) {
      leaveGame();
      return;
    }
    // Block input immediately, including an already queued computer move.
    pausedRef.current = true;
    cancelPendingTimers();
    setLeaveConfirmationOpen(true);
  }, [cancelPendingTimers, leaveGame, onBackToHome]);

  const cancelLeaving = () => {
    pausedRef.current = paused;
    setLeaveConfirmationOpen(false);
  };

  useEffect(() => {
    if (!onBackToHome || paused) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackToHome();
      return true;
    });
    return () => subscription.remove();
  }, [handleBackToHome, onBackToHome, paused]);

  const handleOpenSettings = () => {
    if (pausedRef.current || gameStateRef.current.gameOver || !onOpenSettings) return;
    // Block queued input and CPU callbacks before the parent's next render.
    pausedRef.current = true;
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    onOpenSettings();
  };

  const requestResetGame = () => {
    const hasProgress = gameState.horizontalLines.some((row) => row.some(isDrawnLine))
      || gameState.verticalLines.some((row) => row.some(isDrawnLine));

    if (!hasProgress || gameState.gameOver) {
      resetGame();
      return;
    }

    Alert.alert(
      'بدء لعبة جديدة',
      'سيتم حذف تقدم المباراة الحالية.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'بدء جديد', style: 'destructive', onPress: resetGame },
      ],
    );
  };

  // --- Rendering Logic (منطق العرض) ---
  const dots: { id: string; cx: number; cy: number }[] = [];
  const dotMap = new Map<string, { id: string; cx: number; cy: number }>();
  boardEdges.forEach((edge) => {
    const points = edge.type === 'h'
      ? [[edge.row, edge.col], [edge.row, edge.col + 1]]
      : [[edge.row, edge.col], [edge.row + 1, edge.col]];
    points.forEach(([row, col]) => {
      const id = `d-${row}-${col}`;
      dotMap.set(id, {
        id,
        cx: BOARD_INSET + col * cellSize,
        cy: BOARD_INSET + row * cellSize,
      });
    });
  });
  dots.push(...dotMap.values());
  const completedSquares: { id: string; row: number; col: number; playerIndex: number }[] = [];
  gameState.boxes.forEach((row, rowIndex) => row.forEach((playerIndex, colIndex) => {
    if (playerIndex !== null) {
      completedSquares.push({
        id: `b-${rowIndex}-${colIndex}`,
        row: rowIndex,
        col: colIndex,
        playerIndex,
      });
    }
  }));
  const selectedEdges: { id: string; x: number; y: number; horizontal: boolean; color: string }[] = [];
  gameState.horizontalLines.forEach((row, r) => row.forEach((drawn, c) => {
    if (isDrawnLine(drawn)) selectedEdges.push({
      id: `h-${r}-${c}`, x: BOARD_INSET + c * cellSize,
      y: BOARD_INSET + r * cellSize, horizontal: true, color: gameState.players[drawn].color,
    });
  }));
  gameState.verticalLines.forEach((row, r) => row.forEach((drawn, c) => {
    if (isDrawnLine(drawn)) selectedEdges.push({
      id: `v-${r}-${c}`, x: BOARD_INSET + c * cellSize,
      y: BOARD_INSET + r * cellSize, horizontal: false, color: gameState.players[drawn].color,
    });
  }));
  const renderSelectedEdge = (edge: typeof selectedEdges[number], thickness: number, glow: boolean) => (
    <Rect
      key={`${edge.id}-${glow ? 'glow' : 'fill'}`}
      pointerEvents="none"
      x={edge.x - thickness / 2}
      y={edge.y - thickness / 2}
      width={edge.horizontal ? cellSize + thickness : thickness}
      height={edge.horizontal ? thickness : cellSize + thickness}
      rx={thickness / 2}
      ry={thickness / 2}
      fill={edge.color}
      opacity={glow ? 0.18 : 1}
    />
  );
  const isCpuTurn = opponentMode === 'cpu' && gameState.currentPlayer === 1;
  const boardSummary = opponentMode === 'cpu'
    ? `${boardMode.name} · ${boardMode.boxCount} مربع · ${CPU_DIFFICULTY_LABELS[cpuDifficulty]}`
    : `${boardMode.name} · ${boardMode.boxCount} مربع`;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingRight: Math.max(28, Math.min(32, windowWidth * 0.035)) }]}>
    <View style={[styles.screen, { gap: layoutGap }]} onLayout={(event) => {
      const { width, height } = event.nativeEvent.layout;
      setLayout((previous) => previous.width === width && previous.height === height
        ? previous : { width, height });
    }}>
      {/* لوحة اللعب */}
      <View style={[styles.boardArea, { width: boardWidth + BOARD_TOUCH_PADDING * 2 }]}>
      {cellSize > 0 && (
        <View style={[styles.boardContainer, {
          width: boardWidth + BOARD_TOUCH_PADDING * 2,
          height: boardHeight + BOARD_TOUCH_PADDING * 2,
          padding: BOARD_TOUCH_PADDING,
        }]}>
          <View
            collapsable={false}
            style={[styles.boardSurface, { width: boardWidth, height: boardHeight }]}
          >
          <Svg pointerEvents="none" width={boardWidth} height={boardHeight} style={styles.boardSvg}>
          <Defs>
            {completedSquareGradients.map((gradient, playerIndex) => (
              <RadialGradient
                key={`completed-square-gradient-${playerIndex}`}
                id={`completed-square-gradient-${playerIndex}`}
                cx="50%"
                cy="50%"
                r="72%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor={gradient.center} stopOpacity={1} />
                <Stop offset="60%" stopColor={gradient.base} stopOpacity={1} />
                <Stop offset="100%" stopColor={gradient.edge} stopOpacity={1} />
              </RadialGradient>
            ))}
          </Defs>

          <Rect
            pointerEvents="none"
            x={0}
            y={0}
            width={boardWidth}
            height={boardHeight}
            fill={COLORS.board}
          />

          {/* رسم المربعات المكتملة */}
          {completedSquares.map((square) => (
            <Rect
              key={`${square.id}-fill`}
              pointerEvents="none"
              x={BOARD_INSET + square.col * cellSize}
              y={BOARD_INSET + square.row * cellSize}
              width={cellSize}
              height={cellSize}
              fill={`url(#completed-square-gradient-${square.playerIndex})`}
              fillOpacity={1}
            />
          ))}

          {/* إبراز خفيف داخل المربعات المكتملة، أسفل الحواف الأصلية. */}
          {completedSquares.map((square) => (
            <Rect
              key={`${square.id}-highlight`}
              pointerEvents="none"
              x={BOARD_INSET + square.col * cellSize + completedSquareBorderInset}
              y={BOARD_INSET + square.row * cellSize + completedSquareBorderInset}
              width={Math.max(0, cellSize - completedSquareBorderInset * 2)}
              height={Math.max(0, cellSize - completedSquareBorderInset * 2)}
              fill="none"
              stroke={completedSquareGradients[square.playerIndex].edge}
              strokeWidth={completedSquareBorderWidth}
              strokeOpacity={1}
            />
          ))}

          {/* Unselected edges sit below the colored glow and the dots. */}
          {gameState.horizontalLines.map((row, r) => {
            return row.map((drawn, c) => {
              return drawn === false ? (
                <Line
                  key={`h-${r}-${c}`}
                  pointerEvents="none"
                  x1={BOARD_INSET + c * cellSize}
                  y1={BOARD_INSET + r * cellSize}
                  x2={BOARD_INSET + (c + 1) * cellSize}
                  y2={BOARD_INSET + r * cellSize}
                  stroke={COLORS.neutralLine}
                  strokeWidth={lineThickness}
                  strokeLinecap="round"
                />
              ) : null;
            });
          })}

          {gameState.verticalLines.map((row, r) => {
            return row.map((drawn, c) => {
              return drawn === false ? (
                <Line
                  key={`v-${r}-${c}`}
                  pointerEvents="none"
                  x1={BOARD_INSET + c * cellSize}
                  y1={BOARD_INSET + r * cellSize}
                  x2={BOARD_INSET + c * cellSize}
                  y2={BOARD_INSET + (r + 1) * cellSize}
                  stroke={COLORS.neutralLine}
                  strokeWidth={lineThickness}
                  strokeLinecap="round"
                />
              ) : null;
            });
          })}
          {selectedEdges.map(edge => renderSelectedEdge(edge, lineThickness + 6, true))}
          {selectedEdges.map(edge => renderSelectedEdge(edge, lineThickness, false))}

          {/* رسم النقاط */}
          {dots.map(dot => (
            <Circle key={dot.id} pointerEvents="none" cx={dot.cx} cy={dot.cy} r={dotRadius} fill={COLORS.text} />
          ))}
        </Svg>
          <Pressable
            onPressIn={handleBoardTouch}
            disabled={humanInputLocked}
            style={[styles.boardTouchOverlay, { width: boardWidth, height: boardHeight }]}
          />
          </View>
        </View>
      )}
      </View>

      <View style={[styles.sidePanel, { width: sidePanelWidth, gap: controlGap, padding: panelPadding }]}>
        <Text style={[styles.boardSummary, compactControls && styles.compactSummary]} numberOfLines={2}>{boardSummary}</Text>
        <View style={[
          styles.turnBadge,
          {
            minHeight: turnBadgeHeight,
            borderColor: gameState.players[gameState.currentPlayer].color,
            backgroundColor: gameState.players[gameState.currentPlayer].color + '24',
          },
        ]}>
          <View style={[
            styles.turnColorIndicator,
            { backgroundColor: gameState.players[gameState.currentPlayer].color },
          ]} />
          <Text style={[styles.turnText, compactControls && styles.compactTurnText]} numberOfLines={1}>
            {paused
              ? 'المباراة متوقفة'
              : isCpuTurn && !gameState.gameOver
              ? 'الهاتف يفكر...'
              : `دور ${gameState.players[gameState.currentPlayer].name}`}
          </Text>
        </View>
        <View style={[styles.playersInfo, { gap: controlGap }]}>
          {gameState.players.map((player, index) => (
            <View key={player.id} style={[
              styles.playerCard,
              {
                minHeight: playerCardHeight,
                borderColor: gameState.currentPlayer === index ? player.color : '#334155',
                backgroundColor: gameState.currentPlayer === index ? player.color + '18' : COLORS.board,
              },
              gameState.currentPlayer === index && styles.currentPlayer,
            ]}>
              <View style={styles.playerIdentity}>
                <View style={[styles.playerColorIndicator, { backgroundColor: player.color }]} />
                <Text style={[styles.playerName, compactControls && styles.compactPlayerName]} numberOfLines={2}>
                  {player.name}
                </Text>
              </View>
              <Text style={[styles.playerScore, compactControls && styles.compactScore]}>{player.score}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.resetButton, { minHeight: actionHeight }]} onPress={requestResetGame}>
          <Text style={[styles.resetButtonText, compactControls && styles.compactActionText]}>إعادة المباراة</Text>
        </TouchableOpacity>
        <View style={styles.topActions}>
          {onBackToHome && (
            <TouchableOpacity
              style={styles.topActionButton}
              onPress={handleBackToHome}
              accessibilityRole="button"
              accessibilityLabel="العودة إلى الرئيسية"
            >
              <Text style={styles.topActionText}>⌂ الرئيسية</Text>
            </TouchableOpacity>
          )}
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.topActionButton}
              onPress={handleOpenSettings}
              disabled={paused || gameState.gameOver}
              accessibilityRole="button"
              accessibilityLabel="فتح الإعدادات"
            >
              <Text style={styles.topActionText}>⚙ الإعدادات</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
    <Modal
      visible={leaveConfirmationOpen}
      transparent
      animationType="fade"
      supportedOrientations={['landscape-left', 'landscape-right']}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={cancelLeaving}
    >
      <View style={styles.confirmationBackdrop}>
        <View style={styles.confirmationCard} accessibilityViewIsModal>
          <Text style={styles.confirmationTitle} accessibilityRole="header">مغادرة المباراة؟</Text>
          <Text style={styles.confirmationMessage}>المباراة ما زالت جارية. إذا غادرت الآن، ستفقد تقدم هذه المباراة.</Text>
          <View style={styles.confirmationActions}>
            <TouchableOpacity accessibilityRole="button" style={[styles.confirmationButton, styles.stayButton]} onPress={cancelLeaving}>
              <Text style={styles.resetButtonText}>متابعة اللعب</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={[styles.confirmationButton, styles.leaveButton]} onPress={leaveGame}>
              <Text style={styles.resetButtonText}>مغادرة المباراة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
};

// --- Styles (الأنماط) ---
const styles = StyleSheet.create({
  confirmationBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 8, 22, 0.85)',
    padding: 20,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    gap: 16,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  confirmationTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  confirmationMessage: { color: COLORS.text, fontSize: 16, lineHeight: 25, textAlign: 'right', writingDirection: 'rtl' },
  confirmationActions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  confirmationButton: { flexGrow: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stayButton: { backgroundColor: COLORS.emerald },
  leaveButton: { backgroundColor: COLORS.danger },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    direction: 'ltr',
  },
  boardArea: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePanel: {
    flexShrink: 0,
    alignSelf: 'center',
    backgroundColor: COLORS.panel,
    borderColor: '#2B354D',
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  topActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  topActionButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.board,
    borderColor: COLORS.neutralLine,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  topActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  compactSummary: { fontSize: 13 },
  boardSummary: {
    color: COLORS.gold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  playersInfo: {
    flexDirection: 'row-reverse',
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.board,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentPlayer: {
    borderWidth: 2,
  },
  playerColorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  playerIdentity: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playerName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  playerScore: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
  },
  compactScore: { fontSize: 28 },
  compactPlayerName: { fontSize: 13 },
  turnBadge: {
    flexDirection: 'row-reverse',
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  turnColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: COLORS.text,
    borderWidth: 1,
  },
  turnText: {
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  compactTurnText: { fontSize: 15 },
  boardContainer: {
    backgroundColor: COLORS.board,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#353941',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  boardSurface: {
    direction: 'ltr',
  },
  boardSvg: {
    overflow: 'visible',
  },
  boardTouchOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  resetButton: {
    backgroundColor: COLORS.board,
    borderColor: COLORS.gold,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  compactActionText: { fontSize: 14 },
});
