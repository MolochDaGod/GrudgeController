/**
 * AnimationMapper.js - Maps Mixamo animation files to game animation states
 * Supports multiple animation packs (RacalvinDaWarrior, Pro Longbow Pack, etc.)
 */

export const ANIMATION_PACKS = {
  WARRIOR: 'RacalvinDaWarrior',
  ARCHER: 'Pro Longbow Pack',
  ADVENTURE: 'Action Adventure Pack',
  // Add more packs as needed
};

/**
 * Animation file mappings
 * Maps game animation states to actual FBX file names from different packs
 */
export const ANIMATION_MAPPINGS = {
  // ===== LOCOMOTION =====
  idle: {
    primary: { pack: 'WARRIOR', file: 'idle.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing idle 01.fbx' },
      { pack: 'ARCHER', file: 'unarmed idle 01.fbx' }
    ]
  },
  
  walk: {
    primary: { pack: 'WARRIOR', file: 'walk.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing walk forward.fbx' }
    ]
  },
  
  walk_back: {
    primary: { pack: 'WARRIOR', file: 'walk_back.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing walk back.fbx' }
    ]
  },
  
  run: {
    primary: { pack: 'WARRIOR', file: 'run.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing run forward.fbx' }
    ]
  },
  
  run_back: {
    primary: { pack: 'WARRIOR', file: 'run_back.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing run back.fbx' }
    ]
  },
  
  // ===== STRAFING (NEW from Archer pack) =====
  strafe_left: {
    primary: { pack: 'ARCHER', file: 'standing walk left.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing run left.fbx' }
    ]
  },
  
  strafe_right: {
    primary: { pack: 'ARCHER', file: 'standing walk right.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing run right.fbx' }
    ]
  },
  
  // ===== TURNING (NEW from Archer pack) =====
  turn_left_90: {
    primary: { pack: 'ARCHER', file: 'standing turn 90 left.fbx' }
  },
  
  turn_right_90: {
    primary: { pack: 'ARCHER', file: 'standing turn 90 right.fbx' }
  },
  
  // ===== COMBAT - MELEE =====
  attack_1: {
    primary: { pack: 'WARRIOR', file: 'attack_1.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing melee punch.fbx' }
    ]
  },
  
  attack_2: {
    primary: { pack: 'WARRIOR', file: 'attack_2.fbx' }
  },
  
  attack_3: {
    primary: { pack: 'WARRIOR', file: 'attack_3.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing melee kick.fbx' }
    ]
  },
  
  heavy_attack: {
    primary: { pack: 'WARRIOR', file: 'heavy_attack.fbx' }
  },
  
  // ===== DEFENSE =====
  block_idle: {
    primary: { pack: 'WARRIOR', file: 'block_idle.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing block.fbx' }
    ]
  },
  
  block_hit: {
    primary: { pack: 'WARRIOR', file: 'block_hit.fbx' }
  },
  
  // ===== ROLLING/DODGING (EXCELLENT animations from Archer pack!) =====
  roll: {
    primary: { pack: 'WARRIOR', file: 'roll.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing dive forward.fbx' },
      { pack: 'ARCHER', file: 'standing dodge forward.fbx' }
    ]
  },
  
  roll_left: {
    primary: { pack: 'ARCHER', file: 'standing dodge left.fbx' },
    description: 'Perfect roll left animation from Pro Longbow Pack'
  },
  
  roll_right: {
    primary: { pack: 'ARCHER', file: 'standing dodge right.fbx' },
    description: 'Perfect roll right animation from Pro Longbow Pack'
  },
  
  roll_back: {
    primary: { pack: 'ARCHER', file: 'standing dodge backward.fbx' },
    description: 'Roll backward from Pro Longbow Pack'
  },
  
  // ===== RANGED WEAPONS (from Archer pack) =====
  aim_idle: {
    primary: { pack: 'ARCHER', file: 'standing idle 01.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing idle 02 looking.fbx' }
    ]
  },
  
  aim_walk: {
    primary: { pack: 'ARCHER', file: 'standing aim walk forward.fbx' }
  },
  
  aim_walk_back: {
    primary: { pack: 'ARCHER', file: 'standing aim walk back.fbx' }
  },
  
  aim_walk_left: {
    primary: { pack: 'ARCHER', file: 'standing aim walk left.fbx' }
  },
  
  aim_walk_right: {
    primary: { pack: 'ARCHER', file: 'standing aim walk right.fbx' }
  },
  
  shoot: {
    primary: { pack: 'ARCHER', file: 'standing aim recoil.fbx' },
    description: 'Shooting recoil animation'
  },
  
  draw_arrow: {
    primary: { pack: 'ARCHER', file: 'standing draw arrow.fbx' }
  },
  
  overdraw: {
    primary: { pack: 'ARCHER', file: 'standing aim overdraw.fbx' },
    description: 'Full draw/charge animation'
  },
  
  equip_bow: {
    primary: { pack: 'ARCHER', file: 'standing equip bow.fbx' }
  },
  
  disarm_bow: {
    primary: { pack: 'ARCHER', file: 'standing disarm bow.fbx' }
  },
  
  // ===== JUMPING/FALLING =====
  jump: {
    primary: { pack: 'WARRIOR', file: 'jump.fbx' }
  },
  
  fall: {
    primary: { pack: 'WARRIOR', file: 'fall.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'fall a loop.fbx' }
    ]
  },
  
  land: {
    primary: { pack: 'WARRIOR', file: 'land.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'fall a land to standing idle 01.fbx' },
      { pack: 'ARCHER', file: 'fall a land to run forward.fbx' }
    ]
  },
  
  // ===== HIT REACTIONS =====
  hit_react: {
    primary: { pack: 'WARRIOR', file: 'hit_react.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing react small from front.fbx' }
    ]
  },
  
  hit_react_headshot: {
    primary: { pack: 'ARCHER', file: 'standing react small from headshot.fbx' }
  },
  
  // ===== DEATH =====
  death: {
    primary: { pack: 'WARRIOR', file: 'death.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing death forward 01.fbx' },
      { pack: 'ARCHER', file: 'standing death backward 01.fbx' }
    ]
  },
  
  // ===== MISC (from Archer pack) =====
  idle_looking: {
    primary: { pack: 'ARCHER', file: 'standing idle 02 looking.fbx' },
    description: 'Looking around idle animation'
  },
  
  idle_examine: {
    primary: { pack: 'ARCHER', file: 'standing idle 03 examine.fbx' },
    description: 'Examining item idle animation'
  },
  
  run_stop: {
    primary: { pack: 'ARCHER', file: 'standing run forward stop.fbx' },
    alternates: [
      { pack: 'ADVENTURE', file: 'run to stop.fbx' }
    ],
    description: 'Stop from running animation'
  },
  
  // ===== STEALTH/COVER (from Adventure pack) =====
  crouch_sneak_left: {
    primary: { pack: 'ADVENTURE', file: 'crouched sneaking left.fbx' },
    description: 'Crouched sneaking left'
  },
  
  crouch_sneak_right: {
    primary: { pack: 'ADVENTURE', file: 'crouched sneaking right.fbx' },
    description: 'Crouched sneaking right'
  },
  
  cover_left: {
    primary: { pack: 'ADVENTURE', file: 'left cover sneak.fbx' },
    description: 'Taking cover on left side'
  },
  
  cover_right: {
    primary: { pack: 'ADVENTURE', file: 'right cover sneak.fbx' },
    description: 'Taking cover on right side'
  },
  
  stand_to_cover: {
    primary: { pack: 'ADVENTURE', file: 'stand to cover.fbx' },
    alternates: [
      { pack: 'ADVENTURE', file: 'stand to cover (2).fbx' }
    ],
    description: 'Transition from standing to cover'
  },
  
  cover_to_stand: {
    primary: { pack: 'ADVENTURE', file: 'cover to stand.fbx' },
    alternates: [
      { pack: 'ADVENTURE', file: 'cover to stand (2).fbx' }
    ],
    description: 'Exit from cover to standing'
  },
  
  // ===== IMPROVED TURNS (from Adventure pack) =====
  turn_left: {
    primary: { pack: 'ADVENTURE', file: 'left turn.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing turn 90 left.fbx' }
    ],
    description: 'Smooth left turn'
  },
  
  turn_right: {
    primary: { pack: 'ADVENTURE', file: 'right turn.fbx' },
    alternates: [
      { pack: 'ARCHER', file: 'standing turn 90 right.fbx' }
    ],
    description: 'Smooth right turn'
  },
  
  // ===== ENHANCED FALLING/LANDING (from Adventure pack) =====
  falling_idle: {
    primary: { pack: 'ADVENTURE', file: 'falling idle.fbx' },
    description: 'Mid-air falling idle'
  },
  
  falling_to_roll: {
    primary: { pack: 'ADVENTURE', file: 'falling to roll.fbx' },
    description: 'Land from fall with roll'
  },
  
  hard_landing: {
    primary: { pack: 'ADVENTURE', file: 'hard landing.fbx' },
    description: 'Heavy landing from great height'
  },
  
  jumping_up: {
    primary: { pack: 'ADVENTURE', file: 'jumping up.fbx' },
    description: 'Jump upward animation'
  },
  
  // ===== ADDITIONAL IDLES (from Adventure pack) =====
  idle_casual: {
    primary: { pack: 'ADVENTURE', file: 'idle (2).fbx' },
    description: 'Casual idle variation'
  },
  
  idle_alert: {
    primary: { pack: 'ADVENTURE', file: 'idle (3).fbx' },
    description: 'Alert idle variation'
  },
  
  idle_tired: {
    primary: { pack: 'ADVENTURE', file: 'idle (4).fbx' },
    description: 'Tired idle variation'
  },
  
  idle_ready: {
    primary: { pack: 'ADVENTURE', file: 'idle (5).fbx' },
    description: 'Ready combat stance idle'
  }
};

/**
 * Get the base path for an animation pack
 */
export function getPackPath(packName) {
  const paths = {
    WARRIOR: '/models/RacalvinDaWarrior/',
    ARCHER: '/models/Pro Longbow Pack/',
    ADVENTURE: '/models/Action Adventure Pack/'
  };
  return paths[packName] || '/models/';
}

/**
 * Get the full path for an animation
 */
export function getAnimationPath(stateName, useAlternate = false, alternateIndex = 0) {
  const mapping = ANIMATION_MAPPINGS[stateName];
  if (!mapping) {
    console.warn(`No mapping found for animation state: ${stateName}`);
    return null;
  }
  
  let source = mapping.primary;
  
  if (useAlternate && mapping.alternates && mapping.alternates.length > 0) {
    source = mapping.alternates[alternateIndex] || mapping.primary;
  }
  
  const packPath = getPackPath(source.pack);
  return packPath + source.file;
}

/**
 * Get all available animations for a state (primary + alternates)
 */
export function getAnimationVariants(stateName) {
  const mapping = ANIMATION_MAPPINGS[stateName];
  if (!mapping) return [];
  
  const variants = [
    {
      path: getAnimationPath(stateName),
      pack: mapping.primary.pack,
      file: mapping.primary.file,
      isPrimary: true
    }
  ];
  
  if (mapping.alternates) {
    mapping.alternates.forEach((alt, index) => {
      const packPath = getPackPath(alt.pack);
      variants.push({
        path: packPath + alt.file,
        pack: alt.pack,
        file: alt.file,
        isPrimary: false,
        index: index
      });
    });
  }
  
  return variants;
}

/**
 * Get animation categories for UI/debugging
 */
export function getAnimationCategories() {
  return {
    locomotion: [
      'idle', 'walk', 'walk_back', 'run', 'run_back',
      'strafe_left', 'strafe_right', 'turn_left_90', 'turn_right_90'
    ],
    combat_melee: [
      'attack_1', 'attack_2', 'attack_3', 'heavy_attack'
    ],
    defense: [
      'block_idle', 'block_hit'
    ],
    dodge: [
      'roll', 'roll_left', 'roll_right', 'roll_back'
    ],
    ranged: [
      'aim_idle', 'aim_walk', 'aim_walk_back', 'aim_walk_left', 'aim_walk_right',
      'shoot', 'draw_arrow', 'overdraw', 'equip_bow', 'disarm_bow'
    ],
    aerial: [
      'jump', 'fall', 'land'
    ],
    reactions: [
      'hit_react', 'hit_react_headshot', 'death'
    ],
    misc: [
      'idle_looking', 'idle_examine', 'run_stop'
    ],
    stealth: [
      'crouch_sneak_left', 'crouch_sneak_right',
      'cover_left', 'cover_right', 'stand_to_cover', 'cover_to_stand'
    ],
    turns: [
      'turn_left', 'turn_right', 'turn_left_90', 'turn_right_90'
    ],
    enhanced_aerial: [
      'falling_idle', 'falling_to_roll', 'hard_landing', 'jumping_up'
    ],
    idle_variations: [
      'idle_casual', 'idle_alert', 'idle_tired', 'idle_ready'
    ]
  };
}

/**
 * Get recommended animations for specific gameplay features
 */
export function getRecommendedAnimations() {
  return {
    souls_like_combat: {
      description: 'Best animations for Souls-like combat feel',
      animations: {
        roll: 'roll',  // Forward roll
        roll_left: 'roll_left',  // Side dodge left (ARCHER PACK)
        roll_right: 'roll_right',  // Side dodge right (ARCHER PACK)
        roll_back: 'roll_back',  // Back dodge (ARCHER PACK)
        strafe_left: 'strafe_left',  // Combat strafing (ARCHER PACK)
        strafe_right: 'strafe_right',  // Combat strafing (ARCHER PACK)
        turn_left: 'turn_left_90',  // Quick turn (ARCHER PACK)
        turn_right: 'turn_right_90'  // Quick turn (ARCHER PACK)
      }
    },
    
    ranged_combat: {
      description: 'Full ranged weapon support',
      animations: {
        equip: 'equip_bow',
        unequip: 'disarm_bow',
        idle: 'aim_idle',
        walk_forward: 'aim_walk',
        walk_back: 'aim_walk_back',
        strafe_left: 'aim_walk_left',
        strafe_right: 'aim_walk_right',
        shoot: 'shoot',
        reload: 'draw_arrow',
        charge: 'overdraw'
      }
    },
    
    target_lock_combat: {
      description: 'Animations for target lock combat mode',
      animations: {
        strafe_left: 'strafe_left',
        strafe_right: 'strafe_right',
        dodge_left: 'roll_left',
        dodge_right: 'roll_right',
        dodge_back: 'roll_back'
      }
    }
  };
}

/**
 * Validate that animation files exist (for debugging)
 */
export async function validateAnimations(loader) {
  const results = {
    found: [],
    missing: []
  };
  
  for (const [stateName, mapping] of Object.entries(ANIMATION_MAPPINGS)) {
    const path = getAnimationPath(stateName);
    
    try {
      // Try to load
      await loader.loadAsync(path);
      results.found.push({ state: stateName, path });
    } catch (error) {
      results.missing.push({ state: stateName, path, error: error.message });
    }
  }
  
  return results;
}

/**
 * Create animation set configuration
 */
export function createAnimationSet(setName) {
  const sets = {
    // Melee warrior (existing warrior animations)
    melee: [
      'idle', 'walk', 'walk_back', 'run', 'run_back',
      'attack_1', 'attack_2', 'attack_3', 'heavy_attack',
      'block_idle', 'roll', 'hit_react', 'death'
    ],
    
    // Archer (new archer pack animations)
    archer: [
      'idle', 'walk', 'walk_back', 'run', 'run_back',
      'strafe_left', 'strafe_right',
      'aim_idle', 'aim_walk', 'aim_walk_left', 'aim_walk_right',
      'shoot', 'draw_arrow', 'equip_bow',
      'roll_left', 'roll_right', 'roll_back',
      'hit_react', 'death'
    ],
    
    // Hybrid (best of both)
    hybrid: [
      'idle', 'walk', 'walk_back', 'run', 'run_back',
      'strafe_left', 'strafe_right', 'turn_left_90', 'turn_right_90',
      'attack_1', 'attack_2', 'attack_3', 'heavy_attack',
      'block_idle',
      'roll', 'roll_left', 'roll_right', 'roll_back',
      'aim_idle', 'aim_walk', 'shoot', 'equip_bow',
      'hit_react', 'death'
    ]
  };
  
  return sets[setName] || sets.hybrid;
}

/**
 * Print animation pack summary
 */
export function printAnimationSummary() {
  console.log('=== ANIMATION PACK SUMMARY ===');
  
  const categories = getAnimationCategories();
  for (const [category, animations] of Object.entries(categories)) {
    console.log(`\n${category.toUpperCase()}:`);
    animations.forEach(anim => {
      const mapping = ANIMATION_MAPPINGS[anim];
      if (mapping) {
        const packName = ANIMATION_PACKS[mapping.primary.pack];
        console.log(`  ✓ ${anim} -> ${packName}/${mapping.primary.file}`);
        if (mapping.alternates) {
          mapping.alternates.forEach(alt => {
            const altPackName = ANIMATION_PACKS[alt.pack];
            console.log(`    (alt) ${altPackName}/${alt.file}`);
          });
        }
      }
    });
  }
  
  console.log('\n=== KEY ADDITIONS FROM PRO LONGBOW PACK ===');
  console.log('  ✓ Directional rolls: roll_left, roll_right, roll_back');
  console.log('  ✓ Strafing: strafe_left, strafe_right');
  console.log('  ✓ Quick turns: turn_left_90, turn_right_90');
  console.log('  ✓ Full ranged combat animations');
  console.log('  ✓ Aimed strafing: aim_walk_left, aim_walk_right, etc.');
}

/**
 * AnimationMapper class wrapper for all animation mapping functions
 */
export class AnimationMapper {
  constructor() {
    this.packs = ANIMATION_PACKS;
    this.mappings = ANIMATION_MAPPINGS;
  }
  
  getAnimationPath(stateName, useAlternate = false, alternateIndex = 0) {
    return getAnimationPath(stateName, useAlternate, alternateIndex);
  }
  
  getAnimationVariants(stateName) {
    return getAnimationVariants(stateName);
  }
  
  getAnimationCategories() {
    return getAnimationCategories();
  }
  
  getRecommendedAnimations() {
    return getRecommendedAnimations();
  }
  
  createAnimationSet(setName) {
    return createAnimationSet(setName);
  }
  
  printAnimationSummary() {
    return printAnimationSummary();
  }
  
  async validateAnimations(loader) {
    return await validateAnimations(loader);
  }
}
