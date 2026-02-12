/**
 * SpriteAnimator.js - Sprite sheet animation
 * 
 * This module handles sprite sheet animation for game entities.
 * It manages animation frames, timing, and playback.
 */

/**
 * Sprite sheet representation
 */
export class SpriteSheet {
    /** @type {HTMLImageElement} */
    image;
    /** @type {number} */
    width;
    /** @type {number} */
    height;
    /** @type {number} */
    frames;
    /** @type {number} */
    frameWidth;
    /** @type {number} */
    frameHeight;

    /**
     * Create a new SpriteSheet
     * @param {string} imageSrc - Path to the sprite sheet image
     * @param {number} frameWidth - Width of each frame
     * @param {number} frameHeight - Height of each frame
     * @param {number} [frames=1] - Number of frames in the sheet
     */
    constructor(imageSrc, frameWidth, frameHeight, frames = 1) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.width = frameWidth;
        this.height = frameHeight;
        this.frames = frames;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    /**
     * Draw a specific frame from the sprite sheet
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     * @param {number} x - X position to draw
     * @param {number} y - Y position to draw
     * @param {number} frame - Frame index to draw
     * @param {number} [scale=1] - Scale factor
     */
    drawFrame(context, x, y, frame, scale = 1) {
        const frameX = (frame % this.frames) * this.frameWidth;
        const frameY = Math.floor(frame / this.frames) * this.frameHeight;
        
        context.drawImage(
            this.image,
            frameX, frameY, this.frameWidth, this.frameHeight,
            x, y, this.frameWidth * scale, this.frameHeight * scale
        );
    }
}

/**
 * Animation representation
 */
export class Animation {
    /** @type {SpriteSheet} */
    spriteSheet;
    /** @type {number} */
    frameDuration;
    /** @type {boolean} */
    loop;
    /** @type {number} */
    currentFrame = 0;
    /** @type {number} */
    elapsedTime = 0;
    /** @type {number} */
    startFrame = 0;
    /** @type {number} */
    endFrame = 0;

    /**
     * Create a new Animation
     * @param {SpriteSheet} spriteSheet - Sprite sheet to use
     * @param {number} [frameDuration=0.1] - Duration of each frame in seconds
     * @param {boolean} [loop=true] - Whether to loop the animation
     * @param {number} [startFrame=0] - Starting frame index
     * @param {number} [endFrame=0] - Ending frame index (0 means all frames)
     */
    constructor(spriteSheet, frameDuration = 0.1, loop = true, startFrame = 0, endFrame = 0) {
        this.spriteSheet = spriteSheet;
        this.frameDuration = frameDuration;
        this.loop = loop;
        this.startFrame = startFrame;
        this.endFrame = endFrame > 0 ? endFrame : spriteSheet.frames - 1;
    }

    /**
     * Update the animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        this.elapsedTime += deltaTime;
        
        if (this.elapsedTime >= this.frameDuration) {
            this.elapsedTime = 0;
            this.currentFrame++;
            
            if (this.currentFrame > this.endFrame) {
                if (this.loop) {
                    this.currentFrame = this.startFrame;
                } else {
                    this.currentFrame = this.endFrame;
                }
            }
        }
    }

    /**
     * Draw the current frame
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     * @param {number} x - X position to draw
     * @param {number} y - Y position to draw
     * @param {number} [scale=1] - Scale factor
     */
    draw(context, x, y, scale = 1) {
        this.spriteSheet.drawFrame(
            context,
            x,
            y,
            this.currentFrame,
            scale
        );
    }

    /**
     * Reset the animation to the first frame
     */
    reset() {
        this.currentFrame = this.startFrame;
        this.elapsedTime = 0;
    }

    /**
     * Set the current frame
     * @param {number} frame - Frame index to set
     */
    setFrame(frame) {
        this.currentFrame = Math.max(this.startFrame, Math.min(frame, this.endFrame));
    }
}

/**
 * Animation controller for managing multiple animations
 */
export class SpriteAnimator {
    /** @type {Map<string, Animation>} */
    animations = new Map();
    /** @type {string | null} */
    currentAnimation = null;

    /**
     * Add an animation
     * @param {string} name - Name of the animation
     * @param {Animation} animation - Animation to add
     */
    addAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    /**
     * Play an animation
     * @param {string} name - Name of the animation to play
     */
    playAnimation(name) {
        if (this.animations.has(name)) {
            this.currentAnimation = name;
            const animation = this.animations.get(name);
            if (animation) {
                animation.reset();
            }
        }
    }

    /**
     * Update the current animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.currentAnimation) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation) {
                animation.update(deltaTime);
            }
        }
    }

    /**
     * Draw the current animation frame
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     * @param {number} x - X position to draw
     * @param {number} y - Y position to draw
     * @param {number} [scale=1] - Scale factor
     */
    draw(context, x, y, scale = 1) {
        if (this.currentAnimation) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation) {
                animation.draw(context, x, y, scale);
            }
        }
    }

    /**
     * Get the current animation name
     * @returns {string | null}
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    /**
     * Check if a specific animation is playing
     * @param {string} name - Name of the animation to check
     * @returns {boolean}
     */
    isPlaying(name) {
        return this.currentAnimation === name;
    }

    /**
     * Remove an animation
     * @param {string} name - Name of the animation to remove
     */
    removeAnimation(name) {
        this.animations.delete(name);
        
        if (this.currentAnimation === name) {
            this.currentAnimation = null;
        }
    }

    /**
     * Clear all animations
     */
    clear() {
        this.animations.clear();
        this.currentAnimation = null;
    }
}
