import { DEFAULT_ANIMATIONS, getAnimation } from './animationRegistry.js'

export const DEFAULT_PREFERENCES = {
  goal: 'General Fitness',
  age: 30,
  height: 170,
  weight: 70,
  targetWeight: '',
  experience: 'Beginner',
  duration: 30,
  location: 'Home',
  equipment: 'No Equipment',
  frequency: 3,
  muscles: ['Full Body'],
  restrictions: '',
}

function chooseExercises(preferences, registry) {
  const targets = preferences.muscles?.length ? preferences.muscles : ['Full Body']
  const excluded = preferences.restrictions.trim().toLowerCase()
  return registry
    .filter((animation) => ['loop', 'composite'].includes(animation.kind) && animation.exercise && animation.library !== false)
    .filter((animation) => {
      const { targets: supportedTargets = [], equipment = [] } = animation.exercise
      return (targets.includes('Full Body') || targets.some((target) => supportedTargets.includes(target)))
        && (!equipment.length || equipment.includes(preferences.equipment))
    })
    .filter((animation) => {
      if (!excluded) return true
      const terms = [animation.label, ...(animation.exercise.muscles ?? []), ...(animation.exercise.searchTerms ?? [])]
      return !terms.some((term) => term.toLowerCase().split(/\s+/).some((word) => word.length > 3 && excluded.includes(word)))
    })
    .sort((left, right) => {
      const leftOrder = left.exercise.goalOrder?.[preferences.goal] ?? 99
      const rightOrder = right.exercise.goalOrder?.[preferences.goal] ?? 99
      return leftOrder - rightOrder || left.label.localeCompare(right.label)
    })
}

export function generateWorkout(preferences, registry = DEFAULT_ANIMATIONS) {
  const totalSeconds = Number(preferences.duration) * 60
  const exercises = chooseExercises(preferences, registry)
  const idleAnimation = getAnimation('idle', registry)
  const warmupAnimation = exercises.find((animation) => animation.id === 'jacks') ?? exercises[0]
  const mainExercises = exercises.filter((animation) => animation.id !== warmupAnimation?.id)
  const warmupSeconds = exercises.length ? Math.round(totalSeconds * 0.1) : 0
  const cooldownSeconds = exercises.length ? Math.round(totalSeconds * 0.08) : totalSeconds
  const mainSeconds = Math.max(0, totalSeconds - warmupSeconds - cooldownSeconds)
  const mainDuration = mainExercises.length ? Math.floor(mainSeconds / mainExercises.length) : 0
  const scheduledIds = new Set(exercises.map((animation) => animation.id))
  const exerciseLibrary = registry
    .filter((animation) => ['loop', 'composite'].includes(animation.kind) && animation.exercise && animation.library !== false)
    .sort((left, right) => {
      const leftIsWarmup = left.id === warmupAnimation?.id
      const rightIsWarmup = right.id === warmupAnimation?.id
      if (leftIsWarmup !== rightIsWarmup) return leftIsWarmup ? -1 : 1
      const leftIndex = exercises.indexOf(left)
      const rightIndex = exercises.indexOf(right)
      if (leftIndex < 0 && rightIndex < 0) return registry.indexOf(left) - registry.indexOf(right)
      if (leftIndex < 0) return 1
      if (rightIndex < 0) return -1
      return leftIndex - rightIndex
    })

  const activities = exerciseLibrary.map((animation) => {
    const isWarmup = animation.id === warmupAnimation?.id
    const isScheduled = scheduledIds.has(animation.id)
    const muscles = animation.exercise.muscles.join(' · ')
    return {
      id: isScheduled ? animation.id : `preview-${animation.id}`,
      title: animation.label,
      kind: isScheduled ? (isWarmup ? 'warmup' : 'exercise') : 'preview',
      animationId: animation.id,
      duration: !isScheduled ? 0
        : isWarmup ? (mainExercises.length ? warmupSeconds : totalSeconds - cooldownSeconds)
          : mainDuration,
      muscles: isScheduled ? muscles : 'Preview only',
      category: animation.exercise.category ?? animation.category ?? 'Movement',
      instructions: isScheduled
        ? (isWarmup ? `Start at a comfortable pace to warm up. ${animation.exercise.instruction}` : animation.exercise.instruction)
        : 'This movement is available to preview, but is not included in this session because of your selected equipment, target muscles, or restrictions.',
    }
  })

  activities.push({
    id: idleAnimation.id,
    title: 'Standing Idle',
    kind: 'cooldown',
    animationId: idleAnimation.id,
    duration: totalSeconds - activities.reduce((sum, activity) => sum + activity.duration, 0),
    muscles: 'Recovery',
    category: 'Recovery',
    instructions: 'Slow your breathing, relax your shoulders, and use this time to cool down.',
  })

  return activities
}
