import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CHARACTER_LIST, CharacterSelection, selectPlayer1Character } from './Characters';
import { COLORS } from './theme';

interface CharacterSelectionScreenProps {
  selection: CharacterSelection;
  onSelectionChange: (selection: CharacterSelection) => void;
  onStartGame: () => void;
  onBack: () => void;
  player2Label: string;
}

export const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({
  selection,
  onSelectionChange,
  onStartGame,
  onBack,
  player2Label,
}) => {
  const { height } = useWindowDimensions();
  const compact = height < 420;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.screen, compact && styles.compactScreen]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="الرجوع إلى اختيار اللوحة والخصم"
          >
            <Text style={styles.buttonText}>الرجوع</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, compact && styles.compactTitle]}>اختيار الشخصيات</Text>
            <Text style={styles.instructions}>اللاعب 1، اختار شخصيتك</Text>
          </View>
        </View>

        <View style={styles.cards}>
          {CHARACTER_LIST.map((character) => {
            const selected = selection.player1 === character.id;
            const assignedPlayer = selected ? 'اللاعب 1' : player2Label;
            return (
              <TouchableOpacity
                key={character.id}
                style={[
                  styles.card,
                  compact && styles.compactCard,
                  { borderColor: selected ? COLORS.gold : character.color },
                  selected && styles.selectedCard,
                ]}
                onPress={() => onSelectionChange(selectPlayer1Character(character.id))}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityLabel={`${character.name}، ${assignedPlayer}`}
                accessibilityHint="تخصيص هذه الشخصية للاعب 1 والشخصية الأخرى للخصم"
                accessibilityState={{ checked: selected, selected }}
              >
                <Image source={character.cardImage} style={styles.cardImage} resizeMode="contain" accessible={false} />
                <View style={styles.characterHeading}>
                  <Text style={[styles.selectionMark, { color: selected ? COLORS.gold : character.color }]}>
                    {selected ? '✓' : '○'}
                  </Text>
                  <Text style={styles.characterName}>{character.name}</Text>
                </View>
                <Text style={styles.assignment} accessibilityLiveRegion="polite">
                  {assignedPlayer}: {character.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.saveHint}>كيتحفظ الاختيار تلقائياً على هاد الجهاز</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartGame}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="ابدأ المباراة"
          >
            <Text style={styles.buttonText}>ابدأ المباراة</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 16, gap: 12 },
  compactScreen: { padding: 8, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: COLORS.gold, fontSize: 28, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  compactTitle: { fontSize: 22 },
  instructions: { color: COLORS.text, fontSize: 15, textAlign: 'right', writingDirection: 'rtl' },
  backButton: {
    minWidth: 84, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gold, backgroundColor: COLORS.board,
  },
  cards: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 12 },
  card: {
    flex: 1, minWidth: 0, minHeight: 0, padding: 10, gap: 6, alignItems: 'center',
    borderWidth: 3, borderRadius: 14, backgroundColor: COLORS.panel,
  },
  compactCard: { padding: 6, gap: 4 },
  selectedCard: { backgroundColor: '#172038' },
  cardImage: { flex: 1, minHeight: 0, width: '100%' },
  characterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  selectionMark: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  characterName: { color: COLORS.text, fontSize: 19, fontWeight: '800', writingDirection: 'rtl' },
  assignment: { color: COLORS.text, fontSize: 14, textAlign: 'center', writingDirection: 'rtl' },
  footer: { alignItems: 'center', gap: 6 },
  saveHint: { color: COLORS.mutedText, fontSize: 12, textAlign: 'center', writingDirection: 'rtl' },
  startButton: {
    width: '100%', maxWidth: 420, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    backgroundColor: COLORS.emerald, borderWidth: 1, borderColor: '#34D399',
  },
  buttonText: { color: COLORS.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
