// Ballpit Animation - Reusable Module
// This file requires an importmap to be defined before loading:
// <script type="importmap">{"imports":{"three":"...","three/addons/":"..."}}</script>
// <script type="module" src="ballpit.js"></script>
// Also requires: <canvas id="ballpitCanvas"></canvas>

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function initBallpit() {
    const canvas = document.getElementById('ballpitCanvas');
    if (!canvas) {
        console.warn('Ballpit canvas not found - skipping animation');
        return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    
    // Use moderate FOV to avoid corner distortion
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 22;
    
    const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: true
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0x6366f1, 300);
    light1.position.set(10, 10, 10);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0x8b5cf6, 300);
    light2.position.set(-10, -10, 10);
    scene.add(light2);
    
    // Ball configuration
    const config = {
        count: 100,
        colors: [0x6366f1, 0x8b5cf6, 0x4f46e5, 0xec4899, 0xa5b4fc],
        gravity: 0,
        friction: 0.998,        // Less friction - balls slow down less
        wallBounce: 0.95,       // More bounce off walls
        minSize: 0.4,
        maxSize: 1.0,
        initialVelocity: 0.08,  // Faster initial velocity
        cursorForce: 0.15,
        cursorRadius: 4,
        driftForce: 0.002,      // Constant small random force to keep moving
        minSpeed: 0.02          // Minimum speed to maintain
    };
    
    // Create spheres
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
        envMap,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        reflectivity: 1,
        envMapIntensity: 1.5
    });
    
    const spheres = new THREE.InstancedMesh(geometry, material, config.count);
    scene.add(spheres);
    
    // Physics data
    const positions = new Float32Array(config.count * 3);
    const velocities = new Float32Array(config.count * 3);
    const sizes = new Float32Array(config.count);
    const dummy = new THREE.Object3D();
    
    // Bounds - calculate from camera frustum
    let maxX = 10;
    let maxY = 10;
    const maxZ = 3;
    
    // Calculate visible bounds from camera
    function calculateBounds() {
        const fov = (camera.fov * Math.PI) / 180;
        const distance = camera.position.z;
        maxY = Math.tan(fov / 2) * distance;
        maxX = maxY * camera.aspect;
    }
    
    calculateBounds();
    
    // Initialize positions - spread across entire screen
    for (let i = 0; i < config.count; i++) {
        // Spread balls across the full visible area
        positions[i * 3] = (Math.random() - 0.5) * maxX * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * maxY * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * maxZ * 2;
        
        velocities[i * 3] = THREE.MathUtils.randFloatSpread(config.initialVelocity);
        velocities[i * 3 + 1] = THREE.MathUtils.randFloatSpread(config.initialVelocity);
        velocities[i * 3 + 2] = THREE.MathUtils.randFloatSpread(config.initialVelocity * 0.5);
        
        sizes[i] = THREE.MathUtils.randFloat(config.minSize, config.maxSize);
    }
    
    // Set colors
    const colorObjects = config.colors.map(c => new THREE.Color(c));
    for (let i = 0; i < config.count; i++) {
        const t = i / config.count;
        const scaledT = t * (config.colors.length - 1);
        const idx = Math.floor(scaledT);
        const alpha = scaledT - idx;
        
        const color = new THREE.Color();
        if (idx >= config.colors.length - 1) {
            color.copy(colorObjects[config.colors.length - 1]);
        } else {
            color.lerpColors(colorObjects[idx], colorObjects[idx + 1], alpha);
        }
        spheres.setColorAt(i, color);
    }
    
    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouse = new THREE.Vector2();
    const mouseWorld = new THREE.Vector3();
    let mouseActive = false;
    
    function updateMouse(clientX, clientY) {
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        camera.getWorldDirection(plane.normal);
        raycaster.ray.intersectPlane(plane, mouseWorld);
        mouseActive = true;
    }
    
    window.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY));
    window.addEventListener('mouseleave', () => mouseActive = false);
    
    // Touch support
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    window.addEventListener('touchend', () => mouseActive = false);
    
    // Resize handler
    function updateSize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        calculateBounds();
    }
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Animation loop
    const tempVec = new THREE.Vector3();
    
    function animate() {
        requestAnimationFrame(animate);
        
        for (let i = 0; i < config.count; i++) {
            const idx = i * 3;
            const size = sizes[i];
            
            // Cursor interaction
            if (mouseActive) {
                tempVec.set(positions[idx], positions[idx + 1], positions[idx + 2]);
                const dist = tempVec.distanceTo(mouseWorld);
                const radius = size + config.cursorRadius;
                
                if (dist < radius && dist > 0.01) {
                    const force = (1 - dist / radius) * config.cursorForce;
                    const direction = tempVec.sub(mouseWorld).normalize();
                    velocities[idx] += direction.x * force;
                    velocities[idx + 1] += direction.y * force;
                    velocities[idx + 2] += direction.z * force * 0.3;
                }
            }
            
            // Add random drift force to keep balls moving
            velocities[idx] += (Math.random() - 0.5) * config.driftForce;
            velocities[idx + 1] += (Math.random() - 0.5) * config.driftForce;
            velocities[idx + 2] += (Math.random() - 0.5) * config.driftForce * 0.5;
            
            // Ensure minimum speed - if too slow, give a gentle push
            const speed = Math.sqrt(
                velocities[idx] * velocities[idx] + 
                velocities[idx + 1] * velocities[idx + 1] + 
                velocities[idx + 2] * velocities[idx + 2]
            );
            if (speed < config.minSpeed) {
                const boost = config.minSpeed / (speed + 0.001);
                velocities[idx] *= boost;
                velocities[idx + 1] *= boost;
                velocities[idx + 2] *= boost;
                // Add random direction if nearly stopped
                if (speed < 0.001) {
                    velocities[idx] = (Math.random() - 0.5) * config.initialVelocity;
                    velocities[idx + 1] = (Math.random() - 0.5) * config.initialVelocity;
                    velocities[idx + 2] = (Math.random() - 0.5) * config.initialVelocity * 0.3;
                }
            }
            
            // Apply friction
            velocities[idx] *= config.friction;
            velocities[idx + 1] *= config.friction;
            velocities[idx + 2] *= config.friction;
            
            // Update positions
            positions[idx] += velocities[idx];
            positions[idx + 1] += velocities[idx + 1];
            positions[idx + 2] += velocities[idx + 2];
            
            // Boundary collision - full screen bounds
            const boundX = maxX - size;
            const boundY = maxY - size;
            const boundZ = maxZ - size;
            
            if (positions[idx] > boundX) {
                positions[idx] = boundX;
                velocities[idx] = -Math.abs(velocities[idx]) * config.wallBounce;
            } else if (positions[idx] < -boundX) {
                positions[idx] = -boundX;
                velocities[idx] = Math.abs(velocities[idx]) * config.wallBounce;
            }
            
            if (positions[idx + 1] > boundY) {
                positions[idx + 1] = boundY;
                velocities[idx + 1] = -Math.abs(velocities[idx + 1]) * config.wallBounce;
            } else if (positions[idx + 1] < -boundY) {
                positions[idx + 1] = -boundY;
                velocities[idx + 1] = Math.abs(velocities[idx + 1]) * config.wallBounce;
            }
            
            if (positions[idx + 2] > boundZ) {
                positions[idx + 2] = boundZ;
                velocities[idx + 2] = -Math.abs(velocities[idx + 2]) * config.wallBounce;
            } else if (positions[idx + 2] < -boundZ) {
                positions[idx + 2] = -boundZ;
                velocities[idx + 2] = Math.abs(velocities[idx + 2]) * config.wallBounce;
            }
        }
        
        // Sphere collisions
        for (let i = 0; i < config.count; i++) {
            const idx1 = i * 3;
            for (let j = i + 1; j < config.count; j++) {
                const idx2 = j * 3;
                const dx = positions[idx2] - positions[idx1];
                const dy = positions[idx2 + 1] - positions[idx1 + 1];
                const dz = positions[idx2 + 2] - positions[idx1 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;
                const minDist = sizes[i] + sizes[j];
                
                if (distSq < minDist * minDist && distSq > 0.0001) {
                    const distance = Math.sqrt(distSq);
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const nz = dz / distance;
                    const overlap = (minDist - distance) * 0.5;
                    
                    positions[idx1] -= nx * overlap;
                    positions[idx1 + 1] -= ny * overlap;
                    positions[idx1 + 2] -= nz * overlap;
                    positions[idx2] += nx * overlap;
                    positions[idx2 + 1] += ny * overlap;
                    positions[idx2 + 2] += nz * overlap;
                    
                    const dvx = velocities[idx1] - velocities[idx2];
                    const dvy = velocities[idx1 + 1] - velocities[idx2 + 1];
                    const dvz = velocities[idx1 + 2] - velocities[idx2 + 2];
                    const dvDotN = dvx * nx + dvy * ny + dvz * nz;
                    
                    if (dvDotN > 0) {
                        const impulse = dvDotN * 0.5;
                        velocities[idx1] -= impulse * nx;
                        velocities[idx1 + 1] -= impulse * ny;
                        velocities[idx1 + 2] -= impulse * nz;
                        velocities[idx2] += impulse * nx;
                        velocities[idx2 + 1] += impulse * ny;
                        velocities[idx2 + 2] += impulse * nz;
                    }
                }
            }
        }
        
        // Update matrices
        for (let i = 0; i < config.count; i++) {
            const idx = i * 3;
            dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
            dummy.scale.setScalar(sizes[i]);
            dummy.updateMatrix();
            spheres.setMatrixAt(i, dummy.matrix);
        }
        
        spheres.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
    }
    
    animate();
    console.log('✅ Ballpit animation initialized!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBallpit);
} else {
    initBallpit();
}
