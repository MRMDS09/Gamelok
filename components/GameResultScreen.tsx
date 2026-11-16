import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BoardMode } from './BoardModes';
import { CHARACTERS } from './Characters';
import { getMatchResult, Player } from './MatchPlayers';
import { COLORS } from './theme';

interface GameResultScreenProps {
  players: Player[];
  boardMode: BoardMode;
  endedEarly?: boolean;
  onPlayAgain: () => void;
  onChangeCharacters: () => void;
  onChooseAnotherBoard: () => void;
  onBackToHome: () => void;
  onOpenSettings?: () => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  players, boardMode, endedEarly = false, onPlayAgain, onChangeCharacters,
  onChooseAnotherBoard, onBackToHome, onOpenSettings,
}) => {
  const { height } = useWindowDimensions();
  const compact = height < 420;
  const result = getMatchResult(players);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.compactContent]}>
        <View style={[styles.resultPanel, compact && styles.compactPanel]}>
          <View style={styles.header}>
            <Text style={[styles.title, compact && styles.compactTitle]}>انتهت المباراة</Text>
            <TouchableOpacity style={styles.topButton} onPress={onBackToHome} accessibilityRole="button" accessibilityLabel="العودة إلى الرئيسية">
              <Text style={styles.topButtonText}>⌂ الرئيسية</Text>
            </TouchableOpacity>
            {onOpenSettings && (
              <TouchableOpacity style={styles.topButton} onPress={onOpenSettings} accessibilityRole="button" accessibilityLabel="فتح الإعدادات">
                <Text style={styles.topButtonText}>⚙ الإعدادات</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.resultText, compact && styles.compactResult]} accessibilityRole="header">
            {result.type === 'winner'
              ? `الفائز: ${CHARACTERS[result.winner.characterId].name} · ${result.winner.name}`
              : 'تعادل اللاعبان'}
          </Text>
          <Text style={styles.modeText}>شبكة {boardMode.name} · {boardMode.boxCount} مربع</Text>
          {endedEarly && <Text style={styles.earlyFinishText}>حُسمت المباراة مبكراً لأن التعادل لم يعد ممكناً</Text>}

          <View style={styles.scoreCards}>
            {players.map((player) => {
              const character = CHARACTERS[player.characterId];
              const isWinner = result.type === 'winner' && result.winner.id === player.id;
              return (
                <View key={player.id} accessible accessibilityLabel={`${player.name}، ${character.name}، ${player.score} نقطة${isWinner ? '، الفائز' : ''}`} style={[
                  styles.scoreCard, compact && styles.compactCard,
                  { borderColor: isWinner ? COLORS.gold : character.color },
                  isWinner && styles.winnerCard,
                ]}>
                  <View style={styles.portrait}>
                    {isWinner && (
                      <Svg width={26} height={20} viewBox="0 0 28 22" style={styles.crown} accessible={false}>
                        <Path d="M3 6 L8 10 L14 2 L20 10 L25 6 L22 17 H6 Z M6 20 H22" fill={COLORS.gold} stroke={COLORS.gold} strokeWidth={2} strokeLinejoin="round" />
                      </Svg>
                    )}
                    <Image source={character.faceImage} style={[styles.face, compact && styles.compactFace]} resizeMode="contain" accessible={false} />
                  </View>
                  <View style={styles.identity}>
                    <Text style={styles.characterName}>{character.name}</Text>
                    <Text style={styles.playerRole}>{player.name}</Text>
                    <Text style={[styles.outcome, { color: isWinner ? COLORS.gold : COLORS.mutedText }]}>
                      {isWinner ? 'الفائز' : result.type === 'draw' ? 'تعادل' : 'نهاية المباراة'}
                    </Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={[styles.score, compact && styles.compactScore]}>{player.score}</Text>
                    <Text style={styles.scoreLabel}>نقطة</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.totalScore}>
            المربعات المحسومة: {players.reduce((total, player) => total + player.score, 0)} / {boardMode.boxCount}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.playAgainButton]} onPress={onPlayAgain} accessibilityRole="button" activeOpacity={0.82}>
              <Text style={[styles.actionButtonText, compact && styles.compactActionText]}>إعادة اللعب</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.characterButton]} onPress={onChangeCharacters} accessibilityRole="button" activeOpacity={0.82}>
              <Text style={[styles.actionButtonText, compact && styles.compactActionText]}>تغيير الشخصيات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.boardButton]} onPress={onChooseAnotherBoard} accessibilityRole="button" activeOpacity={0.82}>
              <Text style={[styles.actionButtonText, compact && styles.compactActionText]}>شبكة أخرى</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  compactContent: { padding: 8 },
  resultPanel: {
    width: '100%', maxWidth: 820, alignSelf: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.panel, borderColor: '#2B354D', borderWidth: 1,
    borderRadius: 16, padding: 18,
  },
  compactPanel: { padding: 10, gap: 4 },
  header: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: COLORS.gold, fontSize: 28, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  compactTitle: { fontSize: 21, lineHeight: 28 },
  topButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.board, borderWidth: 1, borderColor: COLORS.neutralLine },
  topButtonText: { color: COLORS.text, fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  resultText: { color: COLORS.text, fontSize: 21, lineHeight: 29, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  compactResult: { fontSize: 17, lineHeight: 24 },
  modeText: { color: COLORS.mutedText, fontSize: 12, lineHeight: 17, textAlign: 'center', writingDirection: 'rtl' },
  earlyFinishText: { color: COLORS.gold, fontSize: 12, lineHeight: 18, textAlign: 'center', writingDirection: 'rtl' },
  scoreCards: { width: '100%', flexDirection: 'row-reverse', gap: 10 },
  scoreCard: {
    flex: 1, minWidth: 0, flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.board, borderWidth: 2, borderRadius: 13, padding: 12,
  },
  compactCard: { padding: 6, gap: 6 },
  winnerCard: { backgroundColor: '#29271F' },
  portrait: { paddingTop: 20, alignItems: 'center' },
  crown: { position: 'absolute', top: 0 },
  face: { width: 80, height: 88 },
  compactFace: { width: 50, height: 56 },
  identity: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  characterName: { color: COLORS.text, fontSize: 18, lineHeight: 25, fontWeight: '800', writingDirection: 'rtl' },
  playerRole: { color: COLORS.mutedText, fontSize: 12, lineHeight: 18, writingDirection: 'rtl' },
  outcome: { fontSize: 11, lineHeight: 16, writingDirection: 'rtl' },
  scoreInfo: { alignItems: 'center', minWidth: 30 },
  score: { color: COLORS.text, fontSize: 36, lineHeight: 42, fontWeight: '800' },
  compactScore: { fontSize: 28, lineHeight: 34 },
  scoreLabel: { color: COLORS.mutedText, fontSize: 11, lineHeight: 16, writingDirection: 'rtl' },
  totalScore: { color: COLORS.mutedText, fontSize: 12, lineHeight: 18, textAlign: 'center', writingDirection: 'rtl' },
  actions: { width: '100%', flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  actionButton: { flexGrow: 1, flexBasis: 130, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 8 },
  playAgainButton: { backgroundColor: COLORS.emerald, borderColor: '#34D399' },
  characterButton: { backgroundColor: COLORS.board, borderColor: COLORS.gold },
  boardButton: { backgroundColor: COLORS.mutedControl, borderColor: COLORS.neutralLine },
  actionButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '800', writingDirection: 'rtl' },
  compactActionText: { fontSize: 14 },
});
