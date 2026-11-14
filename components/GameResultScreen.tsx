import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BoardMode } from './BoardModes';
import { COLORS } from './theme';

interface GameResultScreenProps {
  players: {
    id: number;
    name: string;
    score: number;
    color: string;
  }[];
  boardMode: BoardMode;
  endedEarly?: boolean;
  onPlayAgain: () => void;
  onChooseAnotherBoard: () => void;
  onBackToHome: () => void;
  onOpenSettings?: () => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  players,
  boardMode,
  endedEarly = false,
  onPlayAgain,
  onChooseAnotherBoard,
  onBackToHome,
  onOpenSettings,
}) => {
  const getGameResult = () => {
    const [player1, player2] = players;

    if (player1.score > player2.score) {
      return { type: 'winner' as const, winner: player1 };
    }
    if (player2.score > player1.score) {
      return { type: 'winner' as const, winner: player2 };
    }
    return { type: 'draw' as const };
  };

  const result = getGameResult();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topActions}>
        {onOpenSettings && (
          <TouchableOpacity
            style={styles.topButton}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="فتح الإعدادات"
          >
            <Text style={styles.topButtonText}>⚙ الإعدادات</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.topButton}
          onPress={onBackToHome}
          accessibilityRole="button"
          accessibilityLabel="العودة إلى الرئيسية"
        >
          <Text style={styles.topButtonText}>⌂ الرئيسية</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultPanel}>
        <Text style={styles.title}>انتهت اللعبة</Text>
        <Text style={styles.resultText}>
          {result.type === 'winner' ? `الفائز: ${result.winner.name}` : 'تعادل اللاعبان'}
        </Text>
        <Text style={styles.modeText}>نمط الشبكة: {boardMode.name}</Text>
        {endedEarly && (
          <Text style={styles.earlyFinishText}>حُسمت المباراة مبكراً لأن التعادل لم يعد ممكناً</Text>
        )}

        <View style={styles.scoreCards}>
          {players.map((player) => {
            const isWinner = result.type === 'winner' && result.winner.id === player.id;
            return (
              <View
                key={player.id}
                style={[
                  styles.scoreCard,
                  { borderColor: player.color },
                  isWinner && styles.winnerCard,
                ]}
              >
                <View style={styles.playerLabelRow}>
                  <View style={[styles.colorIndicator, { backgroundColor: player.color }]} />
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                <Text style={styles.score}>{player.score}</Text>
                <Text style={styles.scoreLabel}>مربع</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.totalScore}>
          مجموع المربعات في الشبكة: {boardMode.boxCount}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.playAgainButton]} onPress={onPlayAgain} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>إعادة اللعب</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.boardButton]} onPress={onChooseAnotherBoard} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>شبكة أخرى</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.homeButton]} onPress={onBackToHome} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topActions: {
    minHeight: 44,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 8,
  },
  topButton: {
    minWidth: 116,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.board,
    borderColor: COLORS.neutralLine,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
  },
  topButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  resultPanel: {
    flex: 1,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panel,
    borderColor: '#2B354D',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 8,
  },
  title: {
    color: COLORS.gold,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  resultText: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 2,
    marginBottom: 6,
  },
  earlyFinishText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: -2,
    marginBottom: 6,
  },
  modeText: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  scoreCards: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.board,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  winnerCard: {
    borderWidth: 2,
  },
  playerLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  playerName: {
    color: COLORS.mutedText,
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  score: {
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
  },
  scoreLabel: {
    color: COLORS.mutedText,
    fontSize: 11,
    writingDirection: 'rtl',
  },
  totalScore: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
    marginTop: 7,
  },
  actions: {
    width: '100%',
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  playAgainButton: {
    backgroundColor: COLORS.emerald,
    borderColor: '#34D399',
  },
  homeButton: {
    backgroundColor: COLORS.board,
    borderColor: COLORS.gold,
  },
  boardButton: {
    backgroundColor: COLORS.mutedControl,
    borderColor: COLORS.neutralLine,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
