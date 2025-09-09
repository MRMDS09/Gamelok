import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
const { width: screenWidth } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenWidth - 40, 400);
const GRID_SIZE = 6; // 6x6 مربعات
const DOT_RADIUS = 4;
const LINE_THICKNESS = 10;
const TOUCHABLE_LINE_WIDTH = 30; // منطقة لمس أكبر للخطوط

// --- The Main Game Component (المكون الرئيسي للعبة) ---
interface GameProps {
  onBackToHome?: () => void;
  player1Color?: string;
  player2Color?: string;
  onGameEnd?: (players: Array<{id: number, name: string, score: number, color: string}>) => void;
}

export const Game: React.FC<GameProps> = ({ 
  onBackToHome, 
  player1Color = '#d32f2f', 
  player2Color = '#1976d2',
  onGameEnd
}) => {
  const { playClickSound, playBoxCompleteSound, playGameOverSound } = useAudioManager();
  
  // --- State Management (إدارة حالة اللعبة) ---
  const createInitialState = (): GameState => ({
    players: [
      { id: 1, name: 'اللاعب الأول', score: 0, color: player1Color },
      { id: 2, name: 'اللاعب الثاني', score: 0, color: player2Color }
    ],
    currentPlayer: 0,
    horizontalLines: Array(GRID_SIZE + 1).fill(null).map(() => Array(GRID_SIZE).fill(false)),
    verticalLines: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE + 1).fill(false)),
    boxes: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    gameOver: false,
  });

  const [gameState, setGameState] = useState<GameState>(createInitialState());

  // دالة لمعالجة اللمس على اللوحة
  const handleBoardTouch = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const dotSpacing = BOARD_SIZE / GRID_SIZE;
    
    // حساب أقرب خط أفقي
    for (let r = 0; r <= GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const lineY = r * dotSpacing;
        const lineX1 = c * dotSpacing;
        const lineX2 = (c + 1) * dotSpacing;
        
        if (Math.abs(locationY - lineY) < TOUCHABLE_LINE_WIDTH / 2 &&
            locationX >= lineX1 && locationX <= lineX2) {
          handleLinePress('h', r, c);
          return;
        }
      }
    }
    
    // حساب أقرب خط عمودي
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE; c++) {
        const lineX = c * dotSpacing;
        const lineY1 = r * dotSpacing;
        const lineY2 = (r + 1) * dotSpacing;
        
        if (Math.abs(locationX - lineX) < TOUCHABLE_LINE_WIDTH / 2 &&
            locationY >= lineY1 && locationY <= lineY2) {
          handleLinePress('v', r, c);
          return;
        }
      }
    }
  }, []);

  // --- Game Logic (منطق اللعبة) ---
  const handleLinePress = useCallback((type: 'h' | 'v', row: number, col: number) => {
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
        // تشغيل صوت إكمال المربع
        playBoxCompleteSound();
      } else {
        // انتقال الدور إلى اللاعب التالي
        nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      }

      // التحقق من نهاية اللعبة
      const totalBoxes = GRID_SIZE * GRID_SIZE;
      const totalScore = newPlayers.reduce((sum, player) => sum + player.score, 0);
      let gameOver = totalScore === totalBoxes;

      // إنهاء مبكر: إذا كان الفارق أكبر من عدد المربعات المتبقية
      if (!gameOver) {
        const remainingBoxes = totalBoxes - totalScore;
        const scores = newPlayers.map(p => p.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const lead = maxScore - minScore;
        if (lead > remainingBoxes) {
          gameOver = true;
        }
      }

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
      {/* شريط التنقل */}
      {onBackToHome && (
        <View style={styles.navigationBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBackToHome}>
            <Text style={styles.backButtonText}>← الرئيسية</Text>
          </TouchableOpacity>
          <Text style={styles.gameTitle}>لعبة النقاط والمربعات</Text>
          <View style={styles.placeholder} />
        </View>
      )}
      
      {/* عرض معلومات اللاعبين */}
      <View style={styles.playersInfo}>
        {gameState.players.map((player, index) => (
          <View key={player.id} style={[
            styles.playerCard, 
            { backgroundColor: player.color + '20', borderColor: player.color },
            gameState.currentPlayer === index && styles.currentPlayer
          ]}>
            <View style={[styles.playerColorIndicator, { backgroundColor: player.color }]} />
            <Text style={[styles.playerName, { color: player.color }]}>{player.name}</Text>
            <Text style={[styles.playerScore, { color: player.color }]}>{player.score}</Text>
            {gameState.currentPlayer === index && (
              <Text style={styles.currentPlayerText}>دورك الآن!</Text>
            )}
          </View>
        ))}
      </View>

      {/* لوحة اللعب */}
      <TouchableWithoutFeedback onPress={handleBoardTouch}>
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
                <Line
                  key={`h-${r}-${c}`}
                  x1={c * dotSpacing}
                  y1={r * dotSpacing}
                  x2={(c + 1) * dotSpacing}
                  y2={r * dotSpacing}
                  stroke={drawn !== false ? gameState.players[drawn].color : '#ddd'}
                  strokeWidth={LINE_THICKNESS}
                  strokeLinecap="round"
                />
              );
            });
          })}

          {/* رسم الخطوط العمودية */}
          {gameState.verticalLines.map((row, r) => {
            return row.map((drawn, c) => {
              return (
                <Line
                  key={`v-${r}-${c}`}
                  x1={c * dotSpacing}
                  y1={r * dotSpacing}
                  x2={c * dotSpacing}
                  y2={(r + 1) * dotSpacing}
                  stroke={drawn !== false ? gameState.players[drawn].color : '#ddd'}
                  strokeWidth={LINE_THICKNESS}
                  strokeLinecap="round"
                />
              );
            });
          })}

          {/* رسم النقاط */}
          {dots.map(dot => (
            <Circle key={dot.id} cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill="#333" />
          ))}
        </Svg>
        </View>
      </TouchableWithoutFeedback>
      
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
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  placeholder: {
    width: 80, // نفس عرض زر الرجوع للحفاظ على التوازن
  },
  playersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  playerCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    minWidth: 160,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  currentPlayer: {
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.3,
    elevation: 8,
    borderWidth: 4,
  },
  playerColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  playerScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  currentPlayerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textAlign: 'center',
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
