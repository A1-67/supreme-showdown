// Audio Manager for Supreme Showdown
import Phaser from 'phaser';

export class AudioManager {
    /**
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.muted = false;
        this.musicVolume = 0.28;
        this.sfxVolume = 0.6;

        this.music = null;
        this.sounds = {};
        this.audioContext = null;
        this.musicNodes = null;
        this.musicInterval = null;
    }

    preload(scene) {
    scene.load.audio('court-battle', 'assets/audio/court-battle.mp3');
}

init(scene) {
    this.scene = scene;

    const sfxKeys = [
        'gavel-hit',
        'super-charge'
    ];

    sfxKeys.forEach(key => {
        try {
            this.sounds[key] = scene.sound.add(key);
        } catch (e) {
            console.warn(`Failed to register sound: ${key}`, e);
        }
    });

    // Background music
    try {
        this.music = scene.sound.add('court-battle', {
            volume: 0.35,
            loop: true
        });

        this.music.play();
    } catch (e) {
        console.warn('Music failed to start', e);
    }
}

    init() {
        this.createAudioContext();

        try {
            this.music = this.scene.sound.add('court-battle', { loop: true, volume: this.musicVolume });
        } catch (e) {
            console.warn('Court-battle asset music unavailable, using procedural music.', e);
            this.music = null;
        }

        const sfxKeys = ['gavel-hit', 'super-charge'];
        sfxKeys.forEach(key => {
            try {
                this.sounds[key] = this.scene.sound.add(key, { volume: this.sfxVolume });
            } catch (e) {
                console.warn(`Asset SFX unavailable: ${key}`, e);
            }
        });
    }

    createAudioContext() {
        if (this.audioContext) return;
        const ctx = window.AudioContext || window.webkitAudioContext;
        if (!ctx) return;
        this.audioContext = new ctx();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {
                // Ignore resume failures until first gesture.
            });
        }
    }

    playMusic() {
        if (this.muted) return;
        this.createAudioContext();

        if (this.music) {
            if (!this.music.isPlaying) {
                try {
                    this.music.play();
                } catch (e) {
                    console.warn('Browser blocked asset music playback, switching to procedural music.', e);
                    this.startProceduralMusic();
                }
            }
            return;
        }

        this.startProceduralMusic();
    }

    startProceduralMusic() {
        if (!this.audioContext || this.muted) return;
        if (this.musicNodes) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }

        const gain = this.audioContext.createGain();
        gain.gain.value = this.musicVolume;
        gain.connect(this.audioContext.destination);

        const root = 110;
        const melodyNotes = [root * 2, root * 2.25, root * 2.5, root * 3];

        const oscillators = melodyNotes.map((frequency, index) => {
            const osc = this.audioContext.createOscillator();
            osc.type = index % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.value = frequency;
            osc.originalFrequency = frequency;
            osc.connect(gain);
            osc.start();
            return osc;
        });

        const bass = this.audioContext.createOscillator();
        bass.type = 'square';
        bass.frequency.value = root;
        bass.originalFrequency = root;
        bass.connect(gain);
        bass.start();
        oscillators.push(bass);

        this.musicNodes = { oscillators, gain };

        this.musicInterval = setInterval(() => {
            oscillators.forEach((osc, index) => {
                const detune = (index % 2 === 0 ? 1 : -1) * 12;
                const target = osc.originalFrequency + detune;
                osc.frequency.setValueAtTime(target, this.audioContext.currentTime);
                setTimeout(() => {
                    if (this.audioContext && osc) {
                        osc.frequency.setValueAtTime(osc.originalFrequency, this.audioContext.currentTime + 0.24);
                    }
                }, 240);
            });
        }, 500);
    }

    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }

        if (this.musicNodes) {
            this.musicNodes.oscillators.forEach((osc) => {
                try {
                    osc.stop();
                } catch (_) {
                    // ignore already stopped oscillators
                }
            });
            this.musicNodes = null;
        }

        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    playSFX(key) {
        if (this.muted) return;
        if (this.sounds[key]) {
            try {
                this.sounds[key].play();
            } catch (e) {
                console.warn(`Failed to play asset SFX: ${key}, falling back to generated FX.`, e);
                this.playProceduralSFX(key);
            }
        } else {
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
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.16);
                gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.17);
            } else if (key === 'super-charge') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(760, audioCtx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.5);
            } else if (key === 'cheer-applause') {
                const bufferSize = audioCtx.sampleRate * 0.7;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1200;
                filter.Q.value = 1.2;
                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);
                noise.start();
                noise.stop(audioCtx.currentTime + 0.7);
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
            if (this.audioContext && this.audioContext.state === 'running') {
                this.audioContext.suspend().catch(() => {});
            }
        } else {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(() => {});
            }
            if (this.music) {
                if (this.music.isPaused) {
                    this.music.resume();
                } else {
                    this.playMusic();
                }
            } else {
                this.startProceduralMusic();
            }
        }
        return this.muted;
    }
}
