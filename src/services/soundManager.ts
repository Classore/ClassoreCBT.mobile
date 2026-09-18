import { Audio } from 'expo-av';

type SoundStopCallback = () => void;

class SoundManager {
  private currentSound: Audio.Sound | null = null;
  private currentStopCallback: SoundStopCallback | null = null;

  async registerAndPlay(sound: Audio.Sound, onStop?: SoundStopCallback) {
    if (this.currentSound && this.currentSound !== sound) {
      await this.stopCurrent();
    }
    this.currentSound = sound;
    this.currentStopCallback = onStop || null;
  }

  async stopCurrent() {
    if (this.currentSound) {
      const soundToStop = this.currentSound;
      const callback = this.currentStopCallback;
      
      this.currentSound = null;
      this.currentStopCallback = null;

      try {
        if (callback) {
          callback();
        }
        await soundToStop.stopAsync().catch(() => {});
        await soundToStop.unloadAsync().catch(() => {});
      } catch (err) {
        // ignore unload errors
      }
    }
  }

  async onSoundFinished(sound: Audio.Sound) {
    if (this.currentSound === sound) {
      this.currentSound = null;
      this.currentStopCallback = null;
    }
  }

  getCurrentSound(): Audio.Sound | null {
    return this.currentSound;
  }
}

export const soundManager = new SoundManager();
