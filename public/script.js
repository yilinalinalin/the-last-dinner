// Import Three.js and loaders
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);

// Use the full window size (canvas is fixed to viewport in CSS)
const container = document.getElementById('canvas-container');
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
container.appendChild(renderer.domElement);

// Lighting - adjusted for dark background, less dramatic to avoid reflections
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Increased ambient for softer, more even lighting
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); // Reduced intensity to minimize reflections
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.2); // Further reduced intensity
pointLight.position.set(-5, 5, -5);
scene.add(pointLight);

// Add fill light for better visibility
const fillLight = new THREE.DirectionalLight(0xffffff, 0.15); // Reduced fill light
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// Add additional fill lights to soften reflections on yarn_girl model
const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.08); // Reduced intensity
fillLight2.position.set(0, 5, 5); // Front fill light
scene.add(fillLight2);

const fillLight3 = new THREE.DirectionalLight(0xffffff, 0.03); // Reduced intensity
fillLight3.position.set(-3, 2, 3); // Side fill light
scene.add(fillLight3);

const fillLight4 = new THREE.DirectionalLight(0xffffff, 0.1); // Reduced intensity
fillLight4.position.set(3, 2, 3); // Other side fill light
scene.add(fillLight4);

const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

// Mobile detection
function isMobile() {
    return window.innerWidth <= 768;
}

// Camera setup - simple, low-distortion view aimed at the scene origin
camera.position.set(0, 1.5, 6);
camera.lookAt(0, 0, 0);
camera.fov = 35;
camera.updateProjectionMatrix();

// Raycaster for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Store objects and their text elements
const objects = [];
const objectTextMap = new Map();
const yarnGirls = []; // Store yarn_girl instances
const yarnGirlInitialPositions = []; // Store initial positions
const iceBlocks = []; // Store all ice instances (section 2)
const iceInitialPositions = []; // Store initial positions for each ice block
const applePileBlocks = []; // Store all apple_pile instances (section 3)
const applePileInitialPositions = []; // Store initial positions for each apple_pile block

// UI elements (cached for performance)
const torchOverlayEl = document.getElementById('torch-overlay');
const section2TextEl = document.querySelector('.section-2-text');
const section3TextEl = document.querySelector('.section-3-text');
const section4TextEl = document.querySelector('.section-4-text');
const section2ImageEl = document.querySelector('.section-2-model-image');
const section3ImageEl = document.querySelector('.section-3-model-image');
const section4ImageEl = document.querySelector('.section-4-model-image');
const heroYarnImageEl = document.querySelector('.hero-yarn-image');
if (section4ImageEl) {
    section4ImageEl.src = '/yarn_girl_model.png?v=' + Date.now();
}

// Create Yarn Girl - load FBX model for homepage (first viewport)
function createYarnGirl() {
    const loader = new FBXLoader();
    const yarnGirlGroup = new THREE.Group();
    yarnGirlGroup.position.set(0, 0, 0);
    
    loader.load(
        'public/yarn_girl_3/Meshy_AI_A_woman_with_a_really_1225083211_texture.fbx?v=' + Date.now(),
        (object) => {
            console.log('Yarn Girl 3 FBX model loaded successfully!');
            console.log('Model path: public/yarn_girl_3/Meshy_AI_A_woman_with_a_really_1225083211_texture.fbx');
            
            // Find the main mesh(es) in the loaded object
            const meshes = [];
            object.traverse((child) => {
                if (child.isMesh) {
                    meshes.push(child);
                }
            });
            
            if (meshes.length === 0) {
                console.warn('No meshes found in the loaded model');
                return;
            }
            
            // Center the entire object once so its local origin is at the center
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);
            
            console.log('Yarn Girl 3 original bounding box:', box);
            console.log('Yarn Girl 3 original center:', center);
            console.log('Number of meshes found:', meshes.length);

            // Scale for visibility - original size
            const baseScale = 0.03;
            object.scale.setScalar(baseScale);

            // Container for easier animation/hover mapping
            const yarnGirlContainer = new THREE.Group();
            yarnGirlContainer.userData = { type: 'yarn-girl', textId: 'apple-text', index: 0 };
            // Center the model in the first viewport
            yarnGirlContainer.position.set(1, -1.6, 0);
            yarnGirlContainer.rotation.set(0, 0, 0);

            yarnGirlContainer.add(object);
            yarnGirlGroup.add(yarnGirlContainer);
            yarnGirls.push(yarnGirlContainer);

            // Store initial position for floating animation
            yarnGirlInitialPositions.push({
                x: yarnGirlContainer.position.x,
                y: yarnGirlContainer.position.y,
                z: yarnGirlContainer.position.z,
            });

            // Register meshes for raycasting/hover and set initial opacity for animation
            // Also reload textures with cache-busting to ensure new textures are loaded
            const textureLoader = new THREE.TextureLoader();
            const cacheBuster = '?v=' + Date.now();
            
            let meshCount = 0;
            object.traverse((child) => {
                if (child.isMesh) {
                    objects.push(child);
                    objectTextMap.set(child, document.getElementById('apple-text'));
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Reload textures with cache-busting
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            // Reload all texture maps with cache-busting
                            const textureMaps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];
                            textureMaps.forEach(mapName => {
                                if (mat[mapName]) {
                                    const oldTexture = mat[mapName];
                                    if (oldTexture && oldTexture.image && oldTexture.image.src) {
                                        const originalSrc = oldTexture.image.src.split('?')[0]; // Remove existing query params
                                        const newSrc = originalSrc + cacheBuster;
                                        textureLoader.load(newSrc, (texture) => {
                                            mat[mapName] = texture;
                                            mat.needsUpdate = true;
                                            console.log(`Reloaded ${mapName} texture:`, newSrc);
                                        });
                                    }
                                }
                            });
                            
                            // Adjust material properties for satin finish
                            // Satin has low metalness with medium-low roughness for subtle sheen
                            if (mat.metalness !== undefined) {
                                mat.metalness = 0.15; // Low metalness for subtle metallic sheen
                            }
                            
                            // Satin finish: medium-low roughness for smooth, lustrous appearance
                            if (mat.roughness !== undefined) {
                                mat.roughness = 0.35; // Medium-low roughness = satin-like sheen
                            }
                            
                            // Set initial opacity for smooth fade-in animation
                            if (mat.opacity !== undefined) {
                                mat.opacity = 1;
                                mat.transparent = false;
                            }
                            
                            mat.needsUpdate = true;
                        });
                    }
                    meshCount++;
                }
            });

            console.log(`Yarn Girl 3 added with ${meshCount} meshes at`, yarnGirlContainer.position);
        },
        (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total * 100);
                console.log('Loading yarn girl 3 model:', percentComplete.toFixed(2) + '%');
            } else {
                console.log('Loading yarn girl 3 model...');
            }
        },
        (error) => {
            console.error('Error loading yarn girl 3 model:', error);
            console.error('Attempted path: public/yarn_girl_3/Meshy_AI_A_woman_with_a_really_1225083211_texture.fbx');
        }
    );
    
    scene.add(yarnGirlGroup);
    return yarnGirlGroup;
}

// Create Ice - load OBJ model and place it on the left side (section 2)
function createIce() {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    const iceGroup = new THREE.Group();
    iceGroup.position.set(-1, 0, 0);

    const cacheBuster = '?v=' + Date.now();
    
    // First load the MTL material file
    mtlLoader.load(
        'public/ice_3/Meshy_AI_create_an_image_of_a__1224012412_texture.mtl' + cacheBuster,
        (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            
            // Then load the OBJ file
            objLoader.load(
                'public/ice_3/Meshy_AI_create_an_image_of_a__1224012412_texture.obj' + cacheBuster,
                (object) => {
                    console.log('Ice 3 OBJ model loaded successfully!');
                    console.log('Model path: public/ice_3/Meshy_AI_create_an_image_of_a__1224012412_texture.obj');

                    // Center the entire object once so its local origin is at the center
                    const box = new THREE.Box3().setFromObject(object);
                    const center = box.getCenter(new THREE.Vector3());
                    object.position.sub(center);

                    console.log('Ice 3 original bounding box:', box);
                    console.log('Ice 3 original center:', center);

                    // Calculate proper scale based on bounding box to fit in viewport
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    // Scale so the largest dimension is smaller (make ice model smaller)
                    const baseScale = 2.5 / maxDim;
                    object.scale.setScalar(baseScale);
                    console.log('Ice 3 model scale set to:', baseScale, 'original size:', size);

                    // Container for easier animation/hover mapping
                    const iceContainer = new THREE.Group();
                    iceContainer.userData = { type: 'ice-pile', textId: 'apple-text', index: 0 };
                    // Place the ice pile - adjust position for mobile to be beyond text
                    if (isMobile()) {
                        iceContainer.position.set(-5.5, 1.0, -2); // Further left and back on mobile
                    } else {
                        iceContainer.position.set(-4.5, 1.0, 0); // Left side of second section
                    }
                    iceContainer.rotation.set(0.15, -0.3, 0.0);
                    iceContainer.visible = false; // Hidden initially, shown on scroll

                    iceContainer.add(object);
                    iceGroup.add(iceContainer);
                    iceBlocks.push(iceContainer);

                    // Store initial position for floating animation
                    iceInitialPositions.push({
                        x: iceContainer.position.x,
                        y: iceContainer.position.y,
                        z: iceContainer.position.z,
                    });

                    // Register meshes for raycasting/hover and set initial opacity for animation
                    // Also reload textures with cache-busting to ensure new textures are loaded
                    const textureLoader = new THREE.TextureLoader();
                    const textureCacheBuster = '?v=' + Date.now();
                    
                    let meshCount = 0;
                    object.traverse((child) => {
                        if (child.isMesh) {
                            objects.push(child);
                            // Use the same tooltip element as the apple (same behavior)
                            objectTextMap.set(child, document.getElementById('apple-text'));
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Reload textures with cache-busting
                            if (child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => {
                                    // Reload all texture maps with cache-busting
                                    const textureMaps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];
                                    textureMaps.forEach(mapName => {
                                        if (mat[mapName]) {
                                            const oldTexture = mat[mapName];
                                            if (oldTexture && oldTexture.image && oldTexture.image.src) {
                                                const originalSrc = oldTexture.image.src.split('?')[0]; // Remove existing query params
                                                const newSrc = originalSrc + textureCacheBuster;
                                                textureLoader.load(newSrc, (texture) => {
                                                    mat[mapName] = texture;
                                                    mat.needsUpdate = true;
                                                    console.log(`Reloaded ${mapName} texture:`, newSrc);
                                                });
                                            }
                                        }
                                    });
                                    
                                    // Adjust material properties for ice-like appearance
                                    // Make it more transparent and less metallic
                                    mat.transparent = true;
                                    mat.opacity = 0; // Start invisible for fade-in, will animate to 0.7
                                    
                                    // Reduce metalness for less metallic look
                                    if (mat.metalness !== undefined) {
                                        mat.metalness = 0.1; // Lower metalness (0 = non-metallic, 1 = fully metallic)
                                    }
                                    
                                    // Adjust roughness for more glass-like appearance
                                    if (mat.roughness !== undefined) {
                                        mat.roughness = 0.2; // Lower roughness = more glossy/glass-like
                                    }
                                    
                                    // Add slight blue tint for ice appearance
                                    if (mat.color) {
                                        mat.color.multiplyScalar(1.1); // Slightly brighten
                                    }
                                    
                                    // Enable side rendering for transparency
                                    mat.side = THREE.DoubleSide;
                                    
                                    mat.needsUpdate = true;
                                });
                            }
                            meshCount++;
                        }
                    });

                    console.log(`Ice 3 model added with ${meshCount} meshes at`, iceContainer.position);
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        const percentComplete = (progress.loaded / progress.total * 100);
                        console.log('Loading ice 3 model:', percentComplete.toFixed(2) + '%');
                    } else {
                        console.log('Loading ice 3 model...');
                    }
                },
                (error) => {
                    console.error('Error loading ice 3 OBJ model:', error);
                    console.error('Attempted path: public/ice_3/Meshy_AI_create_an_image_of_a__1224012412_texture.obj');
                }
            );
        },
        (error) => {
            console.error('Error loading ice 3 MTL materials:', error);
            console.error('Attempted path: public/ice_3/Meshy_AI_create_an_image_of_a__1224012412_texture.mtl');
        }
    );

    scene.add(iceGroup);
    return iceGroup;
}

// Create Apple - load FBX model and place it on the right side for section 3
// Create Apple Pile - load FBX model for section 3 (right side)
function createApplePile() {
    const loader = new FBXLoader();
    const applePileGroup = new THREE.Group();
    applePileGroup.position.set(0, 0, 0);

    loader.load(
        'public/apple_pile_2/Meshy_AI_create_an_image_of_a__1224004105_texture.fbx?v=' + Date.now(),
        (object) => {
            console.log('Apple Pile 2 FBX model loaded successfully!');
            console.log('Model path: public/apple_pile_2/Meshy_AI_create_an_image_of_a__1224004105_texture.fbx');

            // Center the entire object once so its local origin is at the center
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);

            console.log('Apple Pile 2 original bounding box:', box);
            console.log('Apple Pile 2 original center:', center);

            // Scale to fit nicely in view
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const baseScale = 5.0 / maxDim;
            object.scale.setScalar(baseScale);
            console.log('Apple Pile 2 model scale set to:', baseScale, 'original size:', size);

            // Container for easier animation/visibility
            const applePileContainer = new THREE.Group();
            applePileContainer.userData = { type: 'apple-pile', textId: 'apple-text', index: 0 };
            // Right side of section 3
            if (isMobile()) {
                applePileContainer.position.set(10.5, 0.45, -1.5);
            } else {
                applePileContainer.position.set(10.5, 0.45, 0.5);
            }
            applePileContainer.rotation.set(0.05, 0.35, 0.0);
            applePileContainer.visible = false; // shown in section 3
            applePileContainer.scale.setScalar(0); // Start at scale 0, will scale up with section3Alpha

            applePileContainer.add(object);
            applePileGroup.add(applePileContainer);
            applePileBlocks.push(applePileContainer);

            // Store initial position for floating animation
            applePileInitialPositions.push({
                x: applePileContainer.position.x,
                y: applePileContainer.position.y,
                z: applePileContainer.position.z,
            });

            // Register meshes and start invisible for fade-in
            // Also reload textures with cache-busting to ensure new textures are loaded
            const textureLoader = new THREE.TextureLoader();
            const cacheBuster = '?v=' + Date.now();
            
            let meshCount = 0;
            object.traverse((child) => {
                if (child.isMesh) {
                    objects.push(child);
                    objectTextMap.set(child, document.getElementById('apple-text'));
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Reload textures with cache-busting
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            // Reload all texture maps with cache-busting
                            const textureMaps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];
                            textureMaps.forEach(mapName => {
                                if (mat[mapName]) {
                                    const oldTexture = mat[mapName];
                                    if (oldTexture && oldTexture.image && oldTexture.image.src) {
                                        const originalSrc = oldTexture.image.src.split('?')[0]; // Remove existing query params
                                        const newSrc = originalSrc + cacheBuster;
                                        textureLoader.load(newSrc, (texture) => {
                                            mat[mapName] = texture;
                                            mat.needsUpdate = true;
                                            console.log(`Reloaded ${mapName} texture:`, newSrc);
                                        });
                                    }
                                }
                            });
                            
                            // Set initial opacity for smooth fade-in animation (start invisible)
                            if (mat.opacity !== undefined) {
                                mat.opacity = 0; // Start invisible
                                mat.transparent = true;
                            }
                        });
                    }
                    meshCount++;
                }
            });

            console.log(`Apple Pile 2 model added with ${meshCount} meshes at`, applePileContainer.position);
        },
        (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total * 100);
                console.log('Loading apple pile 2 model:', percentComplete.toFixed(2) + '%');
            } else {
                console.log('Loading apple pile 2 model...');
            }
        },
        (error) => {
            console.error('Error loading apple pile 2 model:', error);
            console.error('Attempted path: public/apple_pile_2/Meshy_AI_create_an_image_of_a__1224004105_texture.fbx');
        }
    );

    scene.add(applePileGroup);
    return applePileGroup;
}


// Animation parameters for floating effect
const animationParams = {
    yarnGirl: { speed: 0.3, amplitude: 0.15, rotationSpeed: 0 },   // subtle vertical float
    ice:      { speed: 0.4, amplitude: 0.2,  rotationSpeed: 0 },   // float only, no rotation
    applePile: { speed: 0.35, amplitude: 0.18, rotationSpeed: 0 }   // subtle vertical float
};

// Create all objects
const yarnGirlGroup = createYarnGirl();
const iceGroup = createIce();
const applePileGroup = createApplePile();

let time = 0;
let hoveredObject = null;

// Mouse move handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update torch cursor position
    const torchOverlay = document.getElementById('torch-overlay');
    if (torchOverlay) {
        torchOverlay.style.setProperty('--cursor-x', `${event.clientX}px`);
        torchOverlay.style.setProperty('--cursor-y', `${event.clientY}px`);
    }
    
    // Update white sphere cursor position
    const cursorSphere = document.getElementById('cursor-sphere');
    if (cursorSphere) {
        cursorSphere.style.setProperty('--cursor-x', `${event.clientX}px`);
        cursorSphere.style.setProperty('--cursor-y', `${event.clientY}px`);
    }
    
    // Tooltips removed - keeping raycaster for potential future use
    // raycaster.setFromCamera(mouse, camera);
    // const intersects = raycaster.intersectObjects(objects, true);
    
    // Hide all text boxes (tooltips disabled)
    document.querySelectorAll('.hover-text').forEach(text => {
        text.classList.remove('visible');
    });
    
    hoveredObject = null;
}

window.addEventListener('mousemove', onMouseMove);

// Detect touch/mobile devices
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

// Disable custom cursor and torch on mobile/touch devices
if (isTouch) {
    const cursor = document.querySelector(".cursor-sphere") || document.getElementById("cursor-sphere");
    if (cursor) cursor.style.display = "none";

    const torch = document.querySelector(".torch-overlay") || document.getElementById("torch-overlay");
    if (torch) torch.style.display = "none";

    // Also prevent mousemove handler from running on touch devices
    window.removeEventListener('mousemove', onMouseMove);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Yarn girl stays still - no animation
    
    // Animate ice (vertical floating only, no rotation)
    const iceParams = animationParams.ice;
    iceBlocks.forEach((ice, index) => {
        if (iceInitialPositions[index]) {
            const baseY = iceInitialPositions[index].y;
            const phase = index * 0.7;
            ice.position.y = baseY + Math.sin(time * iceParams.speed + phase) * iceParams.amplitude;
        }
    });

    // Animate apple pile (vertical floating only, no rotation)
    const applePileParams = animationParams.applePile;
    applePileBlocks.forEach((applePile, index) => {
        if (applePileInitialPositions[index]) {
            const baseY = applePileInitialPositions[index].y;
            const phase = index * 0.5;
            applePile.position.y = baseY + Math.sin(time * applePileParams.speed + phase) * applePileParams.amplitude;
        }
    });
    
    // Tooltips removed - no text position updates needed
    
    // Keep scroll-driven fades/camera updating smoothly even after scroll stops
    handleScroll();

    renderer.render(scene, camera);
}

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
  
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
  
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    
    // Update model positions on resize for mobile responsiveness
    if (isMobile()) {
        iceBlocks.forEach((ice) => {
            if (ice) {
                ice.position.set(-5.5, 1.0, -2);
            }
        });
        applePileBlocks.forEach((applePile) => {
            if (applePile) {
                applePile.position.set(9.0, 0.45, -1.5);
            }
        });
    } else {
        iceBlocks.forEach((ice) => {
            if (ice) {
                ice.position.set(-3.5, 1.0, 0);
            }
        });
        applePileBlocks.forEach((applePile) => {
            if (applePile) {
                applePile.position.set(7.5, 0.45, 0.5);
            }
        });
    }
    
    // Update initial positions for animation
    iceBlocks.forEach((ice, index) => {
        if (ice && iceInitialPositions[index]) {
            iceInitialPositions[index].x = ice.position.x;
            iceInitialPositions[index].y = ice.position.y;
            iceInitialPositions[index].z = ice.position.z;
        }
    });
    applePileBlocks.forEach((applePile, index) => {
        if (applePile && applePileInitialPositions[index]) {
            applePileInitialPositions[index].x = applePile.position.x;
            applePileInitialPositions[index].y = applePile.position.y;
            applePileInitialPositions[index].z = applePile.position.z;
        }
    });
  }
  
  window.addEventListener("resize", resize);
  resize();

// Animation state tracking
let yarnGirlAnimationProgress = 1; // Start visible for hero section
let iceAnimationProgress = 0;
let applePileAnimationProgress = 0;

function clamp01(x) {
    return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

// Smooth animation function for models (targetOpacity: 0..1)
function animateModelOpacity(model, targetOpacity, currentOpacity, speed = 0.12) {
    const t = clamp01(targetOpacity);
    // Exponential smoothing toward target (feels smoother than fixed step)
    currentOpacity = currentOpacity + (t - currentOpacity) * speed;

    if (model) {
        model.visible = currentOpacity > 0.02;
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => {
                        if (mat && mat.opacity !== undefined) {
                            mat.opacity = currentOpacity;
                            mat.transparent = currentOpacity < 0.999;
                        }
                    });
                } else if (child.material.opacity !== undefined) {
                    child.material.opacity = currentOpacity;
                    child.material.transparent = currentOpacity < 0.999;
                }
            }
        });
    }

    return currentOpacity;
}

// Smooth camera targets - adjust for mobile
function getCameraPositions() {
    if (isMobile()) {
        return {
            hero: new THREE.Vector3(0, 1.5, 6),
            section4: new THREE.Vector3(0.5, 1.5, 6),
            section2: new THREE.Vector3(-2.0, 1.5, 7),
            section3: new THREE.Vector3(2.0, 1.5, 7)
        };
    } else {
        return {
            hero: new THREE.Vector3(0, 1.5, 6),
            section4: new THREE.Vector3(0.5, 1.5, 6),
            section2: new THREE.Vector3(-1.3, 1.5, 6),
            section3: new THREE.Vector3(1.3, 1.5, 6)
        };
    }
}

function getCameraLookAts() {
    if (isMobile()) {
        return {
            hero: new THREE.Vector3(0, 0, 0),
            section4: new THREE.Vector3(-4.5, -2.2, -1),
            section2: new THREE.Vector3(-5.5, 1.0, -2),
            section3: new THREE.Vector3(9.0, 0.45, -1.5)
        };
    } else {
        return {
            hero: new THREE.Vector3(0, 0, 0),
            section4: new THREE.Vector3(-3.5, -2.2, 0),
            section2: new THREE.Vector3(-3.5, 1.0, 0),
            section3: new THREE.Vector3(7.5, 0.45, 0.5)
        };
    }
}

const heroCamPos = new THREE.Vector3(0, 1.5, 6);
let section4CamPos = new THREE.Vector3(0.5, 1.5, 6);
let section2CamPos = new THREE.Vector3(-1.3, 1.5, 6);
let section3CamPos = new THREE.Vector3(1.3, 1.5, 6);

const heroLookAt = new THREE.Vector3(0, 0, 0);
let section4LookAt = new THREE.Vector3(-3.5, -2.2, 0);
let section2LookAt = new THREE.Vector3(-3.5, 1.0, 0);
let section3LookAt = new THREE.Vector3(7.5, 0.45, 0.5);

const blendedCamPos = new THREE.Vector3().copy(heroCamPos);
const blendedLookAt = new THREE.Vector3().copy(heroLookAt);

// Scroll detection for viewport switching with smooth animations
function handleScroll() {
    if (isTouch || window.innerWidth <= 900) {
    // On mobile: show everything immediately, no scroll-fade timing
    const show = (el) => { if (el) { el.style.opacity = "1"; el.style.transform = "none"; } };

    show(section2TextEl); show(section3TextEl); show(section4TextEl);
    if (section2ImageEl) section2ImageEl.style.opacity = "1";
    if (section3ImageEl) section3ImageEl.style.opacity = "1";
    if (section4ImageEl) section4ImageEl.style.opacity = "1";

    return; // IMPORTANT: skip the desktop scroll math
  }
    
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollProgress = scrollY / viewportHeight;

    // hero -> synopsis -> section4 -> section2 -> section3
    const t01 = smoothstep(0.6, 1.0, scrollProgress);  // hero to synopsis (yarn girl fully gone by synopsis)
    const t12 = smoothstep(1.8, 2.2, scrollProgress);  // synopsis to section4
    const t23 = smoothstep(2.2, 2.6, scrollProgress);  // section4 to section2
    const t34 = smoothstep(3.0, 3.4, scrollProgress);  // section2 to section3
    const tOut = smoothstep(3.5, 5.5, scrollProgress); // scroll out from section 3 (slower)

    const heroAlpha = 1 - t01;
    const synopsisAlpha = t01 * (1 - t12);
    const section4Alpha = t12 * (1 - t23);
    const section2Alpha = t23 * (1 - t34);
    const section3Alpha = t34;

    // Torch fades out as we leave hero
    if (torchOverlayEl) {
        torchOverlayEl.style.opacity = `${heroAlpha}`;
    }

    // Text fades/slide with scroll
    if (section4TextEl) {
        section4TextEl.style.opacity = `${section4Alpha}`;
        section4TextEl.style.transform = `translateX(${-(1 - section4Alpha) * 50}px)`;
    }
    if (section2TextEl) {
        section2TextEl.style.opacity = `${section2Alpha}`;
        section2TextEl.style.transform = `translateX(${-(1 - section2Alpha) * 50}px)`;
    }
    if (section3TextEl) {
        section3TextEl.style.opacity = `${section3Alpha}`;
        section3TextEl.style.transform = `translateX(${-(1 - section3Alpha) * 50}px)`;
    }

    // Hero: show yarn_girl_model.png image instead of 3D model; image fades with scroll
    if (heroYarnImageEl) {
        heroYarnImageEl.style.opacity = heroAlpha;
    }
    yarnGirls.forEach((yarnGirl) => {
        if (yarnGirl) {
            yarnGirl.visible = false;
            yarnGirl.scale.setScalar(0);
        }
    });
    // Section 4, 3: image opacity driven by scroll (same display logic)
    if (section4ImageEl) section4ImageEl.style.opacity = 1;
    if (section3ImageEl) section3ImageEl.style.opacity = 1;
    // Section 2: melting_ice.png image (opacity driven by scroll)
    if (section2ImageEl) {
        section2ImageEl.style.opacity = 1;
    }
    iceBlocks.forEach((ice) => {
        if (ice) ice.visible = false; // Section 2 uses static image
    });
    // Hide apple 3D model – section 3 uses apple.png image
    applePileBlocks.forEach((applePile) => {
        if (applePile) applePile.visible = false;
    });

    // Update camera positions and lookAts for mobile responsiveness
    const camPositions = getCameraPositions();
    const camLookAts = getCameraLookAts();
    section4CamPos.copy(camPositions.section4);
    section2CamPos.copy(camPositions.section2);
    section3CamPos.copy(camPositions.section3);
    section4LookAt.copy(camLookAts.section4);
    section2LookAt.copy(camLookAts.section2);
    section3LookAt.copy(camLookAts.section3);

    // Smooth camera blending between section targets
    const wSum = heroAlpha + synopsisAlpha + section4Alpha + section2Alpha + section3Alpha || 1;
    blendedCamPos
        .set(0, 0, 0)
        .addScaledVector(heroCamPos, heroAlpha)
        .addScaledVector(section4CamPos, section4Alpha)
        .addScaledVector(section2CamPos, section2Alpha)
        .addScaledVector(section3CamPos, section3Alpha)
        .multiplyScalar(1 / wSum);

    blendedLookAt
        .set(0, 0, 0)
        .addScaledVector(heroLookAt, heroAlpha)
        .addScaledVector(section4LookAt, section4Alpha)
        .addScaledVector(section2LookAt, section2Alpha)
        .addScaledVector(section3LookAt, section3Alpha)
        .multiplyScalar(1 / wSum);

    camera.position.lerp(blendedCamPos, 0.08);
    // For lookAt we lerp a "current" target and then lookAt it
    if (!camera.userData.lookAt) camera.userData.lookAt = new THREE.Vector3().copy(heroLookAt);
    camera.userData.lookAt.lerp(blendedLookAt, 0.08);
    camera.lookAt(camera.userData.lookAt);
}

window.addEventListener('scroll', handleScroll);
handleScroll(); // Initial call

// Start animation
animate();

