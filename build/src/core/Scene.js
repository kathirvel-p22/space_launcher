export class Scene {
    physicsEngine;
    levelManager;
    levelConfig = null;

    constructor(physicsEngine, levelManager) {
        this.physicsEngine = physicsEngine;
        this.levelManager = levelManager;
    }

    initialize(levelConfig) {
        this.levelConfig = levelConfig;
    }

    update(deltaTime) {
        this.physicsEngine.update(deltaTime);
    }

    render() {}

    cleanup() {
        this.physicsEngine.clear();
    }

    resize(width, height) {}
}
