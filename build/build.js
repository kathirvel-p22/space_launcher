/**
 * Build script for Orbit Breaker
 * Handles asset bundling, minification, and versioning
 */

const fs = require('fs');
const path = require('path');

class BuildSystem {
    constructor() {
        this.projectRoot = process.cwd();
        this.buildDir = path.join(this.projectRoot, 'build');
        this.version = '1.0.0';
        this.timestamp = new Date().toISOString();
    }

    /**
     * Initialize build directory
     */
    initBuildDir() {
        if (!fs.existsSync(this.buildDir)) {
            fs.mkdirSync(this.buildDir, { recursive: true });
        }
    }

    /**
     * Copy static assets to build directory
     */
    copyAssets() {
        const assetsDir = path.join(this.projectRoot, 'assets');
        const buildAssetsDir = path.join(this.buildDir, 'assets');
        
        if (fs.existsSync(assetsDir)) {
            if (!fs.existsSync(buildAssetsDir)) {
                fs.mkdirSync(buildAssetsDir, { recursive: true });
            }
            
            // Copy all asset directories
            const assetDirs = fs.readdirSync(assetsDir);
            for (const dir of assetDirs) {
                const srcDir = path.join(assetsDir, dir);
                const destDir = path.join(buildAssetsDir, dir);
                
                if (fs.statSync(srcDir).isDirectory()) {
                    this.copyDirectory(srcDir, destDir);
                }
            }
        }
    }

    /**
     * Copy directory recursively
     */
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        for (const file of files) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    /**
     * Copy HTML and CSS files
     */
    copyFrontendFiles() {
        const files = ['index.html', 'styles.css'];
        
        for (const file of files) {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(this.buildDir, file);
            
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    /**
     * Copy JavaScript source files
     */
    copySourceFiles() {
        const srcDir = path.join(this.projectRoot, 'src');
        const buildSrcDir = path.join(this.buildDir, 'src');
        
        if (fs.existsSync(srcDir)) {
            this.copyDirectory(srcDir, buildSrcDir);
        }
    }

    /**
     * Generate build manifest
     */
    generateManifest() {
        const manifest = {
            version: this.version,
            buildTimestamp: this.timestamp,
            files: [],
            assets: {}
        };
        
        // Count files in build directory
        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    walk(fullPath);
                } else {
                    manifest.files.push(fullPath.replace(this.buildDir + '\\', ''));
                }
            }
        };
        
        walk(this.buildDir);
        
        // Load asset manifest
        try {
            const assetManifestPath = path.join(this.projectRoot, 'assets', 'asset_manifest.json');
            if (fs.existsSync(assetManifestPath)) {
                manifest.assets = JSON.parse(fs.readFileSync(assetManifestPath, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load asset manifest:', error.message);
        }
        
        fs.writeFileSync(
            path.join(this.buildDir, 'build_manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
    }

    /**
     * Run full build process
     */
    build() {
        console.log('Starting build process...');
        
        this.initBuildDir();
        console.log('✓ Build directory initialized');
        
        this.copyAssets();
        console.log('✓ Assets copied');
        
        this.copyFrontendFiles();
        console.log('✓ Frontend files copied');
        
        this.copySourceFiles();
        console.log('✓ Source files copied');
        
        this.generateManifest();
        console.log('✓ Build manifest generated');
        
        console.log('\nBuild completed successfully!');
        console.log(`Build version: ${this.version}`);
        console.log(`Build timestamp: ${this.timestamp}`);
        console.log(`Build directory: ${this.buildDir}`);
    }
}

// Run build if executed directly
if (require.main === module) {
    const buildSystem = new BuildSystem();
    buildSystem.build();
}

module.exports = BuildSystem;