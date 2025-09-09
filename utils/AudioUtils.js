// أدوات الصوت المحسنة للعبة
import { createBackgroundMusic, createClickSound, createBoxCompleteSound, createGameOverSound } from '../assets/background-music';

class AudioUtils {
  constructor() {
    this.audioContext = null;
    this.backgroundMusicInterval = null;
    this.isPlaying = false;
    this.volume = 0.7;
  }

  // تهيئة Audio Context
  initAudioContext() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // تشغيل نغمة بسيطة
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // تشغيل الموسيقى الخلفية
  playBackgroundMusic() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const music = createBackgroundMusic();
    let currentNote = 0;

    const playNextNote = () => {
      if (!this.isPlaying) return;

      const note = music.notes[currentNote];
      this.playTone(note.frequency, note.duration, 'sine', 0.1);

      currentNote = (currentNote + 1) % music.notes.length;
      
      setTimeout(playNextNote, note.duration * 1000);
    };

    playNextNote();
  }

  // إيقاف الموسيقى الخلفية
  stopBackgroundMusic() {
    this.isPlaying = false;
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
  }

  // تشغيل صوت النقر
  playClickSound() {
    const clickSound = createClickSound();
    this.playTone(clickSound.frequency, clickSound.duration, clickSound.type, 0.2);
  }

  // تشغيل صوت إكمال المربع
  playBoxCompleteSound() {
    const boxSound = createBoxCompleteSound();
    this.playTone(boxSound.frequency, boxSound.duration, boxSound.type, 0.3);
  }

  // تشغيل صوت نهاية اللعبة
  playGameOverSound() {
    const gameOverSound = createGameOverSound();
    this.playTone(gameOverSound.frequency, gameOverSound.duration, gameOverSound.type, 0.4);
  }

  // تحديث مستوى الصوت
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // محاكاة الاهتزاز
  vibrate(duration = 50) {
    if (navigator && navigator.vibrate) {
      navigator.vibrate(duration);
    } else {
      // محاكاة الاهتزاز بصوت
      this.playTone(200, 0.1, 'square', 0.1);
    }
  }
}

export default new AudioUtils();
