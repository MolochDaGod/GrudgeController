# 🎭 Mixamo Character & Animation Integration Guide

## Overview

Replacing the character with a new Mixamo model is **VERY EASY**! The system is designed to work seamlessly with Mixamo animations.

## 📋 What You Need to Change

### 1. **Character Model File** (1 file)
### 2. **Animation Files** (6-10 files)
### 3. **Animation Mapping** (1 file)

That's it! No complex rigging or code changes needed.

---

## 🎯 Step-by-Step Guide

### Step 1: Download from Mixamo

#### A. Download Character Model
1. Go to [Mixamo.com](https://www.mixamo.com)
2. Select your character
3. Download settings:
   - **Format**: FBX for Unity (.fbx)
   - **Skin**: With Skin
   - **Pose**: T-Pose
4. Save as `YourCharacter.fbx`

#### B. Download Animations
Download these essential animations (search by name on Mixamo):

**Required Animations:**
- `Idle` or `Breathing Idle`
- `Running` or `Run`
- `Jump`
- `Roll` or `Dodge`
- `Sword And Shield Idle`
- `Sword And Shield Run`
- `Sword And Shield Attack`
- `Sword And Shield Slash`

**Download Settings for Each:**
- **Format**: FBX for Unity (.fbx)
- **Skin**: Without Skin (animations only!)
- **Frame Rate**: 30 fps
- **Keyframe Reduction**: None

### Step 2: Convert FBX to GLB

Use one of these methods:

**Option A: Online Converter (Easiest)**
1. Go to https://products.aspose.app/3d/conversion/fbx-to-glb
2. Upload your .fbx files
3. Download the .glb files

**Option B: Blender (More Control)**
1. Open Blender
2. File → Import → FBX (.fbx)
3. Select your file
4. File → Export → glTF 2.0 (.glb)
5. Export settings:
   - Format: GLB
   - Include: Animations (if present)
   - Compression: None

### Step 3: Organize Files

Place files in your project:

```
3D-Action-RPG-JavaScript-main/
└── assets/
    └── characters/
        └── your_character/              ← Create this folder
            ├── YourCharacter.glb        ← Character model
            └── animations/
                └── sword_shield/        ← Animation category
                    ├── idle.glb
                    ├── run.glb
                    ├── jump.glb
                    ├── attack.glb
                    ├── slash.glb
                    ├── slash2.glb
                    └── slash3.glb
```

### Step 4: Update Character Loading

**File**: `3D-Action-RPG-JavaScript-main/src/character/hero.js`

<augment_code_snippet path="3D-Action-RPG-JavaScript-main/src/character/hero.js" mode="EXCERPT">
````javascript
export async function loadHeroModel(scene, character) {
    // CHANGE THIS LINE - Update path and filename
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null, 
        "./assets/characters/your_character/",  // ← Your folder
        "YourCharacter.glb",                     // ← Your model file
        scene
    );
````
</augment_code_snippet>

**Update animation paths** (lines 6-12):
```javascript
// Load your animations
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "idle.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "run.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "jump.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "slash.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "attack.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "slash2.glb", scene);
await BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/characters/your_character/animations/sword_shield/", "slash3.glb", scene);
```

### Step 5: Update Animation Mapping

**File**: `3D-Action-RPG-JavaScript-main/src/utils/anim.js`

The animation names in the GLB files need to match what the game expects.

<augment_code_snippet path="3D-Action-RPG-JavaScript-main/src/utils/anim.js" mode="EXCERPT">
````javascript
export function setupAnim(scene, skeleton) {
    let anim = {};
    
    // Map your animation names to game actions
    anim.BreathingIdle = scene.animationGroups.find(ag => ag.name.includes("idle"));
    anim.Running = scene.animationGroups.find(ag => ag.name.includes("run"));
    anim.Jump = scene.animationGroups.find(ag => ag.name.includes("jump"));
    // ... etc
````
</augment_code_snippet>

**Tip**: Add this line to see all available animation names:
```javascript
console.log("All animations:", scene.animationGroups.map(ag => ag.name));
```

### Step 6: Adjust Scale & Position

Different Mixamo characters have different sizes. Adjust in `hero.js`:

```javascript
// Line 17-18 in hero.js
hero.scaling.scaleInPlace(1);    // ← Adjust this (try 0.5, 1, 2, etc.)
hero.position.y = 0;             // ← Adjust height if needed
```

**Testing scale**:
- Too small? Increase number (try 1.5, 2, 3)
- Too large? Decrease number (try 0.5, 0.7)
- Use debug mode (`?debug=true`) to see the character clearly

---

## 🎮 How Animations Are Triggered

### Current Hotkey Mappings

**File**: `3D-Action-RPG-JavaScript-main/src/movement.js`

| Key | Animation | Code Location |
|-----|-----------|---------------|
| **W/↑** | Running | Line 287-300 |
| **S/↓** | Running (backward) | Line 309-320 |
| **Space** | Roll | Line 490-496 |
| **V** | Jump | Line 499-505 |
| **4** | Combo | Line 431-457 |
| **5** | Attack | Line 462-475 |
| **C** | SelfCast | Line 477-488 |
| **F** | Toggle Sprint | Line 218 |
| **Mouse Click** | Attack/Combo | Line 431 |

### Animation System Flow

```
User Input (Keyboard/Mouse)
    ↓
inputMap[] tracks key states (line 4-15)
    ↓
Movement loop checks inputMap (line 287+)
    ↓
Triggers animation: anim.Running.start()
    ↓
Animation plays on character skeleton
```

### Example: How Attack Works

<augment_code_snippet path="3D-Action-RPG-JavaScript-main/src/movement.js" mode="EXCERPT">
````javascript
// Line 462-475
if (inputMap["5"] || thirdAttack) {
    anim.BreathingIdle.stop();
    anim.Running.stop();
    if (!anim.Roll.isPlaying && !anim.Running.isPlaying) {
        for (let key in anim) {
            if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
                if (key !== 'Attack') anim[key].stop();
            }
        }
        anim.Attack.start(false, 1.3, anim.Attack.from, anim.Attack.to - 20, true);
    }
}
````
</augment_code_snippet>

---

## 🔧 Common Adjustments

### Change Animation Speed
```javascript
// In movement.js, find the animation call:
anim.Running.start(true, 1.1, ...);  // ← 1.1 is speed (1.0 = normal)
//                      ↑
//                   Change this number
```

### Add New Hotkey
```javascript
// In movement.js, add after line 230:
if (inputMap["6"]) {
    anim.YourNewAnimation.start(false, 1.0, anim.YourNewAnimation.from, anim.YourNewAnimation.to, true);
}
```

### Change Existing Hotkey
Just change the key in the `if` statement:
```javascript
// Change from "5" to "e"
if (inputMap["e"]) {  // ← Changed from "5"
    anim.Attack.start(...);
}
```

---

## ✅ Testing Checklist

1. ✅ Character model loads (check browser console for errors)
2. ✅ Character is visible and correct size
3. ✅ Idle animation plays automatically
4. ✅ Press W - Running animation plays
5. ✅ Press Space - Roll animation plays
6. ✅ Press 5 - Attack animation plays
7. ✅ All animations transition smoothly

---

## 🐛 Troubleshooting

**Character not visible?**
- Check scale (try different values)
- Check console for loading errors
- Verify file paths are correct

**Animations not playing?**
- Check animation names with `console.log(scene.animationGroups)`
- Verify animation files loaded (check Network tab)
- Make sure animation names match in `anim.js`

**Character too big/small?**
- Adjust `hero.scaling.scaleInPlace(X)` value
- Mixamo characters vary in size

**Animations are choppy?**
- Check FPS in debug mode
- Reduce animation speed
- Check blending speed in `anim.js` (line 18)

---

## 💡 Pro Tips

1. **Test with one animation first** - Get idle working before adding others
2. **Use debug mode** - `?debug=true` shows the scene inspector
3. **Check console** - Animation names are logged on load
4. **Start simple** - Use basic Mixamo character first, then customize
5. **Keep backups** - Save working versions before making changes

---

**Ready to swap characters?** It's just 3 files to edit! 🎮

