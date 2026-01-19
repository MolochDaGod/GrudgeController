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
      background: rgba(0, 0, 0, 0.85);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 8px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1000;
      min-width: 250px;
    `;

    // Get all available animations
    const animations = Array.from(this.demo.animations.keys());

    let html = `
      <div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 10px;">
        <strong>Animation Debug</strong>
        <button id="toggle-anim-ui" style="float: right; background: #444; color: white; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px;">Toggle</button>
      </div>
      <div id="anim-ui-content">
        <div style="margin-bottom: 10px; color: #aaa; font-size: 11px;">
          Current: <span id="current-anim" style="color: #0f0;">${this.currentAnimation}</span>
        </div>
        <div style="margin-bottom: 8px; font-size: 11px; color: #888;">
          Click "Train" then press a key to set hotkey
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
