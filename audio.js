// Audio Manager for Supreme Showdown
import Phaser from 'phaser';

export class AudioManager {
    /**
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.muted = false;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.6;
        
        this.music = null;
        this.sounds = {};
    }

    preload() {
        // Load generated audio files
        this.scene.load.audio('court-battle', 'assets/audio/court-battle.mp3');
        this.scene.load.audio('gavel-hit', 'assets/audio/gavel-hit.mp3');
        this.scene.load.audio('cheer-applause', 'assets/audio/cheer-applause.mp3');
        this.scene.load.audio('super-charge', 'assets/audio/super-charge.mp3');
    }

    init() {
        // Setup background music
        try {
            this.music = this.scene.sound.add('court-battle', { loop: true, volume: this.musicVolume });
        } catch (e) {
            console.warn('Failed to register court-battle track', e);
        }

        const sfxKeys = ['gavel-hit', 'cheer-applause', 'super-charge'];
        sfxKeys.forEach(key => {
            try {
                this.sounds[key] = this.scene.sound.add(key, { volume: this.sfxVolume });
            } catch (e) {
                console.warn(`Failed to register sound: ${key}`, e);
            }
        });
    }

    playMusic() {
        if (this.muted) return;
        if (this.music && !this.music.isPlaying) {
            try {
                this.music.play();
            } catch (e) {
                console.warn('Playback blocked by browser audio policy. Will retry on first user input.');
            }
        }
    }

    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }

    playSFX(key) {
        if (this.muted) return;
        if (this.sounds[key]) {
            try {
                this.sounds[key].play();
            } catch (e) {
                console.warn(`Failed to play SFX: ${key}`, e);
            }
        } else {
            // Procedural fallback SFX using browser synthesizer to ensure auditory feedback
            this.playProceduralSFX(key);
        }
    }

    playProceduralSFX(key) {
        try {
            const ctx = window.AudioContext || window.webkitAudioContext;
            if (!ctx) return;
            const audioCtx = new ctx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (key === 'gavel-hit') {
                // Short low frequency woodblock tap
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.16);
            } else if (key === 'super-charge') {
                // Rising laser power-up
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.5);
            } else if (key === 'cheer-applause') {
                // Procedural white noise burst for applause
                const bufferSize = audioCtx.sampleRate * 0.8;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1000;
                filter.Q.value = 1.0;

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);
                noise.start();
                noise.stop(audioCtx.currentTime + 0.8);
            }
        } catch (err) {
            console.error('Procedural audio failed:', err);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            if (this.music && this.music.isPlaying) {
                this.music.pause();
            }
        } else {
            if (this.music) {
                if (this.music.isPaused) {
                    this.music.resume();
                } else {
                    this.playMusic();
                }
            }
        }
        return this.muted;
    }
}
