import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GameResultScreenProps {
  players: {
    id: number;
    name: string;
    score: number;
    color: string;
  }[];
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
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.winnerName}>
                {result.winner.name}
              </Text>
              <Text style={styles.winnerScore}>
                {result.winner.score} نقطة
              </Text>
            </View>
            
            <Text style={styles.loserTitle}>الخاسر</Text>
            <View style={[styles.loserCard, { backgroundColor: result.loser.color + '10', borderColor: result.loser.color }]}>
              <View style={[styles.loserColorIndicator, { backgroundColor: result.loser.color }]} />
              <Text style={styles.loserName}>
                {result.loser.name}
              </Text>
              <Text style={styles.loserScore}>
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
                  <Text style={styles.drawPlayerName}>
                    {player.name}
                  </Text>
                  <Text style={styles.drawPlayerScore}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  winnerContainer: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(7, 20, 51, 0.84)',
    borderColor: 'rgba(130, 194, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 6,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFB06C',
    marginBottom: 4,
  },
  winnerCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.05 }],
  },
  winnerColorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
    borderWidth: 3,
    borderColor: '#fff',
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  winnerScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loserTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8CBE0',
    marginBottom: 3,
  },
  loserCard: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
    opacity: 0.9,
  },
  loserColorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  loserName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  loserScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  drawContainer: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(7, 20, 51, 0.84)',
    borderColor: 'rgba(130, 194, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 6,
  },
  drawTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C4B5FD',
    marginBottom: 10,
  },
  drawSubtitle: {
    fontSize: 16,
    color: '#B8CBE0',
    marginBottom: 12,
    textAlign: 'center',
  },
  drawPlayers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  drawPlayerCard: {
    alignItems: 'center',
    padding: 12,
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
    color: '#FFFFFF',
  },
  drawPlayerScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 51, 0.84)',
    borderColor: 'rgba(130, 194, 255, 0.22)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    color: '#B8CBE0',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  playAgainButton: {
    backgroundColor: '#168F48',
    borderColor: '#54E386',
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 0,
    marginHorizontal: 4,
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
    backgroundColor: '#5140A8',
    borderColor: '#A78BFA',
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    marginHorizontal: 4,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
