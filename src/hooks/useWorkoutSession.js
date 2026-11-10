import { useCallback, useEffect, useRef, useState } from 'react'

export function useWorkoutSession(activities) {
  console.log('useWorkoutSession', activities)
  const [index, setIndex] = useState(0)
  const [activityElapsed, setActivityElapsed] = useState(0)
  const [sessionElapsed, setSessionElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [speed, setSpeed] = useState(1)
  const indexRef = useRef(0)
  const activityElapsedRef = useRef(0)
  const sessionElapsedRef = useRef(0)
  const lastTickRef = useRef(0)

  const reset = useCallback((start = false) => {
    indexRef.current = 0
    activityElapsedRef.current = 0
    sessionElapsedRef.current = 0
    setIndex(0)
    setActivityElapsed(0)
    setSessionElapsed(0)
    setFinished(false)
    setStarted(start)
    setRunning(start && activities.length > 0)
    lastTickRef.current = performance.now()
  }, [activities.length])

  useEffect(() => {
    if (!running || finished) return undefined
    lastTickRef.current = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      let nextElapsed = activityElapsedRef.current + delta
      let nextIndex = indexRef.current
      let done = false
      sessionElapsedRef.current += delta

      while (nextIndex < activities.length && nextElapsed >= activities[nextIndex].duration * 1000) {
        nextElapsed -= activities[nextIndex].duration * 1000
        nextIndex += 1
      }
      if (nextIndex >= activities.length) {
        nextIndex = Math.max(0, activities.length - 1)
        nextElapsed = activities.length ? activities[nextIndex].duration * 1000 : 0
        done = true
      }
      indexRef.current = nextIndex
      activityElapsedRef.current = nextElapsed
      setIndex(nextIndex)
      setActivityElapsed(nextElapsed)
      setSessionElapsed(sessionElapsedRef.current)
      if (done) {
        setRunning(false)
        setFinished(true)
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [activities, finished, running])

  const start = useCallback(() => {
    if (finished) reset(true)
    else {
      lastTickRef.current = performance.now()
      setStarted(true)
      setRunning(true)
    }
  }, [finished, reset])
  const pause = useCallback(() => setRunning(false), [])
  const skip = useCallback(() => {
    if (indexRef.current >= activities.length - 1) {
      setRunning(false)
      setFinished(true)
      return
    }
    indexRef.current += 1
    activityElapsedRef.current = 0
    setIndex(indexRef.current)
    setActivityElapsed(0)
    lastTickRef.current = performance.now()
  }, [activities.length])
  const restartActivity = useCallback(() => {
    activityElapsedRef.current = 0
    setActivityElapsed(0)
    lastTickRef.current = performance.now()
  }, [])
  const stop = useCallback(() => reset(false), [reset])

  return {
    index,
    activityElapsed,
    sessionElapsed,
    running,
    started,
    finished,
    speed,
    setSpeed,
    start,
    pause,
    skip,
    restartActivity,
    stop,
    reset,
  }
}
