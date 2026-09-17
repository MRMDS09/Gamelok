import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { useAudioManager } from './AudioManager';

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
  player1Color?: string;
  player2Color?: string;
  onGameEnd?: (players: {id: number, name: string, score: number, color: string}[]) => void;
}

export const Game: React.FC<GameProps> = ({ 
  onBackToHome, 
  player1Color = '#d32f2f', 
  player2Color = '#1976d2',
  onGameEnd
}) => {
  const { playClickSound, playBoxCompleteSound, playGameOverSound } = useAudioManager();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const sidePanelWidth = Math.min(380, Math.max(220,
    Math.min(300, layout.width * 0.38) + Math.max(0, windowWidth - 900) * 0.2,
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
  const EDGE_HIT_RADIUS = Math.min(30, Math.max(20, cellSize * 0.32));
  const boardEdges = createBoardEdges(cellSize, BOARD_INSET);
  const controlHeight = layout.height || windowHeight;
  const controlGap = Math.max(5, Math.min(14, controlHeight * 0.02));
  const playerCardHeight = Math.max(56, Math.min(84, controlHeight * 0.18));
  const turnBadgeHeight = Math.max(42, Math.min(58, controlHeight * 0.12));
  const actionHeight = Math.max(48, Math.min(68, controlHeight * 0.14));
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

      // التحقق من نهاية اللعبة
      const totalScore = newPlayers.reduce((sum, player) => sum + player.score, 0);
      const gameOver = totalScore === TOTAL_BOXES;

      // إذا انتهت اللعبة، استدعاء دالة onGameEnd
      if (gameOver && onGameEnd) {
        // تشغيل صوت نهاية اللعبة
        playGameOverSound();
        setTimeout(() => {
          onGameEnd(newPlayers);
        }, 1000); // تأخير قصير لإظهار النتيجة النهائية
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
          {/* رسم المربعات المكتملة */}
          {gameState.boxes.map((row, r) =>
            row.map((playerIndex, c) => {
              if (playerIndex !== null) {
                const player = gameState.players[playerIndex];
                return (
                  <Rect
                    key={`b-${r}-${c}`}
                    pointerEvents="none"
                    x={BOARD_INSET + c * cellSize}
                    y={BOARD_INSET + r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={player.color}
                    opacity={0.3}
                  />
                );
              }
              return null;
            })
          )}

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
                  stroke="#ddd"
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
                  stroke="#ddd"
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
            <Circle key={dot.id} pointerEvents="none" cx={dot.cx} cy={dot.cy} r={dotRadius} fill="#333" />
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
        <View style={[styles.playersInfo, { gap: controlGap }]}>
          {gameState.players.map((player, index) => (
            <View key={player.id} style={[
              styles.playerCard,
              {
                minHeight: playerCardHeight,
                backgroundColor: index === 0 ? 'rgba(8, 34, 70, 0.88)' : 'rgba(36, 22, 76, 0.88)',
                borderColor: index === 0 ? '#22D3EE' : '#8B5CF6',
                shadowColor: index === 0 ? '#22D3EE' : '#8B5CF6',
              },
              gameState.currentPlayer === index && styles.currentPlayer,
            ]}>
              <Text style={[styles.playerScore, compactControls && styles.compactScore]}>{player.score}</Text>
              <View style={styles.playerSeparator} />
              <Text style={[styles.playerName, compactControls && styles.compactPlayerName]} numberOfLines={1}>{player.name}</Text>
              <View style={[styles.playerColorIndicator, { backgroundColor: player.color }]} />
            </View>
          ))}
        </View>
        <View style={[styles.turnBadge, { minHeight: turnBadgeHeight }]}>
          <Text style={[styles.turnText, compactControls && styles.compactTurnText]} numberOfLines={1}>
            دور {gameState.players[gameState.currentPlayer].name}
          </Text>
        </View>
        {gameState.gameOver && (
          <Text style={styles.gameOverText}>انتهت اللعبة!</Text>
        )}
        <TouchableOpacity style={[styles.resetButton, { minHeight: actionHeight }]} onPress={resetGame}>
          <Text style={[styles.resetButtonText, compactControls && styles.compactActionText]}>لعبة جديدة</Text>
        </TouchableOpacity>
        {onBackToHome && (
          <TouchableOpacity style={[styles.backButton, { minHeight: actionHeight }]} onPress={onBackToHome}>
            <Text style={[styles.backButtonText, compactControls && styles.compactActionText]}>← الرئيسية</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    </SafeAreaView>
  );
};

// --- Styles (الأنماط) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 24,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 7,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  playersInfo: {},
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 12,
    elevation: 7,
  },
  currentPlayer: {
    shadowOpacity: 0.48,
    elevation: 10,
  },
  playerColorIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playerSeparator: { width: 1, height: 28, backgroundColor: 'rgba(222, 238, 255, 0.35)', marginHorizontal: 16 },
  playerName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  playerScore: {
    minWidth: 34,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  compactScore: { fontSize: 24 },
  compactPlayerName: { fontSize: 17 },
  turnBadge: { backgroundColor: '#22C55E', borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 10, elevation: 6 },
  turnText: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', writingDirection: 'rtl', paddingHorizontal: 12 },
  compactTurnText: { fontSize: 17 },
  boardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#06112F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
  gameOverText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB06C',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#FF6B1A',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#FF6B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  compactActionText: { fontSize: 16 },
});
