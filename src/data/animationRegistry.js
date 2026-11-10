function movement({
  id, label, file, kind = 'loop', library = true, stages, category,
  targets = [], muscles = [], equipment = [], instruction, searchTerms = [], goalOrder = {},
}) {
  return {
    id,
    label,
    file,
    kind,
    library,
    ...(file ? { url: `${import.meta.env.BASE_URL}animations/${encodeURIComponent(file)}` } : {}),
    ...(stages ? { stages } : {}),
    ...(category ? { category } : {}),
    ...(['loop', 'composite'].includes(kind) && instruction
      ? { exercise: { targets, muscles, equipment, instruction, searchTerms, goalOrder, category } }
      : {}),
  }
}

export const DEFAULT_ANIMATIONS = [
  movement({ id: 'idle', label: 'Standing Idle', file: 'Standing Idle.fbx' }),
  movement({
    id: 'squat',
    label: 'Squat',
    file: 'Air Squat.fbx',
    targets: ['Full Body', 'Chest', 'Back', 'Legs', 'Abs'],
    muscles: ['Legs', 'Glutes'],
    instruction: 'Stand with feet shoulder-width apart. Sit your hips back, keep your chest lifted, then press through your heels.',
    goalOrder: { Strength: 0, 'Muscle Gain': 0, 'General Fitness': 0, 'Weight Loss': 1, Endurance: 1 },
  }),
  movement({
    id: 'pushup-ready',
    label: 'Ready to Push-ups',
    file: 'Idle To Push Up.fbx',
    kind: 'transition',
    library: false,
  }),
  movement({
    id: 'pushup-loop',
    label: 'Push-up Loop',
    file: 'Push Up.fbx',
    kind: 'loop',
    library: false,
  }),
  movement({
    id: 'pushups',
    label: 'Push-ups',
    kind: 'composite',
    stages: [
      { animationId: 'pushup-ready', mode: 'once' },
      { animationId: 'pushup-loop', mode: 'loop', alignRootToPrevious: true },
    ],
    category: 'Upper Body',
    targets: ['Full Body', 'Chest', 'Shoulders', 'Arms'],
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    instruction: 'Keep your body in a straight line. Lower your chest with control, then press through your palms to return to the starting position.',
    goalOrder: { Strength: 1, 'Muscle Gain': 1, 'General Fitness': 1, 'Weight Loss': 2, Endurance: 2 },
  }),
  movement({
    id: 'curl',
    label: 'Bicep Curl',
    file: 'Bicep Curl.fbx',
    targets: ['Full Body', 'Back', 'Shoulders', 'Arms'],
    muscles: ['Biceps', 'Arms'],
    equipment: ['Dumbbells', 'Full Gym'],
    instruction: 'Keep elbows close to your sides. Curl with control, pause briefly, then lower slowly.',
    goalOrder: { Strength: 1, 'Muscle Gain': 1, 'General Fitness': 2, 'Weight Loss': 2, Endurance: 2 },
  }),
  movement({
    id: 'jacks',
    label: 'Jumping Jacks',
    file: 'Jumping Jacks.fbx',
    targets: ['Full Body', 'Chest', 'Shoulders', 'Arms', 'Legs', 'Abs'],
    muscles: ['Full body', 'Cardio'],
    instruction: 'Keep a comfortable pace, land softly, and stay tall through your torso.',
    goalOrder: { 'Weight Loss': 0, Endurance: 0, 'General Fitness': 1, 'Muscle Gain': 2, Strength: 2 },
  }),
]

export async function loadAnimationRegistry() {
  const response = await fetch(`${import.meta.env.BASE_URL}animations/registry.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Animation registry request failed (${response.status}).`)
  const registry = await response.json()
  if (!Array.isArray(registry)) throw new Error('Animation registry must contain a JSON array.')

  const animations = registry.map((entry) => {
    if (!entry || typeof entry.id !== 'string' || typeof entry.label !== 'string') {
      throw new Error('Each animation registry entry must include id and label.')
    }
    if (!['loop', 'transition', 'composite'].includes(entry.kind ?? 'loop')) {
      throw new Error(`Animation "${entry.id}" has an unsupported kind.`)
    }
    if (entry.kind === 'composite') {
      if (!Array.isArray(entry.stages) || entry.stages.length === 0) {
        throw new Error(`Composite animation "${entry.id}" must include at least one stage.`)
      }
    } else if (typeof entry.file !== 'string' || !entry.file.toLowerCase().endsWith('.fbx')) {
      throw new Error(`Animation "${entry.id}" must reference an FBX file.`)
    }
    return movement(entry)
  })
  if (new Set(animations.map((animation) => animation.id)).size !== animations.length) {
    throw new Error('Animation registry IDs must be unique.')
  }
  if (!animations.some((animation) => animation.id === 'idle')) {
    throw new Error('Animation registry must include the Standing Idle animation.')
  }
  const ids = new Set(animations.map((animation) => animation.id))
  for (const animation of animations.filter((item) => item.kind === 'composite')) {
    for (const stage of animation.stages) {
      if (!ids.has(stage.animationId)) {
        throw new Error(`Composite animation "${animation.id}" references missing stage "${stage.animationId}".`)
      }
      if (!['once', 'loop'].includes(stage.mode ?? 'loop')) {
        throw new Error(`Composite animation "${animation.id}" has an invalid stage mode.`)
      }
      if (animations.find((item) => item.id === stage.animationId)?.kind === 'composite') {
        throw new Error(`Composite animation "${animation.id}" stages must reference source animations.`)
      }
    }
  }
  return animations
}

export function getAnimation(id, registry = DEFAULT_ANIMATIONS) {
  return registry.find((animation) => animation.id === id) ?? registry.find((animation) => animation.id === 'idle') ?? DEFAULT_ANIMATIONS[0]
}

export const AVATAR_URL = new URL('../../avatar/Virtual_Gym_Trainer.fbx', import.meta.url).href
