import { Howl, Howler } from 'howler';

/**
 * AudioSystem - Professional 3D audio management
 * 
 * Features:
 * - 3D positional audio
 * - Sound pooling for performance
 * - Volume management
 * - Music layers and crossfading
 * - Audio categories (SFX, music, UI, ambient)
 * 
 * @example
 * const audio = new AudioSystem();
 * await audio.loadSound('sword_hit', '/sounds/sword_hit.mp3', { category: 'sfx', pool: 5 });
 * audio.play('sword_hit', { position: [0, 1, 0], volume: 0.8 });
 */
export class AudioSystem {
  constructor() {
    // Master volumes by category
    this.volumes = {
      master: 1.0,
      sfx: 0.8,
      music: 0.6,
      ui: 0.7,
      ambient: 0.5,
      voice: 1.0
    };
    
    // Sound library
    this.sounds = new Map(); // name -> { howl, config }
    
    // Currently playing sounds (for 3D positioning updates)
    this.activeSounds = new Map(); // soundId -> { name, position, sound }
    
    // Music system
    this.currentMusic = null;
    this.musicLayers = new Map(); // layer name -> howl
    this.isMusicPlaying = false;
    
    // Listener position (camera/player)
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    this.listenerOrientation = { x: 0, y: 0, z: -1 }; // forward vector
    
    // Global Howler settings
    Howler.autoUnlock = true;
    Howler.html5PoolSize = 10;
    
    // Audio context state
    this.isInitialized = false;
    this.isMuted = false;
  }
  
  /**
   * Initialize audio system (call after user interaction)
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // Unlock audio context on user interaction
    await Howler.ctx.resume();
    this.isInitialized = true;
    
    console.log('AudioSystem: Initialized');
  }
  
  /**
   * Load a sound into the system
   * @param {string} name - Sound identifier
   * @param {string|string[]} src - Path(s) to audio file(s)
   * @param {Object} config - Sound configuration
   */
  async loadSound(name, src, config = {}) {
    const defaultConfig = {
      category: 'sfx',      // sfx, music, ui, ambient, voice
      pool: 3,              // Number of simultaneous instances
      volume: 1.0,          // Base volume (0-1)
      rate: 1.0,            // Playback speed
      loop: false,          // Loop the sound
      sprite: null,         // Audio sprite definition
      spatial: false,       // Enable 3D positioning
      rolloff: 'linear',    // Distance model: linear, inverse, exponential
      refDistance: 1,       // Reference distance for 3D sound
      maxDistance: 100,     // Max distance for 3D sound
      distanceModel: 'linear'
    };
    
    const soundConfig = { ...defaultConfig, ...config };
    
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: Array.isArray(src) ? src : [src],
        volume: soundConfig.volume * this.volumes[soundConfig.category] * this.volumes.master,
        rate: soundConfig.rate,
        loop: soundConfig.loop,
        pool: soundConfig.pool,
        sprite: soundConfig.sprite,
        
        // 3D positioning
        pannerAttr: soundConfig.spatial ? {
          panningModel: 'HRTF',
          refDistance: soundConfig.refDistance,
          rolloffFactor: 1,
          distanceModel: soundConfig.distanceModel,
          maxDistance: soundConfig.maxDistance,
          coneInnerAngle: 360,
          coneOuterAngle: 360,
          coneOuterGain: 0
        } : null,
        
        onload: () => {
          console.log(`✓ Loaded sound: ${name}`);
          resolve(howl);
        },
        
        onloaderror: (id, error) => {
          console.error(`✗ Failed to load sound: ${name}`, error);
          reject(error);
        }
      });
      
      this.sounds.set(name, { howl, config: soundConfig });
    });
  }
  
  /**
   * Play a sound
   * @param {string} name - Sound identifier
   * @param {Object} options - Play options
   * @returns {number|null} Sound ID
   */
  play(name, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`AudioSystem: Sound not found: ${name}`);
      return null;
    }
    
    const { howl, config } = sound;
    
    // Apply options
    const playOptions = {
      volume: options.volume ?? 1.0,
      rate: options.rate ?? 1.0,
      loop: options.loop ?? config.loop,
      sprite: options.sprite ?? null,
      position: options.position ?? null, // [x, y, z]
      fade: options.fade ?? null // { from, to, duration }
    };
    
    // Play sound
    const soundId = playOptions.sprite 
      ? howl.play(playOptions.sprite)
      : howl.play();
    
    // Apply volume
    const finalVolume = playOptions.volume * config.volume * 
                       this.volumes[config.category] * this.volumes.master;
    howl.volume(finalVolume, soundId);
    
    // Apply rate
    howl.rate(playOptions.rate, soundId);
    
    // Apply loop
    howl.loop(playOptions.loop, soundId);
    
    // Apply 3D position
    if (config.spatial && playOptions.position) {
      howl.pos(
        playOptions.position[0],
        playOptions.position[1],
        playOptions.position[2],
        soundId
      );
      
      // Track for position updates
      this.activeSounds.set(soundId, {
        name,
        position: playOptions.position,
        sound: howl
      });
      
      // Remove from active when done
      howl.once('end', () => {
        this.activeSounds.delete(soundId);
      }, soundId);
    }
    
    // Apply fade
    if (playOptions.fade) {
      howl.fade(playOptions.fade.from, playOptions.fade.to, playOptions.fade.duration, soundId);
    }
    
    return soundId;
  }
  
  /**
   * Stop a sound or all instances of a sound
   * @param {string} name - Sound identifier
   * @param {number} [soundId] - Specific sound instance
   */
  stop(name, soundId = null) {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (soundId !== null) {
      sound.howl.stop(soundId);
      this.activeSounds.delete(soundId);
    } else {
      sound.howl.stop();
      // Remove all instances
      for (const [id, active] of this.activeSounds.entries()) {
        if (active.name === name) {
          this.activeSounds.delete(id);
        }
      }
    }
  }
  
  /**
   * Pause a sound
   */
  pause(name, soundId = null) {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (soundId !== null) {
      sound.howl.pause(soundId);
    } else {
      sound.howl.pause();
    }
  }
  
  /**
   * Resume a paused sound
   */
  resume(name, soundId = null) {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (soundId !== null) {
      sound.howl.play(soundId);
    } else {
      sound.howl.play();
    }
  }
  
  /**
   * Update listener position (camera/player position)
   * Call this every frame
   */
  updateListener(position, forward = null) {
    this.listenerPosition = position;
    
    if (forward) {
      this.listenerOrientation = forward;
    }
    
    // Update Howler listener
    Howler.pos(position.x, position.y, position.z);
    
    if (forward) {
      Howler.orientation(forward.x, forward.y, forward.z, 0, 1, 0);
    }
  }
  
  /**
   * Update 3D position of a playing sound
   */
  updateSoundPosition(soundId, position) {
    const active = this.activeSounds.get(soundId);
    if (!active) return;
    
    active.sound.pos(position[0], position[1], position[2], soundId);
    active.position = position;
  }
  
  /**
   * Set volume for a category
   */
  setVolume(category, volume) {
    if (!this.volumes.hasOwnProperty(category)) {
      console.warn(`AudioSystem: Unknown category: ${category}`);
      return;
    }
    
    this.volumes[category] = Math.max(0, Math.min(1, volume));
    
    // Update all sounds in this category
    for (const [name, { howl, config }] of this.sounds.entries()) {
      if (config.category === category || category === 'master') {
        const newVolume = config.volume * this.volumes[config.category] * this.volumes.master;
        howl.volume(newVolume);
      }
    }
  }
  
  /**
   * Get volume for a category
   */
  getVolume(category) {
    return this.volumes[category] ?? 0;
  }
  
  /**
   * Mute/unmute all audio
   */
  setMute(muted) {
    this.isMuted = muted;
    Howler.mute(muted);
  }
  
  /**
   * Toggle mute
   */
  toggleMute() {
    this.setMute(!this.isMuted);
  }
  
  /**
   * Play background music with crossfade
   */
  async playMusic(name, fadeIn = 2000) {
    // Stop current music
    if (this.currentMusic) {
      const current = this.sounds.get(this.currentMusic);
      if (current) {
        current.howl.fade(current.howl.volume(), 0, fadeIn / 2);
        setTimeout(() => current.howl.stop(), fadeIn / 2);
      }
    }
    
    // Play new music
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`AudioSystem: Music not found: ${name}`);
      return;
    }
    
    const soundId = sound.howl.play();
    sound.howl.fade(0, sound.config.volume * this.volumes.music * this.volumes.master, fadeIn, soundId);
    
    this.currentMusic = name;
    this.isMusicPlaying = true;
  }
  
  /**
   * Stop music
   */
  stopMusic(fadeOut = 2000) {
    if (!this.currentMusic) return;
    
    const sound = this.sounds.get(this.currentMusic);
    if (sound) {
      sound.howl.fade(sound.howl.volume(), 0, fadeOut);
      setTimeout(() => sound.howl.stop(), fadeOut);
    }
    
    this.currentMusic = null;
    this.isMusicPlaying = false;
  }
  
  /**
   * Preload common sounds
   */
  async preloadDefaultSounds() {
    // Define your sound library here
    const soundLibrary = {
      // Combat SFX
      sword_swing: { src: '/sounds/sfx/sword_swing.mp3', config: { category: 'sfx', pool: 5 } },
      sword_hit: { src: '/sounds/sfx/sword_hit.mp3', config: { category: 'sfx', pool: 5, spatial: true } },
      bow_shoot: { src: '/sounds/sfx/bow_shoot.mp3', config: { category: 'sfx', pool: 3, spatial: true } },
      arrow_hit: { src: '/sounds/sfx/arrow_hit.mp3', config: { category: 'sfx', pool: 5, spatial: true } },
      
      // Movement SFX
      footstep: { src: '/sounds/sfx/footstep.mp3', config: { category: 'sfx', pool: 10, volume: 0.3 } },
      roll: { src: '/sounds/sfx/roll.mp3', config: { category: 'sfx', pool: 3 } },
      jump: { src: '/sounds/sfx/jump.mp3', config: { category: 'sfx', pool: 2 } },
      land: { src: '/sounds/sfx/land.mp3', config: { category: 'sfx', pool: 3 } },
      
      // Hit reactions
      grunt: { src: '/sounds/voice/grunt.mp3', config: { category: 'voice', pool: 5 } },
      pain: { src: '/sounds/voice/pain.mp3', config: { category: 'voice', pool: 3 } },
      
      // UI
      menu_hover: { src: '/sounds/ui/hover.mp3', config: { category: 'ui', volume: 0.5 } },
      menu_click: { src: '/sounds/ui/click.mp3', config: { category: 'ui', volume: 0.6 } },
      pause: { src: '/sounds/ui/pause.mp3', config: { category: 'ui' } },
      
      // Music
      combat_music: { src: '/sounds/music/combat.mp3', config: { category: 'music', loop: true } },
      ambient_music: { src: '/sounds/music/ambient.mp3', config: { category: 'music', loop: true } }
    };
    
    // Load all sounds (or load on-demand)
    const promises = [];
    for (const [name, { src, config }] of Object.entries(soundLibrary)) {
      promises.push(
        this.loadSound(name, src, config)
          .catch(err => console.warn(`Failed to load ${name}:`, err))
      );
    }
    
    await Promise.allSettled(promises);
    console.log('AudioSystem: Preload complete');
  }
  
  /**
   * Unload a sound to free memory
   */
  unload(name) {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    sound.howl.unload();
    this.sounds.delete(name);
  }
  
  /**
   * Unload all sounds
   */
  unloadAll() {
    for (const [name, { howl }] of this.sounds.entries()) {
      howl.unload();
    }
    this.sounds.clear();
    this.activeSounds.clear();
  }
  
  /**
   * Get audio system stats
   */
  getStats() {
    return {
      totalSounds: this.sounds.size,
      activeSounds: this.activeSounds.size,
      isPlaying: this.isMusicPlaying,
      currentMusic: this.currentMusic,
      volumes: { ...this.volumes },
      isMuted: this.isMuted
    };
  }
}
