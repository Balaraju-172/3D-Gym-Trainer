import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { AnimationMixer, Box3, LoopOnce, LoopRepeat, SRGBColorSpace, Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { AVATAR_URL } from '../data/animationRegistry.js'

let trainerAssetsPromise
let trainerAssetsKey = ''

function loadTrainerAssets(sources) {
  const key = sources.map((source) => source.url).join('|')
  if (!trainerAssetsPromise || key !== trainerAssetsKey) {
    trainerAssetsKey = key
    const loader = new FBXLoader()
    trainerAssetsPromise = Promise.all([
      new Promise((resolve, reject) => loader.load(AVATAR_URL, resolve, undefined, reject)),
      ...sources.map((source) => new Promise((resolve) => {
        loader.load(source.url, resolve, undefined, (error) => {
          console.error(`Unable to load ${source.file}`, error)
          resolve(null)
        })
      })),
    ]).catch((error) => {
      trainerAssetsPromise = null
      trainerAssetsKey = ''
      throw error
    })
  }
  return trainerAssetsPromise
}

function LoadingStatus() {
  return <div className="scene-loading">Preparing your trainer <span className="loading-dot" /></div>
}

function getHipsPositionTrack(clip) {
  return clip.tracks.find((track) => /^hips\.position$/i.test(track.name))
}

function alignRootMotion(previousClip, nextClip) {
  const previousTrack = getHipsPositionTrack(previousClip)
  const nextTrack = getHipsPositionTrack(nextClip)
  if (!previousTrack || !nextTrack || previousTrack.values.length < 3 || nextTrack.values.length < 3) {
    console.warn('Unable to align composite animation root motion; a Hips.position track is missing.')
    return
  }
  const previousEnd = previousTrack.values.length - 3
  const delta = [0, 1, 2].map((axis) => previousTrack.values[previousEnd + axis] - nextTrack.values[axis])
  for (let index = 0; index < nextTrack.values.length; index += 3) {
    nextTrack.values[index] += delta[0]
    nextTrack.values[index + 1] += delta[1]
    nextTrack.values[index + 2] += delta[2]
  }
}

class SceneAssetBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function GymProps() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#171c23" roughness={0.76} metalness={0.2} />
      </mesh>
      <gridHelper args={[24, 24, '#343d49', '#222a34']} position={[0, -0.025, 0]} />
      {[-5.7, 5.7].map((x) => (
        <mesh key={x} position={[x, 2.4, -3.2]}>
          <boxGeometry args={[0.035, 4.7, 8]} />
          <meshStandardMaterial color="#26313d" metalness={0.9} roughness={0.18} emissive="#101923" />
        </mesh>
      ))}
      {[-3.65, 0, 3.65].map((x) => (
        <group key={`mirror-${x}`} position={[x, 2.35, -5.35]}>
          <mesh>
            <boxGeometry args={[3.25, 4.15, 0.12]} />
            <meshStandardMaterial color="#202a34" metalness={0.72} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <planeGeometry args={[3.05, 3.95]} />
            <meshStandardMaterial color="#34495b" metalness={0.94} roughness={0.12} emissive="#102033" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[-0.7, 0, 0.078]}>
            <planeGeometry args={[0.025, 3.75]} />
            <meshBasicMaterial color="#8bb4d3" transparent opacity={0.18} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.9, -3.25]}>
        <boxGeometry args={[11.5, 0.08, 8]} />
        <meshStandardMaterial color="#273241" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-3.4, 3.4].map((x) => (
        <group key={x} position={[x, 0.3, -1.4]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.13, 24]} />
            <meshStandardMaterial color="#07090c" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.47, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
            <meshStandardMaterial color="#969eaa" metalness={0.85} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0.64, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.13, 24]} />
            <meshStandardMaterial color="#07090c" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <group position={[-4.45, 0.88, 0.35]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 2.25, 16]} />
          <meshStandardMaterial color="#aeb8c2" metalness={0.95} roughness={0.22} />
        </mesh>
        {[-0.9, 0.9].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.16, 24]} />
              <meshStandardMaterial color="#080a0d" metalness={0.65} roughness={0.38} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.19, 24]} />
              <meshStandardMaterial color="#12171e" metalness={0.72} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0.06, -4.8]} castShadow>
        <boxGeometry args={[4, 0.12, 0.6]} />
        <meshStandardMaterial color="#202832" metalness={0.7} roughness={0.32} />
      </mesh>
      <mesh position={[0, 2.6, -6.9]}>
        <boxGeometry args={[0.09, 0.08, 0.5]} />
        <meshStandardMaterial color="#269cff" emissive="#1688ff" emissiveIntensity={2.6} />
      </mesh>
    </group>
  )
}

function Trainer({ animationId, playing, speed, restartToken, assets, animations, onReady, onError }) {
  const trainerRef = useRef()
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const compositeActionsRef = useRef({})
  const allActionsRef = useRef([])
  const activeRef = useRef(null)
  const sequenceRef = useRef(null)
  const playingRef = useRef(playing)
  const restartTokenRef = useRef(restartToken)
  const [loaded, setLoaded] = useState(null)
  const sources = useMemo(() => animations.filter((animation) => animation.url), [animations])

  useEffect(() => {
    if (!assets) return undefined
    const [avatar, ...files] = assets
    const model = cloneSkeleton(avatar)
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        node.receiveShadow = true
        if (node.material?.map) node.material.map.colorSpace = SRGBColorSpace
      }
    })
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const scale = 3.15 / Math.max(size.y, 0.001)
    model.scale.setScalar(scale)
    model.position.y = -box.min.y * scale
    const mixer = new AnimationMixer(model)
    const boneNames = new Set()
    model.traverse((node) => { if (node.isBone) boneNames.add(node.name) })
    const clips = {}
    const actions = {}
    sources.forEach((source, index) => {
      const clip = files[index]?.animations?.[0]
      if (!clip) return
      const retargetedClip = clip.clone()
      const matched = retargetedClip.tracks.filter((track) => {
        const separator = track.name.indexOf('.')
        const sourceName = separator < 0 ? track.name : track.name.slice(0, separator)
        const nodeName = sourceName.replace(/^.*:/, '').replace(/^mixamorig:?/i, '')
        if (!boneNames.has(nodeName)) return false
        track.name = `${nodeName}${separator < 0 ? '' : track.name.slice(separator)}`
        return true
      }).length
      const compatible = matched >= Math.max(3, Math.ceil(clip.tracks.length * 0.2))
      if (!compatible) {
        console.warn(`Skipping incompatible ${source.file}: only ${matched}/${clip.tracks.length} tracks match the avatar.`)
        return
      }
      clips[source.id] = retargetedClip
      const action = mixer.clipAction(retargetedClip)
      if (source.kind === 'transition') {
        action.setLoop(LoopOnce, 1)
        action.clampWhenFinished = true
      } else {
        action.setLoop(LoopRepeat, Infinity)
      }
      actions[source.id] = action
    })
    const compositeActions = {}
    animations.filter((animation) => animation.kind === 'composite').forEach((animation) => {
      const stageClips = []
      for (const stage of animation.stages) {
        const sourceClip = clips[stage.animationId]
        if (!sourceClip) {
          stageClips.length = 0
          break
        }
        const stageClip = sourceClip.clone()
        if (stage.alignRootToPrevious && stageClips.length) {
          alignRootMotion(stageClips[stageClips.length - 1], stageClip)
        }
        stageClips.push(stageClip)
      }
      if (!stageClips.length) return
      compositeActions[animation.id] = animation.stages.map((stage, index) => {
        const action = mixer.clipAction(stageClips[index])
        if (stage.mode === 'once') {
          action.setLoop(LoopOnce, 1)
          action.clampWhenFinished = true
        } else {
          action.setLoop(LoopRepeat, Infinity)
        }
        return action
      })
    })
    if (!actions.idle) {
      onError(new Error('Standing Idle could not be loaded or is incompatible with the avatar.'))
      return undefined
    }
    const handleFinished = (event) => {
      const sequence = sequenceRef.current
      if (!sequence || sequence.actions[sequence.index] !== event.action) return
      const nextIndex = sequence.index + 1
      if (nextIndex >= sequence.actions.length) {
        sequenceRef.current = null
        return
      }
      event.action.fadeOut(0.22)
      const nextAction = sequence.actions[nextIndex]
      nextAction.reset()
      nextAction.paused = !playingRef.current
      nextAction.fadeIn(0.22).play()
      sequenceRef.current = { ...sequence, index: nextIndex }
      activeRef.current = sequence.animationId
    }
    mixer.addEventListener('finished', handleFinished)
    mixerRef.current = mixer
    actionsRef.current = actions
    compositeActionsRef.current = compositeActions
    allActionsRef.current = [...Object.values(actions), ...Object.values(compositeActions).flat()]
    trainerRef.current.add(model)
    actions.idle.play()
    activeRef.current = 'idle'
    setLoaded(true)
    onReady(animations
      .filter((animation) => animation.library !== false)
      .filter((animation) => animation.kind === 'composite'
        ? Boolean(compositeActions[animation.id])
        : Boolean(actions[animation.id]))
      .map((animation) => animation.id))
    return () => {
      mixer.removeEventListener('finished', handleFinished)
      mixer.stopAllAction()
      trainerRef.current?.remove(model)
      mixerRef.current = null
      actionsRef.current = {}
      compositeActionsRef.current = {}
      allActionsRef.current = []
      sequenceRef.current = null
    }
  }, [animations, assets, onError, onReady, sources])

  useEffect(() => {
    const actions = actionsRef.current
    if (!loaded) return
    const compositeStages = compositeActionsRef.current[animationId]
    const next = compositeStages?.[0] ?? actions[animationId] ?? actions.idle
    const restartRequested = restartTokenRef.current !== restartToken
    restartTokenRef.current = restartToken
    if (activeRef.current !== animationId || restartRequested) {
      allActionsRef.current.forEach((action) => {
        if (action.isRunning() && action !== next) action.fadeOut(0.2)
      })
      sequenceRef.current = compositeStages
        ? { animationId, actions: compositeStages, index: 0 }
        : null
      next.reset()
      next.paused = !playing
      next.fadeIn(0.3).play()
      activeRef.current = animationId
    }
  }, [animationId, loaded, playing, restartToken])

  useEffect(() => {
    playingRef.current = playing
    allActionsRef.current.forEach((action) => { action.paused = !playing })
    if (mixerRef.current) mixerRef.current.timeScale = speed
  }, [playing, speed, loaded])

  useFrame((_, delta) => mixerRef.current?.update(delta))
  return <group ref={trainerRef} position={[0, 0, 0]} />
}

export default function TrainerScene({ animationId, playing, speed, restartToken, animations, onReady, onError }) {
  const [ready, setReady] = useState(false)
  const [assets, setAssets] = useState(null)
  const sources = useMemo(() => animations.filter((animation) => animation.url), [animations])
  const handleReady = useCallback((ids) => {
    setReady(true)
    onReady(ids)
  }, [onReady])
  const handleError = useCallback((error) => {
    setReady(true)
    onError(error)
  }, [onError])
  useEffect(() => {
    let active = true
    loadTrainerAssets(sources).then((loadedAssets) => {
      if (active) setAssets(loadedAssets)
    }).catch(handleError)
    return () => { active = false }
  }, [handleError, sources])
  return (
    <div className="trainer-canvas">
      <Canvas shadows camera={{ position: [4.1, 2.7, 7.7], fov: 34 }} dpr={[1, 1.7]}>
        <color attach="background" args={['#10151c']} />
        <fog attach="fog" args={['#10151c', 13, 27]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 8, 4]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} />
        <spotLight position={[-5, 5, -2]} color="#228fff" intensity={30} angle={0.45} penumbra={0.8} />
        <pointLight position={[5, 2, -3]} color="#1879e8" intensity={12} />
        <GymProps />
        <SceneAssetBoundary onError={handleError}>
          <Suspense fallback={null}>
            {assets && <Trainer animationId={animationId} playing={playing} speed={speed} restartToken={restartToken} assets={assets} animations={animations} onReady={handleReady} onError={handleError} />}
            <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={9} blur={2.6} far={4} />
          </Suspense>
        </SceneAssetBoundary>
        <OrbitControls target={[0, 1.45, 0]} minDistance={3.5} maxDistance={11} maxPolarAngle={Math.PI / 2.02} enablePan={false} />
      </Canvas>
      {!ready && <LoadingStatus />}
    </div>
  )
}
