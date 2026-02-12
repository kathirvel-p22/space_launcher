# ORBIT BREAKER - Architecture Diagram

## System Overview

```mermaid
flowchart TD
    subgraph Game Engine
        A[GameEngine] --> B[SceneManager]
        A --> C[PhysicsEngine]
        A --> D[EventBus]
        A --> E[SaveSystem]
        A --> F[LevelManager]
    end

    subgraph Physics System
        C --> C1[GravityWell]
        C --> C2[Force System]
        C --> C3[CollisionDetector]
    end

    subgraph Entity System
        G[Entity] --> G1[Player]
        G --> G2[Enemy]
        G --> G3[Projectile]
        G --> G4[Planet]
        G --> G5[EnvironmentObject]
    end

    subgraph Level System
        F --> F1[LevelLoader]
        F --> F2[LevelConfig JSON]
    end

    subgraph UI System
        H[HUD] --> H1[Health Bar]
        H --> H2[Fuel Bar]
        H --> H3[Score Display]
        H --> H4[Objective Display]

        I[MenuSystem] --> I1[MainMenu]
        I --> I2[PauseMenu]
        I --> I3[LevelSelectMenu]
        I --> I4[SettingsMenu]
        I --> I5[GameOverMenu]

        J[CutscenePlayer] --> J1[Cutscene Scenes]
    end

    subgraph Animation System
        K[AnimationController] --> K1[SpriteSheet]
        K --> K2[Animation]
    end

    B -->|Load Scene| F
    B -->|Render| G
    C -->|Update| G
    G -->|Render| B
    H -->|Update| A
    I -->|Events| D
    J -->|Play| B
    K -->|Animate| G
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant GameEngine
    participant SceneManager
    participant PhysicsEngine
    participant LevelManager
    participant Player

    User->>GameEngine: Start Game
    GameEngine->>SceneManager: loadScene('earth', 1)
    SceneManager->>LevelManager: loadLevel(1)
    LevelManager-->>SceneManager: LevelConfig
    SceneManager->>PhysicsEngine: setupGravityWells()
    SceneManager->>PhysicsEngine: addEntities()

    loop Game Loop
        GameEngine->>PhysicsEngine: update(deltaTime)
        PhysicsEngine->>Player: applyForces()
        PhysicsEngine->>Player: updatePosition()
        Player->>GameEngine: handleInput()
        GameEngine->>SceneManager: render()
        SceneManager->>Player: render()
    end

    User->>GameEngine: Save Game
    GameEngine->>SaveSystem: saveGame(state)
    SaveSystem->>localStorage: setItem()
```

## Physics System Flow

```mermaid
flowchart TD
    subgraph Physics Update
        A[Update Physics] --> B[Apply Forces]
        B --> B1[Calculate Net Force]
        B1 --> B1a[Gravity Forces]
        B1 --> B1b[Custom Forces]
        B --> B2[Calculate Acceleration]
        B2 --> B2a[F = ma]
        A --> C[Update Positions]
        C --> C1[Update Velocity]
        C --> C2[Update Position]
        A --> D[Check Collisions]
        D --> D1[Collision Detection]
        D --> D2[Handle Collisions]
        D2 --> D2a[Entity.onCollision()]
    end
```

## Level Loading Process

```mermaid
flowchart TD
    A[Load Level] --> B[Read JSON Config]
    B --> C[Parse Level Data]
    C --> D[Create Gravity Wells]
    D --> E[Instantiate Entities]
    E --> F[Setup Scene]
    F --> G[Initialize Physics]
    G --> H[Start Game Loop]
```

## Entity Relationships

```mermaid
classDiagram
    class Entity {
        +position: Vector2
        +velocity: Vector2
        +acceleration: Vector2
        +mass: number
        +update(deltaTime: number)
        +render()
        +onCollision(other: Entity)
    }

    class Player {
        +health: number
        +maxSpeed: number
        +thrustForce: number
        +fuel: number
        +handleInput()
        +shoot()
    }

    class Enemy {
        <<abstract>>
        +health: number
        +damage: number
        +updateAI(deltaTime: number)
    }

    class Asteroid {
        +size: string
        +rotationSpeed: number
    }

    class Drone {
        +target: Entity
        +attackRange: number
    }

    class Projectile {
        +speed: number
        +damage: number
        +lifetime: number
        +owner: Entity
    }

    class Planet {
        +gravityWell: GravityWell
        +radius: number
        +atmosphere: boolean
    }

    Entity <|-- Player
    Entity <|-- Enemy
    Entity <|-- Projectile
    Entity <|-- Planet
    Enemy <|-- Asteroid
    Enemy <|-- Drone
```

## Scene Management

```mermaid
flowchart TD
    A[SceneManager] --> B[EarthScene]
    A --> C[SkyScene]
    A --> D[SpaceScene]
    A --> E[MoonScene]
    A --> F[MarsScene]

    subgraph Scene Lifecycle
        G[Initialize] --> H[Load Assets]
        H --> I[Setup Physics]
        I --> J[Create Entities]
        J --> K[Start Game Loop]

        L[Update] --> M[Update Physics]
        M --> N[Update Entities]
        N --> O[Check Objectives]

        P[Render] --> Q[Clear Canvas]
        Q --> R[Render Background]
        R --> S[Render Entities]
        S --> T[Render HUD]

        U[Cleanup] --> V[Remove Entities]
        V --> W[Clear Physics]
        W --> X[Unload Assets]
    end
```

## Save/Load System

```mermaid
flowchart TD
    A[Game State] --> B[currentLevel]
    A --> C[completedLevels]
    A --> D[playerStats]
    A --> E[gameSettings]
    A --> F[progression]

    subgraph Save Process
        G[Save Game] --> H[Serialize State]
        H --> I[JSON.stringify()]
        I --> J[localStorage.setItem()]
    end

    subgraph Load Process
        K[Load Game] --> L[localStorage.getItem()]
        L --> M[JSON.parse()]
        M --> N[Validate State]
        N --> O[Restore Game]
    end
```

## Performance Optimization

```mermaid
flowchart TD
    A[Performance Optimization] --> B[Entity Pooling]
    A --> C[Spatial Partitioning]
    A --> D[Object Culling]
    A --> E[Sprite Atlas]
    A --> F[Physics Optimization]
    A --> G[Render Batching]

    subgraph Entity Pooling
        B1[Get Entity] --> B2[Check Pool]
        B2 --> B3[Reuse Entity]
        B2 --> B4[Create New]
        B5[Return Entity] --> B6[Reset State]
        B6 --> B7[Add to Pool]
    end

    subgraph Spatial Partitioning
        C1[QuadTree] --> C2[Insert Entity]
        C2 --> C3[Subdivide]
        C4[Query Range] --> C5[Check Intersections]
        C5 --> C6[Return Nearby Entities]
    end
```

## Animation System

```mermaid
flowchart TD
    A[AnimationController] --> B[Play Animation]
    B --> C[Update Frame]
    C --> D[Render Sprite]

    subgraph Animation Lifecycle
        E[Initialize] --> F[Load Sprite Sheet]
        F --> G[Define Animations]
        G --> H[Set Current Animation]

        I[Update] --> J[Increment Frame]
        J --> K[Check Loop]
        K --> L[Reset if Needed]

        M[Render] --> N[Draw Current Frame]
    end
```

## UI Component Hierarchy

```mermaid
classDiagram
    class UIComponent {
        <<abstract>>
        +element: HTMLElement
        +show()
        +hide()
    }

    class HUD extends UIComponent {
        +healthBar: HTMLDivElement
        +fuelBar: HTMLDivElement
        +update(gameState: GameState)
    }

    class Menu extends UIComponent {
        <<abstract>>
        +addButton(text: string, callback: () => void)
    }

    class MainMenu extends Menu {
        +show()
        +hide()
    }

    class PauseMenu extends Menu {
        +show()
        +hide()
    }

    class CutscenePlayer {
        +playCutscene(name: string)
        +isPlayingCutscene(): boolean
    }

    UIComponent <|-- HUD
    UIComponent <|-- Menu
    Menu <|-- MainMenu
    Menu <|-- PauseMenu
```

## Event System

```mermaid
flowchart TD
    A[EventBus] --> B[emit(event: string, data: any)]
    A --> C[on(event: string, callback: Function)]
    A --> D[off(event: string, callback: Function)]

    subgraph Common Events
        E[game_start]
        E --> F[SceneManager]

        G[level_complete]
        G --> H[LevelManager]

        I[player_death]
        I --> J[GameEngine]

        K[cutscene_start]
        K --> L[SceneManager]

        M[cutscene_end]
        M --> N[SceneManager]

        O[save_game]
        O --> P[SaveSystem]

        Q[load_game]
        Q --> R[SaveSystem]
    end
```

---

These diagrams provide a visual representation of the ORBIT BREAKER architecture, complementing the detailed technical specification. The modular design allows for easy extension and maintenance of the game systems.
