# Virtual Gym

A three-screen personalized fitness app built with React, Vite, Three.js, React Three Fiber, and the supplied Mixamo FBX assets.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Supplied 3D assets

- Avatar: `avatar/Virtual_Gym_Trainer.fbx`
- Animations: `animations/Standing Idle.fbx`, `animations/Air Squat.fbx`, `animations/Idle To Push Up.fbx`, `animations/Push Up.fbx`, `animations/Bicep Curl.fbx`, and `animations/Jumping Jacks.fbx`

The original avatar and its materials are loaded as-is. Animation clips are checked and retargeted to the avatar's unprefixed Mixamo bone names before use; incompatible clips are skipped with a console warning. Push-ups is one logical composite movement: Ready to Push-ups plays once, then Push Up loops on the same avatar. The stage actions are not played simultaneously, and the loop's root position is aligned to the transition endpoint.

## Add an animation

Add the FBX file to `animations/` and add a record to `animations/registry.json`. A complete exercise needs `id`, `label`, `file`, `kind: "loop"`, `targets`, `muscles`, `instruction`, and optional `equipment` and `goalOrder` fields. A composite exercise instead uses `kind: "composite"` and an ordered `stages` list whose entries reference source animation IDs and use `mode: "once"` or `"loop"`. Set `alignRootToPrevious: true` on a stage when its Hips root-position track should continue from the preceding stage. Set `library: false` on source clips that should only be used as stages. The browser controller and rule-based scheduler read this registry at runtime.

The production build copies `animations/` to `dist/animations/`. In an already-deployed build, adding an exercise only requires uploading its FBX file and updated `registry.json` to the deployed `animations/` folder; the app fetches the manifest without rebuilding its JavaScript bundle. Reload the app to pick up registry changes.

Workout plans list the five logical activities once, with a warm-up, compatible exercises, a cool-down, and incompatible exercises clearly marked preview-only. Push-ups is scheduled as one composite activity rather than separate transition and repetition entries. Equipment choices and restrictions determine which movements are scheduled. Users can choose a preset session or set a custom 5–120 minute duration, and all timed activities add up to that duration. The Virtual Gym preview lets users audition all five logical activities, including composite movements. Preferences are stored in browser local storage.
