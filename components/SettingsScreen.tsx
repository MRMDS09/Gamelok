import React, { useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './theme';

interface SettingsScreenProps {
  onBack: () => void;
  onSaveSettings: (settings: GameSettings) => void;
  onPreviewSettings: (settings: GameSettings) => void;
  onPreviewClickSound: (volume: number) => void;
  initialSettings?: GameSettings;
}

export interface GameSettings {
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  clickSoundsEnabled: boolean;
  clickSoundVolume: number;
  soundEffectsEnabled: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.7,
  clickSoundsEnabled: true,
  clickSoundVolume: 0.8,
  soundEffectsEnabled: true,
};

const clampVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const VOLUME_STEP = 0.1;

const snapVolumeToStep = (value: number) =>
  Number((Math.round(clampVolume(value) / VOLUME_STEP) * VOLUME_STEP).toFixed(1));

const normalizeSettings = (settings: GameSettings): GameSettings => ({
  backgroundMusicEnabled: settings.backgroundMusicEnabled,
  backgroundMusicVolume: snapVolumeToStep(settings.backgroundMusicVolume),
  clickSoundsEnabled: settings.clickSoundsEnabled,
  clickSoundVolume: snapVolumeToStep(settings.clickSoundVolume),
  soundEffectsEnabled: settings.soundEffectsEnabled,
});

// مكون Slider مخصص
const SteppedVolumeControl: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  onValueComplete?: (value: number) => void;
  testID: string;
  source: 'music' | 'click';
}> = ({ value, onValueChange, onValueComplete, testID, source }) => {
  const stepIndex = Math.max(0, Math.min(10, Math.round(clampVolume(value) * 10)));

  const handleSelectStep = (index: number) => {
    const uiVolume = index / 10;
    if (__DEV__) {
      console.log(`[VOLUME TAP] source=${source} index=${index} ui=${uiVolume.toFixed(2)}`);
    }
    onValueChange(uiVolume);
    onValueComplete?.(uiVolume);
  };

  return (
    <View
      style={styles.steppedVolumeControl}
      testID={testID}
      nativeID={testID}
    >
      <View style={styles.volumePointsRow}>
        {Array.from({ length: 11 }, (_, index) => {
          const percentage = index * 10;
          const isSelected = index === stepIndex;
          const isActive = index <= stepIndex;

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.volumePointCell,
                pressed && styles.volumePointCellPressed,
              ]}
              onPress={() => handleSelectStep(index)}
              accessibilityRole="radio"
              accessibilityLabel={`مستوى الصوت ${percentage}%`}
              accessibilityHint={source === 'music' ? 'تحديد مستوى موسيقى الخلفية' : 'تحديد مستوى صوت النقر'}
              accessibilityState={{ selected: isSelected }}
              testID={`${testID}-step-${percentage}`}
            >
              <View style={[
                styles.volumePoint,
                isActive ? styles.volumePointActive : styles.volumePointInactive,
                isSelected && styles.volumePointSelected,
              ]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.volumeEndpointLabels}>
        <Text style={styles.volumeEndpointText}>0%</Text>
        <Text style={styles.volumeEndpointText}>100%</Text>
      </View>
    </View>
  );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onSaveSettings,
  onPreviewSettings,
  onPreviewClickSound,
  initialSettings = DEFAULT_SETTINGS,
}) => {
  const savedSettingsRef = useRef(normalizeSettings(initialSettings));
  const [settings, setSettings] = useState<GameSettings>(savedSettingsRef.current);
  const settingsRef = useRef(settings);

  const handleSave = () => {
    if (__DEV__) {
      console.log(`[AUDIO APPLY] music=${settingsRef.current.backgroundMusicVolume.toFixed(2)} click=${settingsRef.current.clickSoundVolume.toFixed(2)} action=save`);
    }
    onSaveSettings(settingsRef.current);
    onBack();
  };

  const handleBack = () => {
    const savedSettings = savedSettingsRef.current;
    if (__DEV__) {
      console.log(`[AUDIO APPLY] music=${savedSettings.backgroundMusicVolume.toFixed(2)} click=${savedSettings.clickSoundVolume.toFixed(2)} action=restore`);
    }
    onPreviewSettings(savedSettings);
    onBack();
  };

  const applyDraftPatch = (patch: Partial<GameSettings>) => {
    const next = normalizeSettings({ ...settingsRef.current, ...patch });
    settingsRef.current = next;
    setSettings(next);
    onPreviewSettings(next);
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    applyDraftPatch({ [key]: value });
  };

  const handleBackgroundMusicVolumeChange = (value: number) => {
    applyDraftPatch({ backgroundMusicVolume: snapVolumeToStep(value) });
  };

  const handleClickSoundVolumeChange = (value: number) => {
    applyDraftPatch({ clickSoundVolume: snapVolumeToStep(value) });
  };

  const handleClickSoundVolumeComplete = (value: number) => {
    onPreviewClickSound(snapVolumeToStep(value));
  };

  const handleReset = () => {
    applyDraftPatch(DEFAULT_SETTINGS);
    if (__DEV__) {
      console.log(`[AUDIO APPLY] music=${DEFAULT_SETTINGS.backgroundMusicVolume.toFixed(2)} click=${DEFAULT_SETTINGS.clickSoundVolume.toFixed(2)} action=reset`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>الإعدادات</Text>

        <View style={styles.audioRow}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioIcon}>♪</Text>
            <View style={styles.audioCopy}>
              <Text style={styles.audioTitle}>صوت الموسيقى</Text>
              <Text style={styles.audioPercentage}>{Math.round(settings.backgroundMusicVolume * 100)}%</Text>
            </View>
          </View>
          <View style={styles.switchCell}>
            <Switch
              value={settings.backgroundMusicEnabled}
              onValueChange={(value) => updateSetting('backgroundMusicEnabled', value)}
              trackColor={{ false: COLORS.mutedControl, true: COLORS.emerald }}
              thumbColor={COLORS.text}
              accessibilityLabel="تفعيل صوت الموسيقى"
            />
          </View>
          {settings.backgroundMusicEnabled && (
            <SteppedVolumeControl
              key="background-music-volume"
              testID="background-music-volume"
              source="music"
              value={settings.backgroundMusicVolume}
              onValueChange={handleBackgroundMusicVolumeChange}
            />
          )}
        </View>

        <View style={styles.audioRow}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioIcon}>◉</Text>
            <View style={styles.audioCopy}>
              <Text style={styles.audioTitle}>صوت النقر</Text>
              <Text style={styles.audioPercentage}>{Math.round(settings.clickSoundVolume * 100)}%</Text>
            </View>
          </View>
          <View style={styles.switchCell}>
            <Switch
              value={settings.clickSoundsEnabled}
              onValueChange={(value) => updateSetting('clickSoundsEnabled', value)}
              trackColor={{ false: COLORS.mutedControl, true: COLORS.emerald }}
              thumbColor={COLORS.text}
              accessibilityLabel="تفعيل صوت النقر"
            />
          </View>
          {settings.clickSoundsEnabled && (
            <SteppedVolumeControl
              key="click-sound-volume"
              testID="click-sound-volume"
              source="click"
              value={settings.clickSoundVolume}
              onValueChange={handleClickSoundVolumeChange}
              onValueComplete={handleClickSoundVolumeComplete}
            />
          )}
        </View>

        <View style={styles.effectsRow}>
          <View style={styles.effectsCopy}>
            <Text style={styles.effectsTitle}>التأثيرات الصوتية</Text>
            <Text style={styles.effectsDescription}>صوت اكتمال المربع ونهاية اللعبة</Text>
          </View>
          <View style={styles.switchCell}>
            <Switch
              value={settings.soundEffectsEnabled}
              onValueChange={(value) => updateSetting('soundEffectsEnabled', value)}
              trackColor={{ false: COLORS.mutedControl, true: COLORS.emerald }}
              thumbColor={COLORS.text}
              accessibilityLabel="تفعيل التأثيرات الصوتية"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>حفظ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={handleReset} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>إعادة التعيين</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.backButton]} onPress={handleBack} activeOpacity={0.82}>
            <Text style={styles.actionButtonText}>رجوع</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  panel: {
    width: '100%',
    maxWidth: 1060,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#2B354D',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: COLORS.gold,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 6,
  },
  audioRow: {
    minHeight: 76,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#273149',
  },
  audioInfo: {
    width: 136,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  audioIcon: {
    width: 26,
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  audioCopy: {
    flex: 1,
  },
  audioTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  audioPercentage: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  switchCell: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steppedVolumeControl: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: 'stretch',
  },
  volumePointsRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumePointCell: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumePointCellPressed: {
    opacity: 0.62,
  },
  volumePoint: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  volumePointActive: {
    backgroundColor: COLORS.mutedText,
  },
  volumePointInactive: {
    backgroundColor: COLORS.mutedControl,
  },
  volumePointSelected: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: COLORS.gold,
  },
  volumeEndpointLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  volumeEndpointText: {
    color: COLORS.mutedText,
    fontSize: 10,
  },
  effectsRow: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#273149',
  },
  effectsCopy: {
    flex: 1,
  },
  effectsTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  effectsDescription: {
    color: COLORS.mutedText,
    fontSize: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  saveButton: {
    backgroundColor: COLORS.emerald,
    borderColor: '#34D399',
  },
  resetButton: {
    backgroundColor: COLORS.board,
    borderColor: COLORS.gold,
  },
  backButton: {
    backgroundColor: COLORS.mutedControl,
    borderColor: COLORS.neutralLine,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
