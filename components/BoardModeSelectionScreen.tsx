import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  BOARD_MODES,
  BoardMode,
  BoardModeId,
  CpuDifficulty,
  getBoardEdges,
  OpponentMode,
  StartingPlayerMode,
} from './BoardModes';
import { COLORS } from './theme';

interface BoardModeSelectionScreenProps {
  initialBoardModeId: BoardModeId;
  initialOpponentMode: OpponentMode;
  initialCpuDifficulty: CpuDifficulty;
  initialStartingPlayer: StartingPlayerMode;
  onBack: () => void;
  onContinue: (
    boardModeId: BoardModeId,
    opponentMode: OpponentMode,
    cpuDifficulty: CpuDifficulty,
    startingPlayer: StartingPlayerMode,
  ) => void;
}

const PREVIEW_WIDTH = 150;
const PREVIEW_HEIGHT = 76;
const PREVIEW_PADDING = 7;

const BoardPreview: React.FC<{ mode: BoardMode; selected: boolean; desktop: boolean }> = ({ mode, selected, desktop }) => {
  const cellSize = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / mode.columns,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / mode.rows,
  );
  const contentWidth = cellSize * mode.columns;
  const contentHeight = cellSize * mode.rows;
  const offsetX = (PREVIEW_WIDTH - contentWidth) / 2;
  const offsetY = (PREVIEW_HEIGHT - contentHeight) / 2;
  const edges = getBoardEdges(mode);
  const points = new Map<string, { x: number; y: number }>();

  edges.forEach((edge) => {
    const coordinates = edge.type === 'h'
      ? [[edge.col, edge.row], [edge.col + 1, edge.row]]
      : [[edge.col, edge.row], [edge.col, edge.row + 1]];
    coordinates.forEach(([column, row]) => {
      points.set(`${row}-${column}`, {
        x: offsetX + column * cellSize,
        y: offsetY + row * cellSize,
      });
    });
  });

  return (
    <Svg width={desktop ? 220 : PREVIEW_WIDTH} height={desktop ? 112 : PREVIEW_HEIGHT} viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`} pointerEvents="none">
      {edges.map((edge) => (
        <Line
          key={edge.key}
          x1={offsetX + edge.col * cellSize}
          y1={offsetY + edge.row * cellSize}
          x2={offsetX + (edge.col + (edge.type === 'h' ? 1 : 0)) * cellSize}
          y2={offsetY + (edge.row + (edge.type === 'v' ? 1 : 0)) * cellSize}
          stroke={selected ? COLORS.gold : COLORS.neutralLine}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ))}
      {Array.from(points.entries()).map(([key, point]) => (
        <Circle key={key} cx={point.x} cy={point.y} r={2.3} fill={COLORS.text} />
      ))}
    </Svg>
  );
};

export const BoardModeSelectionScreen: React.FC<BoardModeSelectionScreenProps> = ({
  initialBoardModeId,
  initialOpponentMode,
  initialCpuDifficulty,
  initialStartingPlayer,
  onBack,
  onContinue,
}) => {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 1024 && height >= 600;
  const [selectedBoardModeId, setSelectedBoardModeId] = useState(initialBoardModeId);
  const [opponentMode, setOpponentMode] = useState(initialOpponentMode);
  const [cpuDifficulty, setCpuDifficulty] = useState(initialCpuDifficulty);
  const [startingPlayer, setStartingPlayer] = useState(initialStartingPlayer);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.screen, desktop && desktopStyles.screen]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="الرجوع إلى الرئيسية"
          >
            <Text style={styles.backButtonText}>الرجوع</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>اختر نمط المباراة</Text>
            <Text style={styles.subtitle}>حدّد شكل الشبكة وطريقة اللعب، ثم اختر الألوان</Text>
          </View>
        </View>

        <View style={[styles.modeCards, desktop && desktopStyles.modeCards]}>
          {BOARD_MODES.map((mode) => {
            const selected = selectedBoardModeId === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, desktop && desktopStyles.modeCard, selected && styles.selectedModeCard]}
                onPress={() => setSelectedBoardModeId(mode.id)}
                activeOpacity={0.82}
                accessibilityRole="radio"
                accessibilityLabel={`${mode.name}، ${mode.boxCount} مربعاً و${mode.edgeCount} حافة`}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.modeName, desktop && desktopStyles.modeName, selected && styles.selectedText]}>{mode.name}</Text>
                <View style={[styles.previewContainer, desktop && desktopStyles.previewContainer]}>
                  <BoardPreview mode={mode} selected={selected} desktop={desktop} />
                </View>
                <Text style={[styles.modeStats, desktop && desktopStyles.modeStats]}>{mode.boxCount} مربعاً · {mode.edgeCount} حافة</Text>
                <Text style={[styles.modeSize, desktop && desktopStyles.modeSize]}>{mode.columns}×{mode.rows} · {mode.duration}</Text>
                <Text style={[styles.modeDescription, desktop && desktopStyles.modeDescription]} numberOfLines={1}>{mode.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerPanels}>
            <View style={styles.opponentPanel}>
              <Text style={[styles.opponentTitle, desktop && desktopStyles.opponentTitle]}>طريقة اللعب</Text>
              <View style={styles.opponentOptions}>
                <TouchableOpacity
                  style={[styles.opponentButton, opponentMode === 'local' && styles.selectedOpponentButton]}
                  onPress={() => setOpponentMode('local')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: opponentMode === 'local' }}
                >
                  <Text style={[styles.opponentButtonText, desktop && desktopStyles.opponentButtonText]}>لاعبان محلياً</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.opponentButton, opponentMode === 'cpu' && styles.selectedOpponentButton]}
                  onPress={() => setOpponentMode('cpu')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: opponentMode === 'cpu' }}
                >
                  <Text style={[styles.opponentButtonText, desktop && desktopStyles.opponentButtonText]}>ضد الهاتف</Text>
                </TouchableOpacity>
              </View>
            </View>

            {opponentMode === 'cpu' && (
              <View style={styles.opponentPanel}>
                <Text style={[styles.opponentTitle, desktop && desktopStyles.opponentTitle]}>مستوى الهاتف</Text>
                <View style={styles.opponentOptions}>
                  {([
                    ['easy', 'سهل'],
                    ['balanced', 'متوازن'],
                    ['expert', 'خبير'],
                  ] as const).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.opponentButton, cpuDifficulty === value && styles.selectedOpponentButton]}
                      onPress={() => setCpuDifficulty(value)}
                      accessibilityRole="radio"
                      accessibilityLabel={`مستوى الهاتف: ${label}`}
                      accessibilityState={{ selected: cpuDifficulty === value }}
                    >
                      <Text style={[styles.opponentButtonText, desktop && desktopStyles.opponentButtonText]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.opponentPanel}>
              <Text style={[styles.opponentTitle, desktop && desktopStyles.opponentTitle]}>من يبدأ؟</Text>
              <View style={styles.opponentOptions}>
                {([
                  ['random', 'عشوائي'],
                  ['player1', 'اللاعب الأول'],
                  ['player2', opponentMode === 'cpu' ? 'الهاتف' : 'اللاعب الثاني'],
                ] as const).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.opponentButton, startingPlayer === value && styles.selectedOpponentButton]}
                    onPress={() => setStartingPlayer(value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`من يبدأ: ${label}`}
                    accessibilityState={{ selected: startingPlayer === value }}
                  >
                    <Text style={[styles.opponentButtonText, desktop && desktopStyles.opponentButtonText]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => onContinue(
              selectedBoardModeId,
              opponentMode,
              cpuDifficulty,
              startingPlayer,
            )}
            accessibilityRole="button"
            accessibilityLabel="متابعة إلى اختيار الألوان"
          >
            <Text style={styles.continueButtonText}>متابعة</Text>
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
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: COLORS.gold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  backButton: {
    minWidth: 92,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.board,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  modeCards: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row-reverse',
    gap: 9,
  },
  modeCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B354D',
    backgroundColor: COLORS.panel,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  selectedModeCard: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: '#172038',
  },
  modeName: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  selectedText: {
    color: COLORS.gold,
  },
  previewContainer: {
    height: PREVIEW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeStats: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  modeSize: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  modeDescription: {
    color: COLORS.mutedText,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  footer: {
    minHeight: 78,
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 12,
    paddingTop: 8,
  },
  footerPanels: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignContent: 'center',
    gap: 8,
  },
  opponentPanel: {
    flex: 1,
    flexBasis: 190,
    minWidth: 170,
    justifyContent: 'center',
  },
  opponentTitle: {
    color: COLORS.mutedText,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  opponentOptions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  opponentButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.neutralLine,
    backgroundColor: COLORS.board,
    paddingHorizontal: 8,
  },
  selectedOpponentButton: {
    borderColor: COLORS.gold,
    backgroundColor: '#40391E',
  },
  opponentButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  continueButton: {
    width: 154,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#34D399',
    backgroundColor: COLORS.emerald,
  },
  continueButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});

const desktopStyles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 1440, alignSelf: 'center', paddingHorizontal: 28, paddingVertical: 20 },
  modeCards: { flex: 1, alignItems: 'center', gap: 16 },
  modeCard: { width: '100%', flex: 1, maxHeight: 380, padding: 16 },
  modeName: { fontSize: 22, lineHeight: 30 },
  previewContainer: { height: 130 },
  modeStats: { fontSize: 16 },
  modeSize: { fontSize: 15, marginTop: 6 },
  modeDescription: { fontSize: 13, marginTop: 6 },
  opponentTitle: { fontSize: 14 },
  opponentButtonText: { fontSize: 14 },
});
