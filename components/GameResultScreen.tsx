import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GameResultScreenProps {
  players: Array<{
    id: number;
    name: string;
    score: number;
    color: string;
  }>;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  players,
  onPlayAgain,
  onBackToHome,
}) => {
  // تحديد الفائز أو التعادل
  const getGameResult = () => {
    const [player1, player2] = players;
    
    if (player1.score > player2.score) {
      return {
        type: 'winner' as const,
        winner: player1,
        loser: player2,
      };
    } else if (player2.score > player1.score) {
      return {
        type: 'winner' as const,
        winner: player2,
        loser: player1,
      };
    } else {
      return {
        type: 'draw' as const,
        players: [player1, player2],
      };
    }
  };

  const result = getGameResult();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>نتيجة المباراة</Text>
      </View>

      <View style={styles.content}>
        {result.type === 'winner' ? (
          // حالة الفوز
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerTitle}>🏆 الفائز</Text>
            <View style={[styles.winnerCard, { backgroundColor: result.winner.color + '20', borderColor: result.winner.color }]}>
              <View style={[styles.winnerColorIndicator, { backgroundColor: result.winner.color }]} />
              <Text style={[styles.winnerName, { color: result.winner.color }]}>
                {result.winner.name}
              </Text>
              <Text style={[styles.winnerScore, { color: result.winner.color }]}>
                {result.winner.score} نقطة
              </Text>
            </View>
            
            <Text style={styles.loserTitle}>الخاسر</Text>
            <View style={[styles.loserCard, { backgroundColor: result.loser.color + '10', borderColor: result.loser.color }]}>
              <View style={[styles.loserColorIndicator, { backgroundColor: result.loser.color }]} />
              <Text style={[styles.loserName, { color: result.loser.color }]}>
                {result.loser.name}
              </Text>
              <Text style={[styles.loserScore, { color: result.loser.color }]}>
                {result.loser.score} نقطة
              </Text>
            </View>
          </View>
        ) : (
          // حالة التعادل
          <View style={styles.drawContainer}>
            <Text style={styles.drawTitle}>🤝 تعادل</Text>
            <Text style={styles.drawSubtitle}>كلاهما حصل على نفس النقاط!</Text>
            
            <View style={styles.drawPlayers}>
              {result.players.map((player, index) => (
                <View key={player.id} style={[styles.drawPlayerCard, { backgroundColor: player.color + '20', borderColor: player.color }]}>
                  <View style={[styles.drawPlayerColorIndicator, { backgroundColor: player.color }]} />
                  <Text style={[styles.drawPlayerName, { color: player.color }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.drawPlayerScore, { color: player.color }]}>
                    {player.score} نقطة
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* إحصائيات إضافية */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>إحصائيات المباراة</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>إجمالي النقاط:</Text>
            <Text style={styles.statsValue}>{players.reduce((sum, p) => sum + p.score, 0)}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>عدد المربعات:</Text>
            <Text style={styles.statsValue}>{players.reduce((sum, p) => sum + p.score, 0)}</Text>
          </View>
        </View>
      </View>

      {/* أزرار الإجراءات */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
          <Text style={styles.playAgainButtonText}>🔄 لعب مرة أخرى</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.homeButton} onPress={onBackToHome}>
          <Text style={styles.homeButtonText}>🏠 الصفحة الرئيسية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  winnerContainer: {
    alignItems: 'center',
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 20,
  },
  winnerCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.05 }],
  },
  winnerColorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  winnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnerScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  loserTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 10,
  },
  loserCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    opacity: 0.7,
  },
  loserColorIndicator: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  loserName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  loserScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawContainer: {
    alignItems: 'center',
  },
  drawTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 10,
  },
  drawSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  drawPlayers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  drawPlayerCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 3,
    flex: 1,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  drawPlayerColorIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  drawPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  drawPlayerScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statsLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  actionsContainer: {
    marginTop: 20,
  },
  playAgainButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
