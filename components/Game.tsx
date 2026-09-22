import React, { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAudioManager } from './AudioManager';
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
  horizontalLines: (number | false)[][]; // تخزن رقم اللاعب الذي رسم الخط أو false إذا لم يُرسم
  verticalLines: (number | false)[][];     // تخزن رقم اللاعب الذي رسم الخط أو false إذا لم يُرسم
  boxes: (number | null)[][]; // تخزن رقم اللاعب الذي أكمل المربع أو null
  gameOver: boolean;
}

// --- Constants (الثوابت) ---
const BOX_COLUMNS = 7;
const BOX_ROWS = 5;
const TOTAL_BOXES = BOX_COLUMNS * BOX_ROWS;
const BOARD_TOUCH_PADDING = 14;

type Edge = { type: 'h' | 'v'; row: number; col: number; key: string;
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

const createBoardEdges = (cellSize: number, inset: number): Edge[] => {
  const edges: Edge[] = [];
  for (let row = 0; row <= BOX_ROWS; row++) {
    for (let col = 0; col < BOX_COLUMNS; col++) {
      edges.push({ type: 'h', row, col, key: `h-${row}-${col}`,
        startX: inset + col * cellSize, startY: inset + row * cellSize,
        endX: inset + (col + 1) * cellSize, endY: inset + row * cellSize });
    }
  }
  for (let row = 0; row < BOX_ROWS; row++) {
    for (let col = 0; col <= BOX_COLUMNS; col++) {
      edges.push({ type: 'v', row, col, key: `v-${row}-${col}`,
        startX: inset + col * cellSize, startY: inset + row * cellSize,
        endX: inset + col * cellSize, endY: inset + (row + 1) * cellSize });
    }
  }
  return edges;
};

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

// --- The Main Game Component (المكون الرئيسي للعبة) ---
interface GameProps {
  onBackToHome?: () => void;
  onOpenSettings?: () => void;
  player1Color?: string;
  player2Color?: string;
  onGameEnd?: (
    players: {id: number, name: string, score: number, color: string}[],
    endedEarly: boolean,
  ) => void;
}

export const Game: React.FC<GameProps> = ({ 
  onBackToHome, 
  onOpenSettings,
  player1Color = COLORS.playerRed,
  player2Color = COLORS.playerBlue,
  onGameEnd
}) => {
  const { playClickSound, playBoxCompleteSound, playGameOverSound } = useAudioManager();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const completedSquareGradients = useMemo(() => [player1Color, player2Color]
    .map(createCompletedSquareGradient), [player1Color, player2Color]);
  const sidePanelWidth = Math.min(340, Math.max(228,
    Math.min(284, layout.width * 0.36) + Math.max(0, windowWidth - 900) * 0.15,
  ));
  const availableBoardWidth = Math.max(0, layout.width - 32 - 8 - sidePanelWidth - BOARD_TOUCH_PADDING * 2);
  const availableBoardHeight = Math.max(0, layout.height - 16 - BOARD_TOUCH_PADDING * 2);
  // Reserve enough room for the largest visible dot and edge before fitting square cells.
  const unconstrainedCellSize = Math.max(0, Math.floor(Math.min(
    availableBoardWidth / BOX_COLUMNS,
    availableBoardHeight / BOX_ROWS,
  )));
  const insetDotRadius = Math.max(4, Math.min(7, unconstrainedCellSize * 0.1));
  const insetEdgeThickness = Math.max(7, Math.min(13, unconstrainedCellSize * 0.16));
  const BOARD_INSET = Math.ceil(Math.max(insetDotRadius + 3, insetEdgeThickness / 2 + 3));
  const cellSize = Math.max(0, Math.floor(Math.min(
    (availableBoardWidth - BOARD_INSET * 2) / BOX_COLUMNS,
    (availableBoardHeight - BOARD_INSET * 2) / BOX_ROWS,
  )));
  const boardWidth = cellSize * BOX_COLUMNS + BOARD_INSET * 2;
  const boardHeight = cellSize * BOX_ROWS + BOARD_INSET * 2;
  const lineThickness = Math.max(7, Math.min(13, cellSize * 0.16));
  const dotRadius = Math.max(4, Math.min(7, cellSize * 0.1));
  const completedSquareBorderInset = Math.max(2, lineThickness * 0.45);
  const completedSquareBorderWidth = Math.max(2, lineThickness * 0.28);
  const EDGE_HIT_RADIUS = Math.min(30, Math.max(20, cellSize * 0.32));
  const boardEdges = createBoardEdges(cellSize, BOARD_INSET);
  const controlHeight = layout.height || windowHeight;
  const controlGap = Math.max(5, Math.min(14, controlHeight * 0.02));
  const playerCardHeight = Math.max(64, Math.min(78, controlHeight * 0.17));
  const turnBadgeHeight = Math.max(42, Math.min(58, controlHeight * 0.12));
  const actionHeight = Math.max(44, Math.min(54, controlHeight * 0.12));
  const compactControls = controlHeight < 410;
  
  // --- State Management (إدارة حالة اللعبة) ---
  const createInitialState = (): GameState => ({
    players: [
      { id: 1, name: 'اللاعب الأول', score: 0, color: player1Color },
      { id: 2, name: 'اللاعب الثاني', score: 0, color: player2Color }
    ],
    currentPlayer: 0,
    horizontalLines: Array(BOX_ROWS + 1).fill(null).map(() => Array(BOX_COLUMNS).fill(false)),
    verticalLines: Array(BOX_ROWS).fill(null).map(() => Array(BOX_COLUMNS + 1).fill(false)),
    boxes: Array(BOX_ROWS).fill(null).map(() => Array(BOX_COLUMNS).fill(null)),
    gameOver: false,
  });

  const [gameState, setGameState] = useState<GameState>(createInitialState());

  // دالة لمعالجة اللمس على اللوحة
  const handleBoardTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const hit = findBoardEdge(locationX, locationY, boardEdges, EDGE_HIT_RADIUS);
    const alreadySelected = hit.edge && isEdgeSelected(hit.edge,
      gameState.horizontalLines, gameState.verticalLines);
    if (hit.edge && !alreadySelected && !gameState.gameOver) {
      handleLinePress(hit.edge.type, hit.edge.row, hit.edge.col);
    }
  };

  // --- Game Logic (منطق اللعبة) ---
  const handleLinePress = (type: 'h' | 'v', row: number, col: number) => {
    if (gameState.gameOver) return;
    
    // تشغيل صوت النقر
    playClickSound();

    setGameState(prev => {
      // التأكد من أن الخط لم يتم رسمه من قبل
      if ((type === 'h' && prev.horizontalLines[row][col] !== false) ||
          (type === 'v' && prev.verticalLines[row][col] !== false)) {
        return prev;
      }

      // إنشاء نسخ جديدة من المصفوفات لضمان عدم تعديل الحالة مباشرة (Immutability)
      const newHorizontalLines = prev.horizontalLines.map(r => [...r]);
      const newVerticalLines = prev.verticalLines.map(r => [...r]);
      const newBoxes = prev.boxes.map(r => [...r]);
      const newPlayers = prev.players.map(p => ({ ...p }));

      // عند رسم الخط، نخزن رقم اللاعب بدلاً من القيمة true
      if (type === 'h') {
        newHorizontalLines[row][col] = prev.currentPlayer;
      } else {
        newVerticalLines[row][col] = prev.currentPlayer;
      }

      // التحقق من إكمال المربعات
      let boxesCompleted = 0;
      for (let r = 0; r < BOX_ROWS; r++) {
        for (let c = 0; c < BOX_COLUMNS; c++) {
          if (
            newBoxes[r][c] === null && // إذا لم يكن المربع مملوكًا بالفعل
            newHorizontalLines[r][c] !== false &&
            newHorizontalLines[r + 1][c] !== false &&
            newVerticalLines[r][c] !== false &&
            newVerticalLines[r][c + 1] !== false
          ) {
            newBoxes[r][c] = prev.currentPlayer;
            boxesCompleted++;
          }
        }
      }
      
      let nextPlayer = prev.currentPlayer;
      if (boxesCompleted > 0) {
        // تحديث النقاط، ويبقى دور اللاعب الحالي
        newPlayers[prev.currentPlayer].score += boxesCompleted;
        // تشغيل صوت إكمال المربع
        playBoxCompleteSound();
      } else {
        // انتقال الدور إلى اللاعب التالي
        nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      }

      // التحقق من نهاية اللعبة بعد احتساب كامل نقاط الحركة الحالية.
      const completedBoxes = newPlayers[0].score + newPlayers[1].score;
      const remainingBoxes = TOTAL_BOXES - completedBoxes;
      const scoreDifference = Math.abs(newPlayers[0].score - newPlayers[1].score);
      const fullBoardComplete = completedBoxes === TOTAL_BOXES;
      const endedEarly = boxesCompleted > 0
        && !fullBoardComplete
        && scoreDifference > remainingBoxes;
      const gameOver = fullBoardComplete || endedEarly;

      // إذا انتهت اللعبة، استدعاء دالة onGameEnd
      if (gameOver && onGameEnd) {
        // تشغيل صوت نهاية اللعبة
        playGameOverSound();
        setTimeout(() => {
          onGameEnd(newPlayers, endedEarly);
        }, endedEarly ? 0 : 1000); // الحسم المبكر فوري، والنهاية العادية تحتفظ بالتأخير الحالي.
      }

      return {
        ...prev,
        players: newPlayers,
        currentPlayer: nextPlayer,
        horizontalLines: newHorizontalLines,
        verticalLines: newVerticalLines,
        boxes: newBoxes,
        gameOver: gameOver,
      };
    });
  };

  const resetGame = () => {
    setGameState(createInitialState());
  };

  const requestResetGame = () => {
    const hasProgress = gameState.horizontalLines.some((row) => row.some((edge) => edge !== false))
      || gameState.verticalLines.some((row) => row.some((edge) => edge !== false));

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
  for (let row = 0; row <= BOX_ROWS; row++) {
    for (let col = 0; col <= BOX_COLUMNS; col++) {
      dots.push({
        id: `d-${row}-${col}`,
        cx: BOARD_INSET + col * cellSize,
        cy: BOARD_INSET + row * cellSize,
      });
    }
  }
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
    if (drawn !== false) selectedEdges.push({
      id: `h-${r}-${c}`, x: BOARD_INSET + c * cellSize,
      y: BOARD_INSET + r * cellSize, horizontal: true, color: gameState.players[drawn].color,
    });
  }));
  gameState.verticalLines.forEach((row, r) => row.forEach((drawn, c) => {
    if (drawn !== false) selectedEdges.push({
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

  return (
    <SafeAreaView style={[styles.safeArea, { paddingRight: Math.max(28, Math.min(32, windowWidth * 0.035)) }]}>
    <View style={styles.screen} onLayout={(event) => {
      const { width, height } = event.nativeEvent.layout;
      setLayout((previous) => previous.width === width && previous.height === height
        ? previous : { width, height });
    }}>
      {/* لوحة اللعب */}
      <View style={styles.boardArea}>
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
            style={[styles.boardTouchOverlay, { width: boardWidth, height: boardHeight }]}
          />
          </View>
        </View>
      )}
      </View>

      <View style={[styles.sidePanel, { width: sidePanelWidth, gap: controlGap }]}>
        <View style={styles.topActions}>
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.topActionButton}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="فتح الإعدادات"
            >
              <Text style={styles.topActionText}>⚙ الإعدادات</Text>
            </TouchableOpacity>
          )}
          {onBackToHome && (
            <TouchableOpacity
              style={styles.topActionButton}
              onPress={onBackToHome}
              accessibilityRole="button"
              accessibilityLabel="العودة إلى الرئيسية"
            >
              <Text style={styles.topActionText}>⌂ الرئيسية</Text>
            </TouchableOpacity>
          )}
        </View>
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
            دور {gameState.players[gameState.currentPlayer].name}
          </Text>
        </View>
        <View style={[styles.playersInfo, { gap: controlGap }]}>
          {gameState.players.map((player, index) => (
            <View key={player.id} style={[
              styles.playerCard,
              {
                minHeight: playerCardHeight,
                borderColor: player.color,
              },
              gameState.currentPlayer === index && styles.currentPlayer,
            ]}>
              <View style={styles.playerIdentity}>
                <View style={[styles.playerColorIndicator, { backgroundColor: player.color }]} />
                <Text style={[styles.playerName, compactControls && styles.compactPlayerName]} numberOfLines={1}>
                  اللاعب {index + 1}
                </Text>
              </View>
              <Text style={[styles.playerScore, compactControls && styles.compactScore]}>{player.score}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.resetButton, { minHeight: actionHeight }]} onPress={requestResetGame}>
          <Text style={[styles.resetButtonText, compactControls && styles.compactActionText]}>لعبة جديدة</Text>
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

// --- Styles (الأنماط) ---
const styles = StyleSheet.create({
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
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePanel: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: COLORS.panel,
    borderColor: '#2B354D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  topActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  topActionButton: {
    flex: 1,
    minHeight: 42,
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
  playersInfo: {
    flexDirection: 'row',
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
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.mutedText,
    writingDirection: 'rtl',
  },
  playerScore: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
  },
  compactScore: { fontSize: 24 },
  compactPlayerName: { fontSize: 12 },
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  compactTurnText: { fontSize: 14 },
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
