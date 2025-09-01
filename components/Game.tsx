import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

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
const { width: screenWidth } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenWidth - 40, 400);
const GRID_SIZE = 4; // 4x4 مربعات
const DOT_RADIUS = 5;
const LINE_THICKNESS = 6;
const TOUCHABLE_LINE_WIDTH = 20; // منطقة لمس أكبر للخطوط

// --- The Main Game Component (المكون الرئيسي للعبة) ---
export const Game: React.FC = () => {
  // --- State Management (إدارة حالة اللعبة) ---
  const createInitialState = (): GameState => ({
    players: [
      { id: 1, name: 'اللاعب الأول', score: 0, color: '#d32f2f' },
      { id: 2, name: 'اللاعب الثاني', score: 0, color: '#1976d2' }
    ],
    currentPlayer: 0,
    horizontalLines: Array(GRID_SIZE + 1).fill(null).map(() => Array(GRID_SIZE).fill(false)),
    verticalLines: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE + 1).fill(false)),
    boxes: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    gameOver: false,
  });

  const [gameState, setGameState] = useState<GameState>(createInitialState());

  // --- Game Logic (منطق اللعبة) ---
  const handleLinePress = useCallback((type: 'h' | 'v', row: number, col: number) => {
    if (gameState.gameOver) return;

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
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
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
      } else {
        // انتقال الدور إلى اللاعب التالي
        nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      }

      // التحقق من نهاية اللعبة
      const totalBoxes = GRID_SIZE * GRID_SIZE;
      const totalScore = newPlayers.reduce((sum, player) => sum + player.score, 0);
      const gameOver = totalScore === totalBoxes;

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
  }, [gameState.gameOver, gameState.players]);

  const resetGame = useCallback(() => {
    setGameState(createInitialState());
  }, []);

  // --- Rendering Logic (منطق العرض) ---
  const dotSpacing = BOARD_SIZE / GRID_SIZE;
  const dots: { id: string; cx: number; cy: number }[] = [];
  for (let row = 0; row <= GRID_SIZE; row++) {
    for (let col = 0; col <= GRID_SIZE; col++) {
      dots.push({
        id: `d-${row}-${col}`,
        cx: col * dotSpacing,
        cy: row * dotSpacing,
      });
    }
  }

  return (
    <View style={styles.screen}>
      {/* عرض معلومات اللاعبين */}
      <View style={styles.playersInfo}>
        {gameState.players.map((player, index) => (
          <View key={player.id} style={[styles.playerCard, gameState.currentPlayer === index && styles.currentPlayer]}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerScore}>{player.score}</Text>
          </View>
        ))}
      </View>

      {/* لوحة اللعب */}
      <View style={styles.boardContainer}>
        <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
          {/* رسم المربعات المكتملة */}
          {gameState.boxes.map((row, r) =>
            row.map((playerIndex, c) => {
              if (playerIndex !== null) {
                const player = gameState.players[playerIndex];
                return (
                  <Rect
                    key={`b-${r}-${c}`}
                    x={c * dotSpacing}
                    y={r * dotSpacing}
                    width={dotSpacing}
                    height={dotSpacing}
                    fill={player.color}
                    opacity={0.3}
                  />
                );
              }
              return null;
            })
          )}

          {/* رسم الخطوط الأفقية */}
          {gameState.horizontalLines.map((row, r) => {
            return row.map((drawn, c) => {
              return (
                <React.Fragment key={`h-${r}-${c}`}> 
                  <Rect
                    x={c * dotSpacing}
                    y={r * dotSpacing - TOUCHABLE_LINE_WIDTH / 2}
                    width={dotSpacing}
                    height={TOUCHABLE_LINE_WIDTH}
                    fill="transparent"
                    onPress={() => handleLinePress('h', r, c)}
                  />
                  <Line
                    x1={c * dotSpacing}
                    y1={r * dotSpacing}
                    x2={(c + 1) * dotSpacing}
                    y2={r * dotSpacing}
                    stroke={drawn !== false ? gameState.players[drawn].color : '#ddd'}
                    strokeWidth={LINE_THICKNESS}
                    strokeLinecap="round"
                  />
                </React.Fragment>
              );
            });
          })}

          {/* رسم الخطوط العمودية */}
          {gameState.verticalLines.map((row, r) => {
            return row.map((drawn, c) => {
              return (
                <React.Fragment key={`v-${r}-${c}`}>
                  <Rect
                    x={c * dotSpacing - TOUCHABLE_LINE_WIDTH / 2}
                    y={r * dotSpacing}
                    width={TOUCHABLE_LINE_WIDTH}
                    height={dotSpacing}
                    fill="transparent"
                    onPress={() => handleLinePress('v', r, c)}
                  />
                  <Line
                    x1={c * dotSpacing}
                    y1={r * dotSpacing}
                    x2={c * dotSpacing}
                    y2={(r + 1) * dotSpacing}
                    stroke={drawn !== false ? gameState.players[drawn].color : '#ddd'}
                    strokeWidth={LINE_THICKNESS}
                    strokeLinecap="round"
                  />
                </React.Fragment>
              );
            });
          })}

          {/* رسم النقاط */}
          {dots.map(dot => (
            <Circle key={dot.id} cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill="#333" />
          ))}
        </Svg>
      </View>
      
      {/* رسالة نهاية اللعبة */}
      {gameState.gameOver && (
        <Text style={styles.gameOverText}>انتهت اللعبة!</Text>
      )}

      {/* زر إعادة تعيين اللعبة */}
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>لعبة جديدة</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Styles (الأنماط) ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  playersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  playerCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  currentPlayer: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
    elevation: 6,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerScore: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  boardContainer: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 0, // Padding is handled by dot spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginVertical: 20,
  },
  resetButton: {
    backgroundColor: '#ff5722',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
