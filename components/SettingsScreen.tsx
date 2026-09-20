import React, { useRef, useState } from 'react';
import { PanResponder, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

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

const normalizeSettings = (settings: GameSettings): GameSettings => ({
  backgroundMusicEnabled: settings.backgroundMusicEnabled,
  backgroundMusicVolume: clampVolume(settings.backgroundMusicVolume),
  clickSoundsEnabled: settings.clickSoundsEnabled,
  clickSoundVolume: clampVolume(settings.clickSoundVolume),
  soundEffectsEnabled: settings.soundEffectsEnabled,
});

// مكون Slider مخصص
const CustomSlider: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  testID: string;
  source: 'music' | 'click';
  style?: any;
}> = ({ value, onValueChange, onSlidingComplete, minimumValue = 0, maximumValue = 1, testID, source, style }) => {
  const thumbSize = 26;
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const currentValueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingCompleteRef = useRef(onSlidingComplete);

  currentValueRef.current = value;
  onValueChangeRef.current = onValueChange;
  onSlidingCompleteRef.current = onSlidingComplete;

  const updateValueFromTouch = (touchX: number) => {
    const measuredWidth = trackWidthRef.current;
    const usableWidth = measuredWidth - thumbSize;
    const valueRange = maximumValue - minimumValue;
    if (usableWidth <= 0 || valueRange <= 0) return;

    const ratio = clampVolume((touchX - thumbSize / 2) / usableWidth);
    const nextValue = minimumValue + ratio * valueRange;
    currentValueRef.current = nextValue;
    onValueChangeRef.current(nextValue);
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX);
    },
    onPanResponderRelease: () => {
      const finalValue = currentValueRef.current;
      if (__DEV__) {
        console.log(`[SLIDER END] source=${source} value=${finalValue.toFixed(2)}`);
      }
      onSlidingCompleteRef.current?.(finalValue);
    },
    onPanResponderTerminate: () => {},
  })).current;

  const valueRange = maximumValue - minimumValue;
  const normalizedValue = valueRange > 0 ? (value - minimumValue) / valueRange : 0;
  const thumbPosition = Math.max(0, Math.min(1, normalizedValue))
    * Math.max(0, trackWidth - thumbSize);
  const progressWidth = Math.max(0, Math.min(1, normalizedValue))
    * Math.max(0, trackWidth - thumbSize);

  return (
    <View
      style={[styles.customSliderContainer, style]}
      testID={testID}
      nativeID={testID}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        trackWidthRef.current = width;
        setTrackWidth(width);
      }}
      {...panResponder.panHandlers}
    >
      <View
        style={styles.sliderTrack}
        pointerEvents="none"
      >
        <View 
          style={[
            styles.sliderProgress, 
            { width: progressWidth }
          ]}
          pointerEvents="none"
        />
      </View>
      <View
        style={[
          styles.sliderThumbTouchTarget,
          { left: thumbPosition - 9 },
        ]}
        pointerEvents="none"
      >
        <View style={styles.sliderThumb} pointerEvents="none" />
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
    applyDraftPatch({ backgroundMusicVolume: clampVolume(value) });
  };

  const handleClickSoundVolumeChange = (value: number) => {
    applyDraftPatch({ clickSoundVolume: clampVolume(value) });
  };

  const handleClickSoundVolumeComplete = (value: number) => {
    onPreviewClickSound(clampVolume(value));
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
              <CustomSlider
                key="background-music-volume"
                testID="background-music-volume"
                source="music"
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
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
              <CustomSlider
                key="click-sound-volume"
                testID="click-sound-volume"
                source="click"
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={settings.clickSoundVolume}
                onValueChange={handleClickSoundVolumeChange}
                onSlidingComplete={handleClickSoundVolumeComplete}
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
  slider: {
    width: 180,
    height: 48,
  },
  customSliderContainer: {
    width: 180,
    height: 48,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    marginHorizontal: 13,
    backgroundColor: '#52627E',
    borderRadius: 4,
    position: 'relative',
  },
  sliderProgress: {
    height: 8,
    backgroundColor: '#22D3EE',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 26,
    height: 26,
    backgroundColor: '#22D3EE',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderThumbTouchTarget: {
    position: 'absolute',
    top: 2,
    width: 44,
    height: 44,
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
