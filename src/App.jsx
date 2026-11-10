import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Dumbbell, Flame, Footprints,
  Gauge, HeartPulse, Pause, Play, RotateCcw, ShieldCheck, SkipForward, Sparkles,
  Square, Target, Timer, Trophy, UserRound, X,
} from 'lucide-react'
import { DEFAULT_ANIMATIONS, loadAnimationRegistry } from './data/animationRegistry.js'
import { DEFAULT_PREFERENCES, generateWorkout } from './data/workouts.js'
import { useWorkoutSession } from './hooks/useWorkoutSession.js'

const STORAGE_KEY = 'virtual-gym-preferences-v1'
const TrainerScene = lazy(() => import('./components/TrainerScene.jsx'))
const GOALS = ['Weight Loss', 'Muscle Gain', 'Strength', 'General Fitness', 'Endurance']
const MUSCLES = ['Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Abs']
const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced']
const TIMES = [15, 20, 30, 45, 60]
const FREQUENCIES = [2, 3, 4, 5, 6]
const MIN_WORKOUT_MINUTES = 5
const MAX_WORKOUT_MINUTES = 120

function readPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : null
  } catch (error) {
    console.error('Unable to read saved fitness preferences.', error)
    return null
  }
}

function timeLabel(seconds) {
  const total = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark"><span /></div>
      <span>VIRTUAL<span className="brand-light">GYM</span></span>
    </div>
  )
}

function WelcomePage({ saved, onStart, onEdit }) {
  return (
    <main className="welcome-page">
      <header className="site-header">
        <Brand />
        <div className="header-note"><span className="status-dot" /> YOUR TRAINING SPACE</div>
      </header>
      <div className="welcome-grid">
        <section className="welcome-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> TRAIN DIFFERENT</div>
          <h1>YOUR<br /><span>VIRTUAL</span><br />GYM<span className="blue-period">.</span></h1>
          <p className="welcome-subtitle">Your goals. Your workout.<br />Your personal 3D trainer.</p>
          <p className="welcome-description">A training space built around you. Set your pace, find your rhythm, and show up for the strongest version of yourself.</p>
          <div className="welcome-actions">
            <button className="button button-primary button-large" onClick={onStart}>
              {saved ? 'CONTINUE TO YOUR GYM' : 'GET STARTED'} <ArrowRight size={17} />
            </button>
            {saved && <button className="text-button" onClick={onEdit}>EDIT FITNESS PREFERENCES</button>}
          </div>
          <div className="welcome-trust"><ShieldCheck size={16} /> YOUR PLAN SAVED PRIVATELY ON THIS DEVICE</div>
        </section>
        <section className="welcome-visual" aria-label="Your virtual gym preview">
          <div className="visual-glow" />
          <div className="visual-frame">
            <div className="visual-grid" />
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="trainer-silhouette">
              <div className="silhouette-head" /><div className="silhouette-neck" />
              <div className="silhouette-torso" /><div className="silhouette-arm arm-left" />
              <div className="silhouette-arm arm-right" /><div className="silhouette-leg leg-left" />
              <div className="silhouette-leg leg-right" />
            </div>
            <div className="visual-label"><span className="status-dot" /> YOUR TRAINER. YOUR PACE.</div>
            <div className="visual-index">VG / 001</div>
            <div className="visual-scanline" />
          </div>
          <div className="visual-caption"><span>01</span> A MORE PERSONAL WAY TO MOVE <span className="caption-rule" /></div>
        </section>
      </div>
      <footer className="welcome-footer"><span>BUILT FOR YOUR NEXT REP.</span><span>MOVE WITH PURPOSE <span className="footer-blue">✳</span></span></footer>
    </main>
  )
}

function SelectCards({ values, selected, onSelect, columns = 2 }) {
  return (
    <div className="option-grid" style={{ '--columns': columns }}>
      {values.map((value, index) => (
        <button key={value} className={`option-card ${selected === value ? 'selected' : ''}`} onClick={() => onSelect(value)}>
          <span className="option-number">{String(index + 1).padStart(2, '0')}</span>
          <span>{value}</span>
          <span className="option-check">{selected === value && <Check size={14} />}</span>
        </button>
      ))}
    </div>
  )
}

function PreferencesPage({ initial, onSave, onBack }) {
  const [values, setValues] = useState(initial ?? DEFAULT_PREFERENCES)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const steps = ['YOUR GOAL', 'ABOUT YOU', 'YOUR RHYTHM', 'YOUR SETUP']
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const toggleMuscle = (muscle) => {
    const selected = values.muscles
    update('muscles', muscle === 'Full Body'
      ? ['Full Body']
      : selected.includes(muscle)
        ? selected.filter((item) => item !== muscle)
        : [...selected.filter((item) => item !== 'Full Body'), muscle])
  }
  const validate = () => {
    if (step === 1 && (values.age < 13 || values.age > 100 || values.height < 100 || values.height > 250 || values.weight < 25 || values.weight > 350
      || (values.targetWeight && (values.targetWeight < 25 || values.targetWeight > 350)))) {
      return 'Enter a realistic age, height, and current weight. Optional target weight must be between 25 and 350 kg.'
    }
    if (step === 2 && (!Number.isInteger(Number(values.duration))
      || values.duration < MIN_WORKOUT_MINUTES || values.duration > MAX_WORKOUT_MINUTES)) {
      return `Choose a session length between ${MIN_WORKOUT_MINUTES} and ${MAX_WORKOUT_MINUTES} minutes.`
    }
    if (step === 3 && !values.muscles.length) return 'Choose at least one target muscle group.'
    return ''
  }
  const next = () => {
    const message = validate()
    if (message) { setError(message); return }
    setError('')
    if (step < steps.length - 1) setStep(step + 1)
    else onSave(values)
  }

  return (
    <main className="preferences-page">
      <header className="site-header"><button className="brand-button" onClick={onBack}><Brand /></button><div className="header-note">PERSONALIZE YOUR TRAINING <span className="header-step">/ 0{step + 1}</span></div></header>
      <div className="preferences-shell">
        <aside className="preferences-aside">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR FOUNDATION</div>
          <h1>MAKE IT<br /><span>YOUR</span><br />OWN.</h1>
          <p>A few details help your trainer shape a session around you—not the other way around.</p>
          <div className="step-list">
            {steps.map((label, index) => <div key={label} className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}>
              <span className="step-indicator">{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span>{label}</span>
            </div>)}
          </div>
          <div className="privacy-note"><ShieldCheck size={17} /><span>YOUR DETAILS STAY ON<br />THIS DEVICE.</span></div>
        </aside>
        <section className="preferences-card">
          <div className="form-topline"><span>STEP 0{step + 1} <span className="muted">/ 0{steps.length}</span></span><span>{steps[step]}</span></div>
          <div className="progress-track"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          {step === 0 && <div className="form-step">
            <div className="form-kicker">01 — SET YOUR INTENTION</div><h2>What brings you<br />here?</h2><p className="form-hint">Choose the goal that feels right for you.</p>
            <SelectCards values={GOALS} selected={values.goal} onSelect={(value) => update('goal', value)} columns={2} />
          </div>}
          {step === 1 && <div className="form-step">
            <div className="form-kicker">02 — THE BASICS</div><h2>A little about<br />you.</h2><p className="form-hint">We use this to keep your plan appropriate.</p>
            <div className="number-grid">
              {[['age', 'AGE', 'years', 13, 100], ['height', 'HEIGHT', 'cm', 100, 250], ['weight', 'CURRENT WEIGHT', 'kg', 25, 350]].map(([key, label, unit, min, max]) => (
                <label key={key} className="number-field"><span>{label}</span><div><input type="number" min={min} max={max} value={values[key]} onChange={(event) => update(key, Number(event.target.value))} /><small>{unit}</small></div></label>
              ))}
              <label className="number-field"><span>TARGET WEIGHT <i>OPTIONAL</i></span><div><input type="number" min="25" max="350" placeholder="—" value={values.targetWeight} onChange={(event) => update('targetWeight', event.target.value)} /><small>kg</small></div></label>
            </div>
            <div className="range-field"><div><span>AGE RANGE</span><strong>{values.age} <small>YEARS</small></strong></div><input type="range" min="13" max="100" value={Math.min(100, Math.max(13, values.age))} onChange={(event) => update('age', Number(event.target.value))} /></div>
          </div>}
          {step === 2 && <div className="form-step">
            <div className="form-kicker">03 — FIND YOUR RHYTHM</div><h2>Build your<br />routine.</h2><p className="form-hint">Choose a pace you can come back to.</p>
            <div className="field-group"><div className="field-heading">EXPERIENCE</div><SelectCards values={EXPERIENCES} selected={values.experience} onSelect={(value) => update('experience', value)} columns={3} /></div>
            <div className="field-group">
              <div className="field-heading">SESSION LENGTH <span>CUSTOM · {values.duration} MIN</span></div>
              <div className="pill-row">{TIMES.map((time) => <button key={time} onClick={() => update('duration', time)} className={`choice-pill ${values.duration === time ? 'selected' : ''}`}>{time}<small>MIN</small></button>)}</div>
              <div className="custom-duration">
                <input aria-label="Custom workout duration in minutes" type="number" min={MIN_WORKOUT_MINUTES} max={MAX_WORKOUT_MINUTES} step="1" value={values.duration} onChange={(event) => update('duration', event.target.value === '' ? '' : Number(event.target.value))} onBlur={() => {
                  if (values.duration !== '') update('duration', Math.min(MAX_WORKOUT_MINUTES, Math.max(MIN_WORKOUT_MINUTES, Math.round(Number(values.duration)))))
                }} />
                <span>MIN</span>
              </div>
              <input aria-label="Workout duration slider" className="duration-slider" type="range" min={MIN_WORKOUT_MINUTES} max={MAX_WORKOUT_MINUTES} value={Math.min(MAX_WORKOUT_MINUTES, Math.max(MIN_WORKOUT_MINUTES, Number(values.duration) || MIN_WORKOUT_MINUTES))} onChange={(event) => update('duration', Number(event.target.value))} />
              <div className="duration-range-labels"><span>{MIN_WORKOUT_MINUTES} MIN</span><span>{MAX_WORKOUT_MINUTES} MIN</span></div>
            </div>
            <div className="field-group"><div className="field-heading">DAYS PER WEEK <span>{values.frequency} DAYS</span></div><div className="pill-row">{FREQUENCIES.map((frequency) => <button key={frequency} onClick={() => update('frequency', frequency)} className={`choice-pill ${values.frequency === frequency ? 'selected' : ''}`}>{frequency}<small>DAYS</small></button>)}</div></div>
          </div>}
          {step === 3 && <div className="form-step">
            <div className="form-kicker">04 — YOUR SPACE & FOCUS</div><h2>Train your<br />way.</h2><p className="form-hint">Your trainer will work with what you have.</p>
            <div className="field-group"><div className="field-heading">WHERE DO YOU TRAIN?</div><SelectCards values={['Home', 'Gym']} selected={values.location} onSelect={(value) => update('location', value)} columns={2} /></div>
            <div className="field-group"><div className="field-heading">AVAILABLE EQUIPMENT</div><SelectCards values={['No Equipment', 'Dumbbells', 'Resistance Bands', 'Full Gym']} selected={values.equipment} onSelect={(value) => update('equipment', value)} columns={2} /></div>
            <div className="field-group"><div className="field-heading">TARGET MUSCLE GROUPS <span>SELECT ANY</span></div><div className="muscle-grid">{MUSCLES.map((muscle) => <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`choice-pill ${values.muscles.includes(muscle) ? 'selected' : ''}`}>{muscle}{values.muscles.includes(muscle) && <Check size={12} />}</button>)}</div></div>
            <label className="restriction-field"><span>EXERCISE RESTRICTIONS <i>OPTIONAL</i></span><input value={values.restrictions} onChange={(event) => update('restrictions', event.target.value)} placeholder="e.g. avoid jumping or squats" /></label>
          </div>}
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button className="button button-quiet" onClick={() => step === 0 ? onBack() : (setStep(step - 1), setError(''))}><ArrowLeft size={16} /> BACK</button>
            <span className="form-save-note"><ShieldCheck size={14} /> SAVED AS YOU GO</span>
            <button className="button button-primary" onClick={next}>{step === steps.length - 1 ? 'BUILD MY WORKOUT' : 'CONTINUE'} <ArrowRight size={16} /></button>
          </div>
        </section>
      </div>
    </main>
  )
}

function GymPage({ preferences, activities, animations, registryWarning, onEdit, onHome }) {
  console.log('GymPage', activities)
  const session = useWorkoutSession(activities)
  const [availableAnimations, setAvailableAnimations] = useState([])
  const [sceneError, setSceneError] = useState('')
  const [previewAnimation, setPreviewAnimation] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [restartToken, setRestartToken] = useState(0)
  const current = activities[session.index]
  const nextActivity = activities[session.index + 1]
  const totalDuration = activities.reduce((sum, item) => sum + item.duration, 0)
  const completedDuration = activities.slice(0, session.index).reduce((sum, item) => sum + item.duration, 0)
  const currentProgress = session.finished ? current.duration : session.activityElapsed / 1000
  const plannedElapsed = completedDuration + Math.min(current.duration, currentProgress)
  const progress = Math.min(100, (plannedElapsed / totalDuration) * 100)
  const animationId = previewAnimation && !session.running
    ? previewAnimation
    : session.started
      ? current.animationId
      : 'idle'
  const handleReady = useCallback((ids) => setAvailableAnimations(ids), [])
  const handleSceneError = useCallback((error) => {
    console.error('The trainer scene could not be loaded.', error)
    setSceneError('The 3D trainer could not be loaded. Check that the supplied FBX files are available and try refreshing.')
  }, [])
  const begin = () => { setPreviewAnimation(''); session.start() }
  const restart = () => {
    session.restartActivity()
    setPreviewAnimation('')
    setRestartToken((token) => token + 1)
  }
  const stop = () => { session.stop(); setPreviewAnimation(''); setShowCompletion(false) }
  const overallMinutes = Math.floor(session.sessionElapsed / 60000)
  const elapsedSeconds = Math.floor(session.sessionElapsed / 1000) % 60

  useEffect(() => {
    if (session.finished) setShowCompletion(true)
  }, [session.finished])

  return (
    <main className="gym-page">
      <header className="gym-header">
        <button className="brand-button" onClick={onHome}><Brand compact /></button>
        <div className="gym-header-center"><span className="status-dot" /> PERSONAL TRAINING SPACE</div>
        <button className="button button-outline button-small" onClick={onEdit}>EDIT PLAN <ChevronDown size={14} /></button>
      </header>
      {registryWarning && <div className="registry-warning" role="status">MOVEMENT LIBRARY NOTICE — {registryWarning} Using the built-in movements for this session.</div>}
      <div className="gym-layout">
        <aside className="workout-sidebar">
          <div className="side-heading"><div><span className="eyebrow-line" /> YOUR SESSION</div><button className="icon-button" title="Edit preferences" onClick={onEdit}><Target size={16} /></button></div>
          <h2>{preferences.goal}<br /><span>DAY 01 <i>/ {preferences.frequency} DAYS PER WEEK</i></span></h2>
          <div className="workout-meta"><span><Clock3 size={14} /> {preferences.duration} MIN</span><span><Flame size={14} /> {preferences.experience}</span></div>
          <div className="side-progress"><div className="side-progress-label"><span>SESSION PROGRESS</span><strong>{Math.round(progress)}%</strong></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div>          <div className="side-progress-time"><span>{timeLabel(session.sessionElapsed / 1000)} ELAPSED</span><span>{timeLabel(Math.max(0, totalDuration - plannedElapsed))} LEFT</span></div></div>
          <div className="activity-list-heading">TODAY'S ACTIVITIES <span>{activities.length}</span></div>
          <div className="activity-list">
            {activities.map((activity, index) => {
              const isComplete = index < session.index || (session.finished && index <= session.index)
              return <div key={activity.id} className={`activity-row ${index === session.index && !session.finished ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                <span className="activity-number">{isComplete ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
                <span className="activity-name">{activity.title}<small>{activity.kind === 'exercise' ? `${activity.category} · ${activity.muscles}` : activity.kind.toUpperCase()}</small></span>
                <span className="activity-duration">{activity.kind === 'preview' ? 'PREVIEW' : activity.duration < 60 ? timeLabel(activity.duration) : <>{Math.round(activity.duration / 60)}<small>M</small></>}</span>
              </div>
            })}
          </div>
          <div className="library-block"><div className="activity-list-heading">PREVIEW MOVEMENTS <span>{animations.filter((animation) => animation.library !== false).length}</span></div>
            {animations.filter((animation) => animation.library !== false).map((animation) => <button key={animation.id} className={`library-item ${previewAnimation === animation.id ? 'selected' : ''} ${!availableAnimations.includes(animation.id) ? 'unavailable' : ''}`} onClick={() => {
              if (!session.running && availableAnimations.includes(animation.id)) setPreviewAnimation(animation.id)
            }} title={!availableAnimations.includes(animation.id) ? 'Animation unavailable or incompatible' : `Preview ${animation.label}`}>
              <span className="library-indicator" />{animation.label}<small>{animation.kind === 'composite' ? 'COMPOSITE PREVIEW' : animation.kind === 'transition' ? 'TRANSITION PREVIEW' : 'PREVIEW'}</small>
            </button>)}
          </div>
          <div className="side-footer"><span><UserRound size={14} /> {preferences.experience.toUpperCase()} MODE</span><button className="text-button" onClick={onHome}>EXIT GYM</button></div>
        </aside>

        <section className="scene-column">
          <div className="scene-topbar"><div><span className="scene-live-dot" /> LIVE TRAINER</div><div className="camera-hint"><span>DRAG TO ROTATE</span><span>SCROLL TO ZOOM</span></div></div>
          <div className="scene-stage">
            <Suspense fallback={<div className="scene-loading">Preparing your trainer <span className="loading-dot" /></div>}>
              <TrainerScene animationId={animationId} playing={session.running || !session.started || Boolean(previewAnimation)} speed={session.speed} restartToken={restartToken} animations={animations} onReady={handleReady} onError={handleSceneError} />
            </Suspense>
            {sceneError && <div className="scene-error"><Dumbbell size={23} /><strong>TRAINER UNAVAILABLE</strong><span>{sceneError}</span></div>}
            <div className="scene-exercise-tag"><span>{session.finished ? 'SESSION COMPLETE' : session.running ? 'NOW MOVING' : session.started ? 'SESSION PAUSED' : previewAnimation ? 'MOVEMENT PREVIEW' : 'READY WHEN YOU ARE'}</span><strong>{previewAnimation ? animations.find((animation) => animation.id === previewAnimation)?.label : current?.title}</strong></div>
            <div className="scene-badge"><Sparkles size={14} /> YOUR 3D TRAINER</div>
            <div className="scene-corner scene-corner-tl" /><div className="scene-corner scene-corner-br" />
          </div>
          <div className="scene-footnote"><span><span className="status-dot" /> TRAINER ACTIVE</span><span>PERSONAL PLAN <i>/</i> {preferences.duration} MIN</span><span>VG — 01</span></div>
          <div className="control-dock">
            <div className="dock-primary">
              {!session.running
                ? <button className="play-button" onClick={begin}><Play size={16} fill="currentColor" /> {session.finished ? 'RESTART SESSION' : session.started ? 'RESUME SESSION' : 'START WORKOUT'}</button>
                : <button className="play-button pause-button" onClick={session.pause}><Pause size={16} fill="currentColor" /> PAUSE</button>}
              <button className="dock-icon" title="Skip activity" onClick={session.skip} disabled={!session.running && !session.sessionElapsed}><SkipForward size={17} /><span>SKIP</span></button>
              <button className="dock-icon" title="Restart activity" onClick={restart} disabled={!session.running && !session.sessionElapsed}><RotateCcw size={16} /><span>RESTART</span></button>
              <button className="dock-icon" title="Stop workout" onClick={stop}><Square size={15} /><span>STOP</span></button>
            </div>
            <div className="speed-control"><Gauge size={15} /><span>SPEED</span><select aria-label="Animation speed" value={session.speed} onChange={(event) => session.setSpeed(Number(event.target.value))}>{[0.5, 0.75, 1, 1.25, 1.5].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select></div>
          </div>
        </section>

        <aside className="exercise-sidebar">
          <div className="right-kicker"><span className="eyebrow-line" /> CURRENT ACTIVITY</div>
          <div className="exercise-timer">{session.running || session.sessionElapsed > 0 ? timeLabel((current.duration * 1000 - session.activityElapsed) / 1000) : timeLabel(current.duration)}<small>REMAINING</small></div>
          <span className={`activity-type type-${current.kind}`}>{current.kind === 'exercise' ? 'MOVEMENT' : current.kind.toUpperCase()}</span>
          <h1>{current.title}</h1>
          <div className="field-heading">{current.category}</div>
          <div className="muscle-target"><Target size={15} /><span>TARGET</span><strong>{current.muscles}</strong></div>
          <div className="instruction-card"><div className="instruction-title"><HeartPulse size={15} /> YOUR CUE</div><p>{current.instructions}</p></div>
          <div className="next-card"><div className="next-label">UP NEXT <ArrowRight size={13} /></div>
            {nextActivity ? <div className="next-activity"><span className="next-icon"><Footprints size={15} /></span><span>{nextActivity.title}<small>{nextActivity.kind === 'exercise' ? nextActivity.muscles : nextActivity.kind.toUpperCase()}</small></span><strong>{timeLabel(nextActivity.duration)}</strong></div> : <div className="next-activity"><span className="next-icon"><Trophy size={15} /></span><span>Session complete<small>YOU DID THE WORK</small></span></div>}
          </div>
          <div className="session-clock"><Timer size={15} /><span>SESSION TIME</span><strong>{timeLabel(overallMinutes * 60 + elapsedSeconds)}</strong></div>
          <div className="disclaimer">Move at a pace that feels right. Stop if anything feels painful.</div>
        </aside>
      </div>
      {showCompletion && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <section className="completion-modal"><button className="modal-close" onClick={() => setShowCompletion(false)} aria-label="Close"><X size={18} /></button>
          <div className="completion-icon"><Trophy size={26} /></div><div className="eyebrow"><span className="eyebrow-line" /> SESSION COMPLETE</div>
          <h2 id="complete-title">YOU SHOWED<br /><span>UP.</span></h2><p>That’s what counts. Take a breath and give yourself credit for putting in the work.</p>
          <div className="completion-stats"><div><strong>{activities.filter((activity) => activity.kind === 'exercise' || activity.kind === 'warmup').length}</strong><span>ACTIVITIES</span></div><div><strong>{timeLabel(session.sessionElapsed / 1000)}</strong><span>TIME MOVING</span></div><div><strong>{preferences.duration}</strong><span>MIN PLANNED</span></div></div>
          <button className="button button-primary button-large modal-main" onClick={() => { stop(); setShowCompletion(false) }}>BACK TO YOUR GYM <ArrowRight size={16} /></button>
        </section>
      </div>}
    </main>
  )
}

export default function App() {
  console.log('App render')
  const [preferences, setPreferences] = useState(readPreferences)
  const [page, setPage] = useState('welcome')
  const [animations, setAnimations] = useState(DEFAULT_ANIMATIONS)
  const [registryWarning, setRegistryWarning] = useState('')
  const activities = useMemo(() => generateWorkout(preferences ?? DEFAULT_PREFERENCES, animations), [animations, preferences])
  useEffect(() => {
    let active = true
    loadAnimationRegistry().then((registry) => {
      if (active) setAnimations(registry)
    }).catch((error) => {
      console.error('Unable to load the runtime animation registry; using built-in movements.', error)
      if (active) setRegistryWarning(error.message)
    })
    return () => { active = false }
  }, [])
  const savePreferences = (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setPreferences(next)
      setPage('gym')
    } catch (error) {
      console.error('Unable to save fitness preferences.', error)
      window.alert('Your preferences could not be saved in this browser. Please check available storage and try again.')
    }
  }
  if (page === 'preferences') return <PreferencesPage initial={preferences} onSave={savePreferences} onBack={() => setPage('welcome')} />
  if (page === 'gym' && preferences) return <GymPage key={JSON.stringify(preferences)} preferences={preferences} activities={activities} animations={animations} registryWarning={registryWarning} onEdit={() => setPage('preferences')} onHome={() => setPage('welcome')} />
  return <WelcomePage saved={Boolean(preferences)} onStart={() => setPage(preferences ? 'gym' : 'preferences')} onEdit={() => setPage('preferences')} />
}
