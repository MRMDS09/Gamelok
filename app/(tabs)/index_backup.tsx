import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameBoard } from '../../components/GameBoard';
import { GameState } from '../../components/GameLogic';

export default function HomeScreen() {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: 1, name: 'اللاعب الأول', score: 0, color: '#FF6B6B' },
      { id: 2, name: 'اللاعب الثاني', score: 0, color: '#4ECDC4' },
    ],
    currentPlayer: 0,
    horizontalLines: Array(5).fill(null).map(() => Array(4).fill(false)),
    verticalLines: Array(4).fill(null).map(() => Array(5).fill(false)),
    boxes: Array(4).fill(null).map(() => Array(4).fill(false)),
    gameOver: false,
  });

  const handleHorizontalLinePress = (row: number, col: number) => {
    if (gameState.horizontalLines[row][col]) return; // الخط موجود بالفعل

    const newHorizontalLines = [...gameState.horizontalLines];
    newHorizontalLines[row][col] = true;

    // التحقق من إكمال المربعات
    const newBoxes = [...gameState.boxes];
    let boxesCompleted = 0;

    // التحقق من المربع العلوي (إذا كان موجود)
    if (row > 0) {
      const topBox = 
        newHorizontalLines[row-1][col] && // الخط الأفقي العلوي
        gameState.verticalLines[row-1][col] && // الخط العمودي الأيسر
        gameState.verticalLines[row-1][col+1]; // الخط العمودي الأيمن
      
      if (topBox) {
        newBoxes[row-1][col] = true;
        boxesCompleted++;
      }
    }

    // التحقق من المربع السفلي (إذا كان موجود)
    if (row < 4) {
      const bottomBox = 
        newHorizontalLines[row+1][col] && // الخط الأفقي السفلي
        gameState.verticalLines[row][col] && // الخط العمودي الأيسر
        gameState.verticalLines[row][col+1]; // الخط العمودي الأيمن
      
      if (bottomBox) {
        newBoxes[row][col] = true;
        boxesCompleted++;
      }
    }

    // تحديث النقاط
    const newPlayers = [...gameState.players];
    if (boxesCompleted > 0) {
      newPlayers[gameState.currentPlayer].score += boxesCompleted;
    } else {
      // تبديل دور اللاعب
      setGameState(prev => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % prev.players.length,
        horizontalLines: newHorizontalLines,
        boxes: newBoxes,
        players: newPlayers,
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      horizontalLines: newHorizontalLines,
      boxes: newBoxes,
      players: newPlayers,
    }));
  };

  const handleVerticalLinePress = (row: number, col: number) => {
    if (gameState.verticalLines[row][col]) return; // الخط موجود بالفعل

    const newVerticalLines = [...gameState.verticalLines];
    newVerticalLines[row][col] = true;

    // التحقق من إكمال المربعات
    const newBoxes = [...gameState.boxes];
    let boxesCompleted = 0;

    // التحقق من المربع الأيسر (إذا كان موجود)
    if (col > 0) {
      const leftBox = 
        newVerticalLines[row][col-1] && // الخط العمودي الأيسر
        gameState.horizontalLines[row][col-1] && // الخط الأفقي العلوي
        gameState.horizontalLines[row+1][col-1]; // الخط الأفقي السفلي
      
      if (leftBox) {
        newBoxes[row][col-1] = true;
        boxesCompleted++;
      }
    }

    // التحقق من المربع الأيمن (إذا كان موجود)
    if (col < 4) {
      const rightBox = 
        newVerticalLines[row][col+1] && // الخط العمودي الأيمن
        gameState.horizontalLines[row][col] && // الخط الأفقي العلوي
        gameState.horizontalLines[row+1][col]; // الخط الأفقي السفلي
      
      if (rightBox) {
        newBoxes[row][col] = true;
        boxesCompleted++;
      }
    }

    // تحديث النقاط
    const newPlayers = [...gameState.players];
    if (boxesCompleted > 0) {
      newPlayers[gameState.currentPlayer].score += boxesCompleted;
    } else {
      // تبديل دور اللاعب
      setGameState(prev => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % prev.players.length,
        verticalLines: newVerticalLines,
        boxes: newBoxes,
        players: newPlayers,
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      verticalLines: newVerticalLines,
      boxes: newBoxes,
      players: newPlayers,
    }));
  };

  return (
    // SafeAreaView تضمن عدم تداخل المحتوى مع حواف الشاشة العلوية (Notch)
    <SafeAreaView style={styles.container}>
      {/* View هي حاوية المحتوى الرئيسية */}
      <View style={styles.gameContainer}>
        <Text style={styles.title}>لعبة النقاط والمربعات</Text>
        
        {/* لوحة اللعب */}
        <GameBoard 
          gameState={gameState}
          onHorizontalLinePress={handleHorizontalLinePress}
          onVerticalLinePress={handleVerticalLinePress}
        />

        {/* معلومات اللاعبين */}
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
        <TouchableOpacity style={styles.resetButton} onPress={() => {
          setGameState({
            players: [
              { id: 1, name: 'اللاعب الأول', score: 0, color: '#FF6B6B' },
              { id: 2, name: 'اللاعب الثاني', score: 0, color: '#4ECDC4' },
            ],
            currentPlayer: 0,
            horizontalLines: Array(5).fill(null).map(() => Array(4).fill(false)),
            verticalLines: Array(4).fill(null).map(() => Array(5).fill(false)),
            boxes: Array(4).fill(null).map(() => Array(4).fill(false)),
            gameOver: false,
          });
        }}>
          <Text style={styles.resetButtonText}>لعبة جديدة</Text>
        </TouchableOpacity>
        
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

// StyleSheet يستخدم لتنظيم الأنماط وجعلها أكثر كفاءة
const styles = StyleSheet.create({
  container: {
    flex: 1, // اجعل الحاوية تملأ الشاشة بالكامل
    backgroundColor: '#f5f5f5', // لون خلفية رمادي فاتح
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center', // توسيط العناصر أفقيًا
    justifyContent: 'center', // توسيط العناصر رأسيًا
  },
  title: {
    fontSize: 32, // حجم الخط
    fontWeight: 'bold', // خط عريض
    color: '#333', // لون نص رمادي غامق
    marginBottom: 50, // هامش سفلي لإعطاء مساحة للوحة اللعب
    textAlign: 'center', // توسيط النص
  },
  playersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  playerCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
