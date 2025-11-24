// Fire Light Component - Handles flickering animation and shadows
AFRAME.registerComponent('fire-light', {
    schema: {
        speed: { type: 'number', default: 10 },
        baseIntensity: { type: 'number', default: 1 }
    },
    
    init: function() {
        this.originalIntensity = this.el.getAttribute('light').intensity;
        this.originalPosition = this.el.getAttribute('position');
        this.time = 0;
        
        // Configure shadow for point lights after a short delay to ensure light is initialized
        this.el.addEventListener('loaded', () => {
            this.configureShadows();
        });
        
        // Also try immediately in case loaded already fired
        setTimeout(() => {
            this.configureShadows();
        }, 100);
    },
    
    configureShadows: function() {
        if (this.el.getAttribute('light').type === 'point') {
            // Access the Three.js light object
            if (this.el.object3D && this.el.object3D.children[0]) {
                const light = this.el.object3D.children[0];
                if (light && light.shadow) {
                    light.castShadow = true;
                    // Configure shadow map size based on light ID
                    if (this.el.id === 'fireLight1') {
                        light.shadow.mapSize.width = 512;
                        light.shadow.mapSize.height = 512;
                        light.shadow.camera.near = 0.1;
                        light.shadow.camera.far = 8;
                    } else if (this.el.id === 'fireLight2') {
                        light.shadow.mapSize.width = 256;
                        light.shadow.mapSize.height = 256;
                        light.shadow.camera.near = 0.1;
                        light.shadow.camera.far = 6;
                    } else if (this.el.id === 'fireLight3') {
                        light.shadow.mapSize.width = 256;
                        light.shadow.mapSize.height = 256;
                        light.shadow.camera.near = 0.1;
                        light.shadow.camera.far = 5;
                    } else if (this.el.id === 'groundReflection') {
                        light.shadow.mapSize.width = 512;
                        light.shadow.mapSize.height = 512;
                        light.shadow.camera.near = 0.05;
                        light.shadow.camera.far = 4;
                    }
                }
            }
        }
    },
    
    tick: function(time, timeDelta) {
        this.time += timeDelta / 1000; // Convert to seconds
        
        const speed = this.data.speed;
        const flicker1 = Math.sin(this.time * speed);
        const flicker2 = Math.sin(this.time * speed * 1.3);
        const flicker3 = Math.sin(this.time * speed * 0.8);
        
        const light = this.el.getAttribute('light');
        const pos = this.el.getAttribute('position');
        
        // Different flicker patterns for different lights - only intensity changes, position stays fixed
        if (this.el.id === 'fireLight1') {
            light.intensity = this.originalIntensity * (1.0 + flicker1 * 0.15);
            // Keep position fixed at original
        } else if (this.el.id === 'fireLight2') {
            light.intensity = this.originalIntensity * (1.0 + flicker2 * 0.2);
            // Keep position fixed at original
        } else if (this.el.id === 'fireLight3') {
            light.intensity = this.originalIntensity * (1.0 + flicker3 * 0.25);
            // Keep position fixed at original
        } else if (this.el.id === 'fireGlow') {
            light.intensity = this.originalIntensity * (1.0 + flicker1 * 0.1);
            // Keep position fixed at original
        } else if (this.el.id === 'groundReflection') {
            light.intensity = this.originalIntensity * (1.0 + flicker2 * 0.15);
            // Keep position fixed at original
        }
        
        this.el.setAttribute('light', light);
        // Position stays at original - no movement
    }
});

// Tree Generator Component
AFRAME.registerComponent('tree-generator', {
    init: function() {
        this.generateTrees();
    },
    
    generateTrees: function() {
        const treeTrunkMaterial = { color: '#4b2e05', roughness: 0.8, metalness: 0.1 };
        const treeLeavesMaterial = { color: '#0b3d02', roughness: 0.95, metalness: 0.0 };
        
        const createRandomTree = (baseX, baseZ, scale = 1) => {
            const treeGroup = document.createElement('a-entity');
            
            const trunkHeight = 0.8 + Math.random() * 0.6;
            const trunkRadius = 0.12 + Math.random() * 0.08;
            
            const trunk = document.createElement('a-cylinder');
            trunk.setAttribute('radius', trunkRadius);
            trunk.setAttribute('height', trunkHeight);
            trunk.setAttribute('position', `0 ${trunkHeight / 2} 0`);
            trunk.setAttribute('material', treeTrunkMaterial);
            trunk.setAttribute('shadow', 'cast: true; receive: true');
            treeGroup.appendChild(trunk);
            
            const numLayers = Math.floor(2 + Math.random() * 4);
            let leavesY = trunkHeight + 0.3;
            
            for (let i = 0; i < numLayers; i++) {
                const layerScale = 1 - (i * 0.2);
                const radius = (0.6 + Math.random() * 0.4) * layerScale * scale;
                const height = (1.0 + Math.random() * 0.5) * layerScale * scale;
                
                const leaves = document.createElement('a-cone');
                leaves.setAttribute('radius-bottom', radius);
                leaves.setAttribute('height', height);
                leaves.setAttribute('segments-radial', 8);
                leaves.setAttribute('position', `0 ${leavesY} 0`);
                leaves.setAttribute('material', treeLeavesMaterial);
                leaves.setAttribute('shadow', 'cast: true; receive: true');
                
                leavesY += height * 0.8;
                treeGroup.appendChild(leaves);
            }
            
            treeGroup.setAttribute('rotation', `0 ${Math.random() * 360} 0`);
            const treeScale = 0.8 + Math.random() * 0.4;
            treeGroup.setAttribute('scale', `${treeScale} ${treeScale} ${treeScale}`);
            
            return treeGroup;
        };
        
        // Helper function to check if position is too close to tent
        const tentPosition = { x: 0, z: -6 }; // Tent is at camp position (0, 0, -6)
        const minDistanceFromTent = 10; // Minimum distance from tent
        
        const isTooCloseToTent = (x, z) => {
            const distance = Math.sqrt(
                Math.pow(x - tentPosition.x, 2) + 
                Math.pow(z - tentPosition.z, 2)
            );
            return distance < minDistanceFromTent;
        };
        
        // Generate trees in a circle around campfire (not tent)
        const numTrees = 30 + Math.floor(Math.random() * 20);
        let treesPlaced = 0;
        let attempts = 0;
        while (treesPlaced < numTrees && attempts < numTrees * 3) {
            attempts++;
            const angle = Math.random() * Math.PI * 2;
            const radius = 5.5 + Math.random() * 4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Skip if too close to tent
            if (isTooCloseToTent(x, z)) continue;
            
            const tree = createRandomTree(x, z);
            tree.setAttribute('position', `${x} 0 ${z}`);
            this.el.appendChild(tree);
            treesPlaced++;
        }
        
        // Extra scattered trees in middle area (away from tent)
        const extraTrees = 15 + Math.floor(Math.random() * 15);
        treesPlaced = 0;
        attempts = 0;
        while (treesPlaced < extraTrees && attempts < extraTrees * 3) {
            attempts++;
            const angle = Math.random() * Math.PI * 2;
            const radius = 6 + Math.random() * 4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Skip if too close to tent
            if (isTooCloseToTent(x, z)) continue;
            
            const tree = createRandomTree(x, z);
            tree.setAttribute('position', `${x} 0 ${z}`);
            this.el.appendChild(tree);
            treesPlaced++;
        }
        
        // Additional trees in outer area (away from tent)
        const outerTrees = 40 + Math.floor(Math.random() * 20);
        treesPlaced = 0;
        attempts = 0;
        while (treesPlaced < outerTrees && attempts < outerTrees * 3) {
            attempts++;
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 12;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Skip if too close to tent
            if (isTooCloseToTent(x, z)) continue;
            
            const tree = createRandomTree(x, z);
            tree.setAttribute('position', `${x} 0 ${z}`);
            this.el.appendChild(tree);
            treesPlaced++;
        }
        
        // Add 200 more trees distributed across the scene (away from tent)
        const additionalTrees = 200;
        treesPlaced = 0;
        attempts = 0;
        while (treesPlaced < additionalTrees && attempts < additionalTrees * 3) {
            attempts++;
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 18; // Spread from 8 to 26 units from center
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Skip if too close to tent
            if (isTooCloseToTent(x, z)) continue;
            
            const tree = createRandomTree(x, z);
            tree.setAttribute('position', `${x} 0 ${z}`);
            this.el.appendChild(tree);
            treesPlaced++;
        }
    }
});

// Mountain Boundary Component - Creates mountains around the perimeter
AFRAME.registerComponent('mountain-boundary', {
    init: function() {
        this.generateMountains();
    },
    
    generateMountains: function() {
        const mountainMaterial = { color: '#4a4a4a', roughness: 0.95, metalness: 0.05 };
        const boundaryRadius = 28; // Distance from center
        const numWalls = 60; // Number of wall segments around the perimeter
        
        for (let i = 0; i < numWalls; i++) {
            const angle1 = (i / numWalls) * Math.PI * 2;
            const angle2 = ((i + 1) / numWalls) * Math.PI * 2;
            
            const x1 = Math.cos(angle1) * boundaryRadius;
            const z1 = Math.sin(angle1) * boundaryRadius;
            const x2 = Math.cos(angle2) * boundaryRadius;
            const z2 = Math.sin(angle2) * boundaryRadius;
            
            // Calculate wall position (midpoint) and dimensions
            const wallX = (x1 + x2) / 2;
            const wallZ = (z1 + z2) / 2;
            const wallLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
            const wallHeight = 15 + Math.random() * 5; // 15-20 units tall (like base of tall mountain)
            const wallThickness = 1.5; // Thickness of the wall
            
            // Calculate rotation to face outward
            const wallAngle = Math.atan2(z2 - z1, x2 - x1) * (180 / Math.PI);
            
            // Create wall segment (box shape)
            const wall = document.createElement('a-box');
            wall.setAttribute('width', wallLength);
            wall.setAttribute('height', wallHeight);
            wall.setAttribute('depth', wallThickness);
            wall.setAttribute('position', `${wallX} ${wallHeight / 2} ${wallZ}`);
            wall.setAttribute('rotation', `0 ${wallAngle} 0`);
            wall.setAttribute('material', mountainMaterial);
            wall.setAttribute('shadow', 'cast: true; receive: true');
            
            this.el.appendChild(wall);
        }
        
        // Add some additional wall segments for more coverage
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 26 + Math.random() * 2; // 26-28 units from center
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const wall = document.createElement('a-box');
            const wallLength = 2 + Math.random() * 2;
            const wallHeight = 12 + Math.random() * 4; // 12-16 units tall
            const wallThickness = 1.2;
            const wallAngle = Math.random() * 360;
            
            wall.setAttribute('width', wallLength);
            wall.setAttribute('height', wallHeight);
            wall.setAttribute('depth', wallThickness);
            wall.setAttribute('position', `${x} ${wallHeight / 2} ${z}`);
            wall.setAttribute('rotation', `0 ${wallAngle} 0`);
            wall.setAttribute('material', mountainMaterial);
            wall.setAttribute('shadow', 'cast: true; receive: true');
            
            this.el.appendChild(wall);
        }
    }
});

// Boundary Checker Component - Prevents movement beyond a certain radius
AFRAME.registerComponent('boundary-checker', {
    schema: {
        maxRadius: { type: 'number', default: 25 }
    },
    
    init: function() {
        this.lastValidPosition = this.el.getAttribute('position');
    },
    
    tick: function() {
        const pos = this.el.getAttribute('position');
        const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        
        if (distance > this.data.maxRadius) {
            // Move back to last valid position
            this.el.setAttribute('position', this.lastValidPosition);
        } else {
            // Update last valid position
            this.lastValidPosition = { x: pos.x, y: pos.y, z: pos.z };
        }
    }
});

// Proximity Detector Component
AFRAME.registerComponent('proximity-detector', {
    schema: {
        distance: { type: 'number', default: 2 },
        target: { type: 'selector', default: '#rig' }
    },
    
    init: function() {
        this.isNear = false;
    },
    
    tick: function() {
        if (!this.data.target) return;
        
        const position = this.el.getAttribute('position');
        const targetPosition = this.data.target.getAttribute('position');
        
        const distance = Math.sqrt(
            Math.pow(position.x - targetPosition.x, 2) +
            Math.pow(position.y - targetPosition.y, 2) +
            Math.pow(position.z - targetPosition.z, 2)
        );
        
        const wasNear = this.isNear;
        this.isNear = distance <= this.data.distance;
        
        if (this.isNear !== wasNear) {
            this.el.emit(this.isNear ? 'proximityenter' : 'proximityleave');
        }
    }
});

// Log Chair Component - Handles sitting interaction
AFRAME.registerComponent('log-chair', {
    init: function() {
        this.isSitting = false;
        this.rig = document.querySelector('#rig');
        this.camera = document.querySelector('#camera');
        this.sitPopup = document.querySelector('#sitPopup');
        this.standPopup = document.querySelector('#standPopup');
        this.originalRigY = null; // Will be set when sitting
        this.sitRigY = 0.7; // Sitting rig Y position (lowered)
        this.chairPosition = this.el.getAttribute('position');
        
        // Wait for scene to be ready
        if (this.el.sceneEl.hasLoaded) {
            this.initializeControls();
        } else {
            this.el.sceneEl.addEventListener('loaded', () => {
                this.initializeControls();
            });
        }
    },
    
    initializeControls: function() {
        // Store original rig Y position (should be 0, camera is at 1.6)
        if (this.rig) {
            const pos = this.rig.getAttribute('position');
            this.originalRigY = pos.y;
        }
        
        // Listen for proximity events
        this.el.addEventListener('proximityenter', () => {
            if (!this.isSitting) {
                this.showSitPopup();
            }
        });
        
        this.el.addEventListener('proximityleave', () => {
            if (!this.isSitting) {
                this.hideSitPopup();
            }
        });
        
        // Listen for E key press
        this.keyHandler = (e) => {
            if (e.key === 'e' || e.key === 'E') {
                if (this.isSitting) {
                    this.standUp();
                } else if (this.isNearChair()) {
                    this.sitDown();
                }
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    },
    
    remove: function() {
        document.removeEventListener('keydown', this.keyHandler);
    },
    
    isNearChair: function() {
        if (!this.rig) return false;
        const position = this.el.getAttribute('position');
        const targetPosition = this.rig.getAttribute('position');
        
        const distance = Math.sqrt(
            Math.pow(position.x - targetPosition.x, 2) +
            Math.pow(position.y - targetPosition.y, 2) +
            Math.pow(position.z - targetPosition.z, 2)
        );
        
        return distance <= 2;
    },
    
    showSitPopup: function() {
        if (this.sitPopup && !this.isSitting) {
            // Position popup above the log
            const logPos = this.el.getAttribute('position');
            this.sitPopup.setAttribute('position', `${logPos.x} ${logPos.y + 1.5} ${logPos.z}`);
            this.sitPopup.setAttribute('visible', true);
        }
    },
    
    hideSitPopup: function() {
        if (this.sitPopup) {
            this.sitPopup.setAttribute('visible', false);
        }
    },
    
    showStandPopup: function() {
        if (this.standPopup && this.isSitting) {
            const logPos = this.el.getAttribute('position');
            this.standPopup.setAttribute('position', `${logPos.x} ${logPos.y + 1.5} ${logPos.z}`);
            this.standPopup.setAttribute('visible', true);
        }
    },
    
    hideStandPopup: function() {
        if (this.standPopup) {
            this.standPopup.setAttribute('visible', false);
        }
    },
    
    sitDown: function() {
        if (this.isSitting || !this.isNearChair()) return;
        
        this.isSitting = true;
        this.hideSitPopup();
        
        // Store current rig Y if not already stored
        if (this.rig && this.originalRigY === null) {
            const pos = this.rig.getAttribute('position');
            this.originalRigY = pos.y;
        }
        
        // Disable movement by removing wasd-controls
        if (this.rig) {
            this.rig.removeAttribute('wasd-controls');
        }
        
        // Move rig to sitting position near the log
        const logPos = this.el.getAttribute('position');
        if (this.rig) {
            // Position rig near the log, facing the fire (which is at 0,0,0)
            const rigX = logPos.x;
            const rigZ = logPos.z + 0.5;
            this.rig.setAttribute('position', `${rigX} ${this.sitRigY} ${rigZ}`);
            
            // Look at the fire
            const THREE = AFRAME.THREE;
            const Vector3 = THREE['Vector3'];
            const firePos = new Vector3(0, 0, 0);
            const rigPos = new Vector3(rigX, this.sitRigY, rigZ);
            const direction = new Vector3().subVectors(firePos, rigPos).normalize();
            const yaw = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
            this.rig.setAttribute('rotation', `0 ${yaw} 0`);
        }
        
        // Show stand popup
        this.showStandPopup();
    },
    
    standUp: function() {
        if (!this.isSitting) return;
        
        this.isSitting = false;
        this.hideStandPopup();
        
        // Re-enable movement
        if (this.rig) {
            this.rig.setAttribute('wasd-controls', 'acceleration: 15');
        }
        
        // Move rig back to standing position
        if (this.rig && this.originalRigY !== null) {
            const currentPos = this.rig.getAttribute('position');
            this.rig.setAttribute('position', `${currentPos.x} ${this.originalRigY} ${currentPos.z}`);
        }
        
        // Show sit popup if still near
        if (this.isNearChair()) {
            this.showSitPopup();
        }
    },
    
    tick: function() {
        // Update popup to face camera
        const camera = document.querySelector('#camera');
        if (!camera) return;
        
        const THREE = AFRAME.THREE;
        const Vector3 = THREE['Vector3'];
        const cameraWorldPos = new Vector3();
        camera.object3D.getWorldPosition(cameraWorldPos);
        
        if (this.isSitting && this.standPopup && this.standPopup.getAttribute('visible')) {
            this.standPopup.object3D.lookAt(cameraWorldPos);
        } else if (!this.isSitting && this.sitPopup && this.sitPopup.getAttribute('visible')) {
            this.sitPopup.object3D.lookAt(cameraWorldPos);
        }
    }
});

// UI Popup Component - Makes popup face camera
AFRAME.registerComponent('ui-popup', {
    tick: function() {
        if (this.el.getAttribute('visible')) {
            const camera = document.querySelector('#camera');
            if (camera) {
                const THREE = AFRAME.THREE;
                const Vector3 = THREE['Vector3'];
                const cameraWorldPos = new Vector3();
                camera.object3D.getWorldPosition(cameraWorldPos);
                this.el.object3D.lookAt(cameraWorldPos);
            }
        }
    }
});

