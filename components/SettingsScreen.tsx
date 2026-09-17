import React, { useState } from 'react';
import { PanResponder, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface SettingsScreenProps {
  onBack: () => void;
  onSaveSettings: (settings: GameSettings) => void;
  initialSettings?: GameSettings;
}

export interface GameSettings {
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  clickSoundsEnabled: boolean;
  clickSoundVolume: number;
  vibrationEnabled: boolean;
  soundEffectsEnabled: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.7,
  clickSoundsEnabled: true,
  clickSoundVolume: 0.8,
  vibrationEnabled: true,
  soundEffectsEnabled: true,
};

// مكون Slider مخصص
const CustomSlider: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  style?: any;
}> = ({ value, onValueChange, minimumValue = 0, maximumValue = 1, style }) => {
  const sliderWidth = 120;
  const thumbSize = 20;
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const x = evt.nativeEvent.locationX;
      const newValue = Math.max(minimumValue, Math.min(maximumValue, 
        ((x - thumbSize / 2) / (sliderWidth - thumbSize)) * (maximumValue - minimumValue) + minimumValue
      ));
      onValueChange(newValue);
    },
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const newValue = Math.max(minimumValue, Math.min(maximumValue, 
        ((x - thumbSize / 2) / (sliderWidth - thumbSize)) * (maximumValue - minimumValue) + minimumValue
      ));
      onValueChange(newValue);
    },
  });

  const thumbPosition = ((value - minimumValue) / (maximumValue - minimumValue)) * (sliderWidth - thumbSize);

  return (
    <View style={[styles.customSliderContainer, style]}>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderProgress, 
            { width: thumbPosition + thumbSize / 2 }
          ]} 
        />
        <View
          style={[
            styles.sliderThumb,
            { left: thumbPosition }
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onSaveSettings,
  initialSettings = DEFAULT_SETTINGS,
}) => {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);

  const handleSave = () => {
    onSaveSettings(settings);
    onBack();
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={settings.backgroundMusicVolume}
                onValueChange={(value) => updateSetting('backgroundMusicVolume', value)}
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
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={settings.clickSoundVolume}
                onValueChange={(value) => updateSetting('clickSoundVolume', value)}
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

        {/* إعدادات أخرى */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ إعدادات أخرى</Text>
          
          <SettingItem
            title="الاهتزاز"
            description="تفعيل الاهتزاز عند النقر"
          >
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              trackColor={{ false: '#52627E', true: '#22D3EE' }}
              thumbColor={settings.vibrationEnabled ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>
        </View>

        </View>
        {/* إعادة تعيين الإعدادات */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => setSettings(DEFAULT_SETTINGS)}
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
    width: 120,
    height: 40,
  },
  customSliderContainer: {
    width: 120,
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#52627E',
    borderRadius: 2,
    position: 'relative',
  },
  sliderProgress: {
    height: 4,
    backgroundColor: '#22D3EE',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: '#22D3EE',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
