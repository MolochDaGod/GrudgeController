/**
 * AnimationDebugUI.js - Debug interface for testing animations and training hotkeys
 */

export class AnimationDebugUI {
  constructor(demo) {
    this.demo = demo;
    this.container = null;
    this.isVisible = true;
    this.currentAnimation = 'idle';
    this.recordingHotkey = null;
    
    // Hotkey mappings (stored in localStorage)
    this.hotkeys = this.loadHotkeys();
    
    this.createUI();
    this.setupHotkeyListener();
  }

  loadHotkeys() {
    const saved = localStorage.getItem('animationHotkeys');
    return saved ? JSON.parse(saved) : {};
  }

  saveHotkeys() {
    localStorage.setItem('animationHotkeys', JSON.stringify(this.hotkeys));
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 8px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1000;
      min-width: 300px;
      border: 2px solid #ff6b6b;
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
    `;

    // Get all available animations
    const animations = Array.from(this.demo.animations.keys());

    let html = `
      <div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 10px;">
        <strong style="color: #ff6b6b;">🎮 Animation Admin</strong>
        <button id="toggle-anim-ui" style="float: right; background: #444; color: white; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px;">Hide</button>
      </div>
      <div id="anim-ui-content">
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(255, 107, 107, 0.1); border-radius: 4px; border: 1px solid #ff6b6b;">
          <div style="color: #ff6b6b; font-size: 11px; margin-bottom: 5px;">⚡ Hotkey: Press <strong>\`</strong> (Backtick) to toggle</div>
          <div style="color: #aaa; font-size: 10px;">Current: <span id="current-anim" style="color: #0f0;">${this.currentAnimation}</span></div>
        </div>
        <div style="margin-bottom: 8px; font-size: 11px; color: #888;">
          💡 Click "Train" then press a key to set hotkey
        </div>
        
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
          <div style="margin-bottom: 5px; color: #ffa500;">🔧 Admin Controls</div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <label style="flex: 1; font-size: 11px;">Walk Speed:</label>
            <input type="range" id="walk-speed" min="0.5" max="3" step="0.1" value="1.6" style="flex: 2;" />
            <span id="walk-speed-val" style="margin-left: 5px; min-width: 35px; font-size: 11px;">1.6</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <label style="flex: 1; font-size: 11px;">Run Speed:</label>
            <input type="range" id="run-speed" min="1" max="6" step="0.1" value="3.5" style="flex: 2;" />
            <span id="run-speed-val" style="margin-left: 5px; min-width: 35px; font-size: 11px;">3.5</span>
          </div>
          <div style="display: flex; align-items: center;">
            <label style="flex: 1; font-size: 11px;">Anim Speed:</label>
            <input type="range" id="anim-speed" min="0.5" max="2" step="0.1" value="1.0" style="flex: 2;" />
            <span id="anim-speed-val" style="margin-left: 5px; min-width: 35px; font-size: 11px;">1.0</span>
          </div>
        </div>
    `;

    animations.forEach(anim => {
      const hotkey = this.getHotkeyFor(anim);
      const hotkeyDisplay = hotkey ? `[${hotkey}]` : '[None]';
      
      html += `
        <div style="display: flex; align-items: center; margin: 3px 0; padding: 3px; background: rgba(255,255,255,0.05); border-radius: 3px;">
          <button class="play-anim" data-anim="${anim}" style="
            background: #2a5; 
            color: white; 
            border: none; 
            padding: 4px 8px; 
            cursor: pointer; 
            border-radius: 3px;
            font-size: 11px;
            margin-right: 5px;
            min-width: 50px;
          ">Play</button>
          <button class="train-hotkey" data-anim="${anim}" style="
            background: #5a5; 
            color: white; 
            border: none; 
            padding: 4px 8px; 
            cursor: pointer; 
            border-radius: 3px;
            font-size: 11px;
            margin-right: 5px;
            min-width: 50px;
          ">Train</button>
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${anim}">
            ${anim}
          </span>
          <span style="color: #ff0; margin-left: 5px; min-width: 50px; text-align: right;">
            ${hotkeyDisplay}
          </span>
        </div>
      `;
    });

    html += `</div>`;
    this.container.innerHTML = html;
    document.body.appendChild(this.container);

    // Add event listeners
    this.container.querySelector('#toggle-anim-ui').addEventListener('click', () => {
      this.toggleVisibility();
    });

    this.container.querySelectorAll('.play-anim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const anim = e.target.dataset.anim;
        this.playAnimation(anim);
      });
    });

    this.container.querySelectorAll('.train-hotkey').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const anim = e.target.dataset.anim;
        this.startHotkeyTraining(anim, e.target);
      });
    });
    
    // Wire up admin controls
    const walkSpeedSlider = this.container.querySelector('#walk-speed');
    const walkSpeedVal = this.container.querySelector('#walk-speed-val');
    const runSpeedSlider = this.container.querySelector('#run-speed');
    const runSpeedVal = this.container.querySelector('#run-speed-val');
    const animSpeedSlider = this.container.querySelector('#anim-speed');
    const animSpeedVal = this.container.querySelector('#anim-speed-val');
    
    if (walkSpeedSlider) {
      walkSpeedSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        walkSpeedVal.textContent = value.toFixed(1);
        if (this.demo.controller) {
          this.demo.controller.config.walkSpeed = value;
        }
      });
    }
    
    if (runSpeedSlider) {
      runSpeedSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        runSpeedVal.textContent = value.toFixed(1);
        if (this.demo.controller) {
          this.demo.controller.config.maxSpeed = value;
        }
      });
    }
    
    if (animSpeedSlider) {
      animSpeedSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        animSpeedVal.textContent = value.toFixed(1);
        // Apply to current animation
        if (this.demo.currentAnimation) {
          this.demo.currentAnimation.timeScale = value;
        }
      });
    }
  }

  toggleVisibility() {
    const content = this.container.querySelector('#anim-ui-content');
    if (this.isVisible) {
      content.style.display = 'none';
      this.isVisible = false;
    } else {
      content.style.display = 'block';
      this.isVisible = true;
    }
  }

  playAnimation(animName) {
    if (this.demo.playAnimation) {
      this.demo.playAnimation(animName, 0.2);
      this.currentAnimation = animName;
      const display = this.container.querySelector('#current-anim');
      if (display) display.textContent = animName;
    }
  }

  getHotkeyFor(animName) {
    for (const [key, anim] of Object.entries(this.hotkeys)) {
      if (anim === animName) return key;
    }
    return null;
  }

  startHotkeyTraining(animName, button) {
    this.recordingHotkey = animName;
    button.textContent = 'Press key...';
    button.style.background = '#f80';
  }

  setupHotkeyListener() {
    window.addEventListener('keydown', (e) => {
      // Toggle UI with backtick key
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggleVisibility();
        return;
      }
      
      // Training mode
      if (this.recordingHotkey) {
        e.preventDefault();
        const key = e.key.toUpperCase();
        this.hotkeys[key] = this.recordingHotkey;
        this.saveHotkeys();
        this.recordingHotkey = null;
        this.refreshUI();
        return;
      }

      // Play animation via hotkey
      const animName = this.hotkeys[e.key.toUpperCase()];
      if (animName && this.demo.animations.has(animName)) {
        this.playAnimation(animName);
      }
    });
  }

  refreshUI() {
    // Remove old UI
    if (this.container) {
      this.container.remove();
    }
    // Recreate UI
    this.createUI();
  }

  dispose() {
    if (this.container) {
      this.container.remove();
    }
  }
}
