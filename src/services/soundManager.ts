import { AudioPlayer } from 'expo-audio';

type SoundStopCallback = () => void;

class SoundManager {
  private currentPlayer: AudioPlayer | null = null;
  private currentStopCallback: SoundStopCallback | null = null;

  async registerAndPlay(player: AudioPlayer, onStop?: SoundStopCallback) {
    if (this.currentPlayer && this.currentPlayer !== player) {
      await this.stopCurrent();
    }
    this.currentPlayer = player;
    this.currentStopCallback = onStop || null;
  }

  async stopCurrent() {
    if (this.currentPlayer) {
      const playerToStop = this.currentPlayer;
      const callback = this.currentStopCallback;
      
      this.currentPlayer = null;
      this.currentStopCallback = null;

      try {
        if (callback) {
          callback();
        }
        playerToStop.pause();
        if (typeof (playerToStop as any).release === 'function') {
          (playerToStop as any).release();
        }
      } catch (err) {
        // ignore errors
      }
    }
  }

  async onSoundFinished(player: AudioPlayer) {
    if (this.currentPlayer === player) {
      this.currentPlayer = null;
      this.currentStopCallback = null;
    }
  }

  getCurrentSound(): AudioPlayer | null {
    return this.currentPlayer;
  }
}

export const soundManager = new SoundManager();
