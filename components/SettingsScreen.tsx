import React, { useState } from 'react';
import { PanResponder, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>الإعدادات</Text>
      </View>

      <View style={styles.content}>
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
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
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
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
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
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
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
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
              thumbColor={settings.vibrationEnabled ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingControl: {
    minWidth: 50,
    alignItems: 'flex-end',
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
    backgroundColor: '#bdc3c7',
    borderRadius: 2,
    position: 'relative',
  },
  sliderProgress: {
    height: 4,
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: '#3498db',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    margin: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
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
