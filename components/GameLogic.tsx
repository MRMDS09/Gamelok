import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
}

export interface GameState {
  players: Player[];
  currentPlayer: number;
  horizontalLines: (number | false)[][]; // تحديث لتخزين رقم اللاعب أو false
  verticalLines: (number | false)[][];   // تحديث لتخزين رقم اللاعب أو false
  boxes: boolean[][];
  gameOver: boolean;
}

interface GameLogicProps {
  onGameStateChange: (gameState: GameState) => void;
}

export const GameLogic: React.FC<GameLogicProps> = ({ onGameStateChange }) => {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: 1, name: 'اللاعب الأول', score: 0, color: '#a34242ff' },
      { id: 2, name: 'اللاعب الثاني', score: 0, color: '#070808ff' },
    ],
    currentPlayer: 0,
    horizontalLines: Array(5).fill(null).map(() => Array(4).fill(false)),
    verticalLines: Array(4).fill(null).map(() => Array(5).fill(false)),
    boxes: Array(4).fill(null).map(() => Array(4).fill(false)),
    gameOver: false,
  });

  // إضافة حالة selectedLine لمعالجة اختيار الخطوط
  const [selectedLine, setSelectedLine] = useState<{ type: 'h' | 'v'; row: number; col: number } | null>(null);

  // دالة لتبديل دور اللاعب
  const switchPlayer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: (prev.currentPlayer + 1) % prev.players.length,
    }));
  }, []);

  // دالة لرسم خط أفقي
  const drawHorizontalLine = useCallback((row: number, col: number) => {
    setGameState(prev => {
      // إضافة تحقق من حدود المؤشر لتجنب الوصول إلى عناصر خارج المصفوفة
      if (row < 0 || row >= prev.horizontalLines.length || col < 0 || col >= prev.horizontalLines[0].length) return prev;
      if (prev.horizontalLines[row][col]) return prev;

      const newHorizontalLines = prev.horizontalLines.map(arr => [...arr]);
      newHorizontalLines[row][col] = prev.currentPlayer;

      const newBoxes = prev.boxes.map(arr => [...arr]);
      const newPlayers = prev.players.map(player => ({ ...player }));

      let boxesCompleted = 0;
      if (
        row > 0 &&
        newHorizontalLines[row - 1][col] &&
        prev.verticalLines[row - 1][col] &&
        prev.verticalLines[row - 1][col + 1]
      ) {
        newBoxes[row - 1][col] = true;
        boxesCompleted++;
      }
      if (
        row < prev.horizontalLines.length - 1 &&
        newHorizontalLines[row + 1][col] &&
        prev.verticalLines[row][col] &&
        prev.verticalLines[row][col + 1]
      ) {
        newBoxes[row][col] = true;
        boxesCompleted++;
      }

      if (boxesCompleted > 0) {
        newPlayers[prev.currentPlayer].score += boxesCompleted;
      }
      // منطق تبديل الدور الصحيح
      const nextPlayer = (prev.currentPlayer + 1) % prev.players.length;

      const newState = {
        ...prev,
        currentPlayer: nextPlayer,
        horizontalLines: newHorizontalLines,
        boxes: newBoxes,
        players: newPlayers,
      };
      onGameStateChange(newState);
      return newState;
    });
  }, [onGameStateChange]);

  // دالة لرسم خط عمودي
  const drawVerticalLine = useCallback((row: number, col: number) => {
    setGameState(prev => {
      // إضافة تحقق من الحدود لتجنب الوصول لمؤشرات سالبة
      if (row < 0 || row >= prev.verticalLines.length || col < 0 || col >= prev.verticalLines[0].length) return prev;
      if (prev.verticalLines[row][col]) return prev;

      const newVerticalLines = prev.verticalLines.map(arr => [...arr]);
      newVerticalLines[row][col] = prev.currentPlayer;

      const newBoxes = prev.boxes.map(arr => [...arr]);
      const newPlayers = prev.players.map(player => ({ ...player }));

      let boxesCompleted = 0;
      if (
        col > 0 &&
        newVerticalLines[row][col - 1] &&
        prev.horizontalLines[row][col - 1] &&
        prev.horizontalLines[row + 1][col - 1]
      ) {
        newBoxes[row][col - 1] = true;
        boxesCompleted++;
      }
      if (
        col < prev.verticalLines[0].length - 1 &&
        newVerticalLines[row][col + 1] &&
        prev.horizontalLines[row][col] &&
        prev.horizontalLines[row + 1][col]
      ) {
        newBoxes[row][col] = true;
        boxesCompleted++;
      }

      if (boxesCompleted > 0) {
        newPlayers[prev.currentPlayer].score += boxesCompleted;
      }
      const nextPlayer = (prev.currentPlayer + 1) % prev.players.length;

      const newState = {
        ...prev,
        currentPlayer: nextPlayer,
        verticalLines: newVerticalLines,
        boxes: newBoxes,
        players: newPlayers,
      };
      onGameStateChange(newState);
      return newState;
    });
  }, [onGameStateChange]);

  // دالة لإعادة تعيين اللعبة
  const resetGame = useCallback(() => {
    const newGameState: GameState = {
      players: [
        { id: 1, name: 'اللاعب الأول', score: 0, color: '#FF6B6B' },
        { id: 2, name: 'اللاعب الثاني', score: 0, color: '#233a38ff' },
      ],
      currentPlayer: 0,
      horizontalLines: Array(5).fill(null).map(() => Array(4).fill(false)),
      verticalLines: Array(4).fill(null).map(() => Array(5).fill(false)),
      boxes: Array(4).fill(null).map(() => Array(4).fill(false)),
      gameOver: false,
    };
    setGameState(newGameState);
    onGameStateChange(newGameState);
  }, [onGameStateChange]);

  // دالة لمعالجة ضغط الخطوط وتحديث الحالة
  const handleLinePress = useCallback((type: 'h' | 'v', row: number, col: number) => {
    console.log(`Line pressed: Type=${type}, Row=${row}, Col=${col}`);
    if (type === 'h') {
      drawHorizontalLine(row, col);
    } else {
      drawVerticalLine(row, col);
    }
    // بعد تنفيذ عملية الرسم، قم بمسح selectedLine
    setSelectedLine(null);
  }, [drawHorizontalLine, drawVerticalLine]);

  return (
    <View style={styles.container}>
      {/* عرض معلومات اللاعبين */}
      <View style={styles.playersInfo}>
        {gameState.players.map((player, index) => (
          <View 
            key={player.id} 
            style={[
              styles.playerCard,
              gameState.currentPlayer === index && styles.currentPlayer
            ]}
          >
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerScore}>{player.score}</Text>
          </View>
        ))}
      </View>

      {/* زر إعادة تعيين اللعبة */}
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>لعبة جديدة</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  playerCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 120,
  },
  currentPlayer: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  playerScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  resetButton: {
    backgroundColor: '#ff5722',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
