/**
 * Audio Synthesizer
 * Generates game sound effects using Web Audio API, so no external audio files needed
 */
class AudioSynthesizer {
    constructor() {
        // Check for Web Audio API support
        this.supported = 'AudioContext' in window || 'webkitAudioContext' in window;
        
        if (!this.supported) {
            console.warn('Web Audio API not supported in this browser');
            return;
        }
        
        // Create audio context
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master volume control
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.4; // Set default volume to 40%
        this.masterGain.connect(this.audioCtx.destination);
        
        // Keep track of active sound sources for pausability
        this.activeSources = [];
        this.paused = false;
        
        // Create background drone
        this.backgroundDrone = null;
    }
    
    // Resume AudioContext (needed because of autoplay policies)
    resumeAudioContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    
    // Set master volume (0-1)
    setVolume(value) {
        if (!this.supported) return;
        
        // Clamp value between 0 and 1
        const volume = Math.min(Math.max(value, 0), 1);
        
        // Gradual transition to avoid clicks
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setTargetAtTime(volume, now, 0.03);
    }
    
    // Pause all active sounds
    pauseAudio() {
        if (!this.supported) return;
        
        this.audioCtx.suspend();
        this.paused = true;
    }
    
    // Resume all active sounds
    resumeAudio() {
        if (!this.supported) return;
        
        this.audioCtx.resume();
        this.paused = false;
    }
    
    // Clean up completed sound sources
    cleanupSources() {
        this.activeSources = this.activeSources.filter(source => 
            source.endTime === undefined || this.audioCtx.currentTime < source.endTime);
    }
    
    // Create a simple oscillator with envelope
    createOscillator(type, frequency, startTime, duration, amplitude = 1, envelope = true) {
        if (!this.supported) return null;
        
        this.resumeAudioContext();
        
        const now = startTime || this.audioCtx.currentTime;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // ADSR envelope parameters
        const attack = envelope ? 0.02 : 0;
        const decay = envelope ? 0.05 : 0;
        const sustain = envelope ? 0.7 : 1;
        const release = envelope ? 0.1 : 0;
        
        // Connect oscillator through gain node to master output
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Start with zero gain
        gainNode.gain.value = 0;
        
        // Attack phase
        gainNode.gain.setTargetAtTime(amplitude, now, attack);
        
        // Decay phase
        gainNode.gain.setTargetAtTime(sustain * amplitude, now + attack, decay);
        
        // Start oscillator
        oscillator.start(now);
        
        // Schedule stop time with release
        if (duration) {
            const stopTime = now + duration;
            
            // Release phase
            gainNode.gain.setTargetAtTime(0, stopTime - release, release);
            
            // Stop the oscillator
            oscillator.stop(stopTime + release * 4);
            
            // Add to active sources with end time for cleanup
            this.activeSources.push({
                source: oscillator,
                gain: gainNode,
                endTime: stopTime + release * 4
            });
        } else {
            // Continuous sound with no scheduled end
            this.activeSources.push({
                source: oscillator,
                gain: gainNode
            });
        }
        
        return {
            oscillator,
            gainNode,
            stop: () => {
                const releaseTime = this.audioCtx.currentTime;
                gainNode.gain.setTargetAtTime(0, releaseTime, release);
                oscillator.stop(releaseTime + release * 4);
            }
        };
    }
    
    // Create a noise generator (white noise)
    createNoise(startTime, duration, amplitude = 1) {
        if (!this.supported) return null;
        
        this.resumeAudioContext();
        
        const now = startTime || this.audioCtx.currentTime;
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Fill the buffer with noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        // Create noise source
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        // Create gain node for amplitude control
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 0; // Start silent
        
        // Create filter to shape the noise
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000; // Center frequency
        filter.Q.value = 1; // Width of the band
        
        // Connect everything
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Attack
        gainNode.gain.setTargetAtTime(amplitude, now, 0.01);
        
        // Start noise
        noise.start(now);
        
        // Schedule stop if duration provided
        if (duration) {
            const stopTime = now + duration;
            
            // Release
            gainNode.gain.setTargetAtTime(0, stopTime - 0.1, 0.1);
            noise.stop(stopTime + 0.4);
            
            // Add to active sources with end time for cleanup
            this.activeSources.push({
                source: noise,
                gain: gainNode,
                endTime: stopTime + 0.4
            });
        } else {
            // Continuous sound with no scheduled end
            this.activeSources.push({
                source: noise,
                gain: gainNode
            });
        }
        
        return {
            source: noise,
            gain: gainNode,
            filter: filter,
            stop: () => {
                const releaseTime = this.audioCtx.currentTime;
                gainNode.gain.setTargetAtTime(0, releaseTime, 0.1);
                noise.stop(releaseTime + 0.4);
            }
        };
    }
    
    // Create a sound effect with frequency sweep
    createSweep(startFreq, endFreq, duration, type = 'sawtooth', amplitude = 0.5) {
        if (!this.supported) return;
        
        this.resumeAudioContext();
        
        const now = this.audioCtx.currentTime;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = startFreq;
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        
        gainNode.gain.value = 0;
        gainNode.gain.setTargetAtTime(amplitude, now, 0.01);
        gainNode.gain.setTargetAtTime(0, now + duration - 0.1, 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration + 0.2);
        
        this.activeSources.push({
            source: oscillator,
            gain: gainNode,
            endTime: now + duration + 0.2
        });
    }
    
    // Create a chord of oscillators
    createChord(frequencies, type, duration, amplitude = 0.3) {
        if (!this.supported) return;
        
        this.resumeAudioContext();
        
        const now = this.audioCtx.currentTime;
        
        for (const freq of frequencies) {
            this.createOscillator(type, freq, now, duration, amplitude / Math.sqrt(frequencies.length));
        }
    }
    
    // Play layered ambient background
    playAmbientBackground() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Deep bass drone
        const bassDrone = this.createOscillator('sine', 55, now, null, 0.2, false);
        bassDrone.gainNode.gain.value = 0;
        bassDrone.gainNode.gain.setTargetAtTime(0.15, now, 2); // Slow fade in
        
        // Higher harmonics with slow modulation
        const harmonics = this.createOscillator('sine', 110, now, null, 0.1, false);
        harmonics.gainNode.gain.value = 0;
        harmonics.gainNode.gain.setTargetAtTime(0.1, now, 3);
        
        // Create an LFO to modulate the harmonic frequency for movement
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 0.05; // Very slow modulation
        lfoGain.gain.value = 5; // Modulation depth
        
        lfo.connect(lfoGain);
        lfoGain.connect(harmonics.oscillator.frequency);
        lfo.start(now);
        
        // Subtle noise component for texture
        const noise = this.createNoise(now, null, 0.03);
        noise.gain.gain.value = 0;
        noise.gain.gain.setTargetAtTime(0.03, now, 4);
        noise.filter.frequency.value = 2000;
        noise.filter.Q.value = 2;
        
        // Store references to stop later if needed
        this.backgroundDrone = {
            bassDrone,
            harmonics,
            lfo,
            lfoGain,
            noise
        };
    }
    
    // Play laser/shoot sound effect
    playShoot() {
        if (!this.supported) return;
        
        this.createSweep(1200, 600, 0.15, 'sawtooth', 0.15);
        this.createOscillator('sine', 880, null, 0.05, 0.1);
    }
    
    // Play explosion effect
    playExplosion() {
        if (!this.supported) return;
        
        // Create noise burst
        const noise = this.createNoise(null, 0.5, 0.3);
        
        // Add low frequency impact
        this.createOscillator('sine', 60, null, 0.6, 0.4);
        this.createOscillator('square', 100, null, 0.3, 0.2);
    }
    
    // Play data collection sound
    playDataCollect() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Ascending notes
        this.createOscillator('sine', 523.25, now, 0.1, 0.2); // C5
        this.createOscillator('sine', 659.25, now + 0.08, 0.1, 0.2); // E5
        this.createOscillator('sine', 783.99, now + 0.16, 0.15, 0.2); // G5
    }
    
    // Play power-up effect
    playPowerUp() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Ascending sweep
        this.createSweep(300, 1200, 0.5, 'sine', 0.2);
        
        // Harmonics
        setTimeout(() => {
            this.createChord([523.25, 659.25, 783.99], 'sine', 0.4, 0.2);
        }, 200);
    }
    
    // Play damage taken effect
    playDamage() {
        if (!this.supported) return;
        
        this.createSweep(400, 100, 0.3, 'sawtooth', 0.25);
        this.createNoise(null, 0.2, 0.2);
    }
    
    // Play game start sound
    playGameStart() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Startup chord sequence
        this.createChord([261.63, 329.63, 392.00], 'sine', 0.6, 0.15); // C major
        setTimeout(() => {
            this.createChord([293.66, 349.23, 440.00], 'sine', 0.6, 0.15); // D minor
        }, 600);
        setTimeout(() => {
            this.createChord([329.63, 392.00, 493.88], 'sine', 0.8, 0.15); // E minor
        }, 1200);
    }
    
    // Play game over sound
    playGameOver() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Descending tone
        this.createSweep(400, 100, 1, 'sawtooth', 0.3);
        
        // Dissonant chord
        setTimeout(() => {
            this.createChord([261.63, 277.18, 493.88], 'square', 1.5, 0.2);
        }, 500);
        
        // Final noise burst
        setTimeout(() => {
            this.createNoise(null, 0.6, 0.2);
        }, 1500);
    }
    
    // Play level complete sound
    playLevelComplete() {
        if (!this.supported) return;
        
        const now = this.audioCtx.currentTime;
        
        // Victory arpeggio
        this.createOscillator('triangle', 523.25, now, 0.15, 0.2); // C5
        this.createOscillator('triangle', 659.25, now + 0.15, 0.15, 0.2); // E5
        this.createOscillator('triangle', 783.99, now + 0.3, 0.15, 0.2); // G5
        this.createOscillator('triangle', 1046.50, now + 0.45, 0.3, 0.3); // C6
        
        // Chord
        setTimeout(() => {
            this.createChord([523.25, 659.25, 783.99, 1046.50], 'sine', 1, 0.15);
        }, 800);
    }
    
    // Play level up sound
    playLevelUp() {
        if (!this.supported) return;
        
        // Quick ascending sweep
        this.createSweep(400, 1200, 0.4, 'sine', 0.2);
        
        // Followed by chord
        setTimeout(() => {
            this.createChord([523.25, 659.25, 783.99], 'triangle', 0.6, 0.15);
        }, 400);
    }
}

// Make globally available
window.AudioSynthesizer = AudioSynthesizer;
