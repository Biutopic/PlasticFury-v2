# PlasticFury

### Architecture

```
src/
├── game/
│   ├── gameEngine.ts    # Pure physics/collision/collection functions
│   ├── botAI.ts         # Simple state-machine AI
│   ├── types.ts         # Shared interfaces (PlayerState, GarbageItem, etc.)
│   ├── constants.ts     # All tunable values + asset mapping stubs
│   └── waveUtils.ts     # Ocean wave math
├── components/game/
│   ├── GameContainer.tsx  # Main orchestrator (input, state, canvas)
│   ├── GameScene.tsx      # Three.js scene/camera
│   ├── GameLoop.tsx       # rAF tick: physics → collision → spawn → render
│   ├── BoatModel.tsx      # Procedural boat geometry (level-aware)
│   ├── GarbageModel.tsx   # Procedural garbage (bottle/bag/can)
│   ├── Ocean.tsx          # Dynamic wave mesh (128×128 subdivisions)
│   ├── HUD.tsx            # Health/plastic/level bars
│   ├── Leaderboard.tsx    # Live rankings
│   └── PlayerLabel.tsx    # 3D name + health label
└── pages/Index.tsx        # Entry/name-entry screen
```
