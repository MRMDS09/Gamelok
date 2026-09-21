import React, { useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

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
  const selectedValue = stepIndex / 10;

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
      <Text style={styles.volumePercentage}>{Math.round(selectedValue * 100)}%</Text>
      <View style={styles.volumePointsRow}>
        {Array.from({ length: 11 }, (_, index) => {
          const percentage = index * 10;
          const isSelected = index === stepIndex;
          const isActive = index <= stepIndex;

          return (
            <Pressable
              key={index}
              style={styles.volumePointCell}
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

  const SettingItem = ({ 
    title, 
    description, 
    children 
  }: { 
    title: string; 
    description: string; 
    children: React.ReactNode;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>الإعدادات</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.settingsGrid}>
        {/* إعدادات الموسيقى الخلفية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 الموسيقى الخلفية</Text>
          
          <SettingItem
            title="تفعيل الموسيقى الخلفية"
            description="تشغيل موسيقى خلفية أثناء اللعب"
          >
            <Switch
              value={settings.backgroundMusicEnabled}
              onValueChange={(value) => updateSetting('backgroundMusicEnabled', value)}
              trackColor={{ false: '#52627E', true: '#22D3EE' }}
              thumbColor={settings.backgroundMusicEnabled ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>

          {settings.backgroundMusicEnabled && (
            <SettingItem
              title="مستوى الصوت"
              description={`${Math.round(settings.backgroundMusicVolume * 100)}%`}
            >
              <SteppedVolumeControl
                key="background-music-volume"
                testID="background-music-volume"
                source="music"
                value={settings.backgroundMusicVolume}
                onValueChange={handleBackgroundMusicVolumeChange}
              />
            </SettingItem>
          )}
        </View>

        {/* إعدادات الأصوات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 الأصوات</Text>
          
          <SettingItem
            title="أصوات النقر"
            description="تشغيل صوت عند رسم الخطوط"
          >
            <Switch
              value={settings.clickSoundsEnabled}
              onValueChange={(value) => updateSetting('clickSoundsEnabled', value)}
              trackColor={{ false: '#52627E', true: '#22D3EE' }}
              thumbColor={settings.clickSoundsEnabled ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>

          {settings.clickSoundsEnabled && (
            <SettingItem
              title="مستوى صوت النقر"
              description={`${Math.round(settings.clickSoundVolume * 100)}%`}
            >
              <SteppedVolumeControl
                key="click-sound-volume"
                testID="click-sound-volume"
                source="click"
                value={settings.clickSoundVolume}
                onValueChange={handleClickSoundVolumeChange}
                onValueComplete={handleClickSoundVolumeComplete}
              />
            </SettingItem>
          )}

          <SettingItem
            title="التأثيرات الصوتية"
            description="تشغيل أصوات إضافية للعبة"
          >
            <Switch
              value={settings.soundEffectsEnabled}
              onValueChange={(value) => updateSetting('soundEffectsEnabled', value)}
              trackColor={{ false: '#52627E', true: '#22D3EE' }}
              thumbColor={settings.soundEffectsEnabled ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>
        </View>

        </View>
        {/* إعادة تعيين الإعدادات */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleReset}
        >
          <Text style={styles.resetButtonText}>🔄 إعادة تعيين الإعدادات</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 حفظ الإعدادات</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 14,
  },
  backButton: {
    minWidth: 86,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 25, 60, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    borderRadius: 14,
  },
  backButtonText: {
    fontSize: 16,
    color: '#B9F5FF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  settingsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  section: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 51, 0.84)',
    borderColor: 'rgba(130, 194, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    shadowColor: '#020716',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B9F5FF',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(170, 215, 255, 0.13)',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 4,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingDescription: {
    fontSize: 11,
    color: '#B8CBE0',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingControl: {
    minWidth: 50,
    alignItems: 'center',
  },
  steppedVolumeControl: {
    width: 297,
    minHeight: 70,
    alignItems: 'stretch',
  },
  volumePercentage: {
    color: '#B9F5FF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
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
  volumePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  volumePointActive: {
    backgroundColor: '#22D3EE',
  },
  volumePointInactive: {
    backgroundColor: '#52627E',
  },
  volumePointSelected: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#B9F5FF',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
  },
  volumeEndpointLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  volumeEndpointText: {
    color: '#B8CBE0',
    fontSize: 10,
  },
  resetButton: {
    backgroundColor: 'rgba(9, 25, 60, 0.86)',
    borderColor: 'rgba(255, 122, 26, 0.65)',
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#168F48',
    borderColor: '#54E386',
    borderWidth: 1,
    minHeight: 44,
    marginHorizontal: 16,
    marginVertical: 7,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#020716',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
