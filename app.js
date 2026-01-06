// ============================================
// 場景配置
// ============================================
const scenes = {
    room1: {
        name: 'Room 1',
        image: 'images/Room1.png',
        // 把熱點放在正前方，容易看到
        hotspot: {
            targetScene: 'room2',
            position: { x: 0, y: 0, z: 300 },  // 正前方
            label: '→ Room 2'
        }
    },
    room2: {
        name: 'Room 2',
        image: 'images/Room2.png',
        hotspot: {
            targetScene: 'room1',
            position: { x: 0, y: 0, z: 300 },  // 正前方
            label: '← Room 1'
        }
    }
};

// ============================================
// Three.js 設置
// ============================================
let scene, camera, renderer, sphere, currentHotspot;
let isUserInteracting = false;
let onPointerDownMouseX = 0, onPointerDownMouseY = 0;
let lon = 0, onPointerDownLon = 0;
let lat = 0, onPointerDownLat = 0;
let phi = 0, theta = 0;
let autoRotate = false;
let currentSceneId = 'room1';
let raycaster, mouse;

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        1,
        3000
    );
    camera.position.set(0, 0, 0.1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    loadScene('room1');

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('wheel', onDocumentMouseWheel);
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('resize', onWindowResize);

    document.getElementById('switchRoomBtn').addEventListener('click', switchRoom);
    document.getElementById('autoRotateBtn').addEventListener('click', toggleAutoRotate);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
}

function loadScene(sceneId) {
    const sceneData = scenes[sceneId];
    if (!sceneData) {
        console.error('Scene not found:', sceneId);
        return;
    }

    currentSceneId = sceneId;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('current-scene-name').textContent = sceneData.name;

    const loader = new THREE.TextureLoader();
    loader.load(
        sceneData.image,
        (texture) => {
            if (sphere) {
                scene.remove(sphere);
            }
            if (currentHotspot) {
                scene.remove(currentHotspot);
            }

            const geometry = new THREE.SphereGeometry(
                500,    // 半徑
                128,    // 寬度分段數（從 60 提高到 128）
                64      // 高度分段數（從 40 提高到 64）
            );

            // 設置紋理過濾
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);

            if (sceneData.hotspot) {
                createHotspot(sceneData.hotspot);
            }

            document.getElementById('loading').style.display = 'none';
            
            console.log('✓ 場景載入完成:', sceneData.name);
            console.log('✓ 熱點位置:', sceneData.hotspot.position);
        },
        undefined,
        (error) => {
            console.error('載入全景圖失敗:', error);
            document.getElementById('loading').innerHTML = 
                '<div class="spinner"></div>' +
                '<div>載入失敗</div>' +
                '<div style="font-size: 12px; margin-top: 10px;">請確認圖片路徑正確</div>';
        }
    );
}

function createHotspot(hotspotData) {
    // 創建一個較大的發光球體
    const hotspotGeometry = new THREE.SphereGeometry(30, 32, 32);
    const hotspotMaterial = new THREE.MeshBasicMaterial({
        color: 0x00FF00,  // 亮綠色
        transparent: true,
        opacity: 0.7,
        emissive: 0x00FF00,  // 發光效果
        emissiveIntensity: 0.5
    });
    
    currentHotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    currentHotspot.position.set(
        hotspotData.position.x,
        hotspotData.position.y,
        hotspotData.position.z
    );
    currentHotspot.userData = { 
        targetScene: hotspotData.targetScene,
        label: hotspotData.label
    };
    scene.add(currentHotspot);

    // 更新狀態顯示
    document.getElementById('hotspot-status').textContent = 
        `已創建 (${hotspotData.label})`;
    
    console.log('✓ 熱點已創建:', hotspotData.label, 'at', hotspotData.position);
}

function animateHotspot() {
    if (currentHotspot) {
        // 脈動效果
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
        currentHotspot.scale.set(scale, scale, scale);
        
        // 旋轉效果
        currentHotspot.rotation.y += 0.01;
    }
}

function onPointerDown(event) {
    isUserInteracting = true;
    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
}

function onPointerMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
    }
}

function onPointerUp() {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    const fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(fov, 80, 120);
    camera.updateProjectionMatrix();
}

function onDocumentClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (currentHotspot) {
        const intersects = raycaster.intersectObject(currentHotspot);
        if (intersects.length > 0) {
            console.log('✓ 熱點被點擊！切換到:', currentHotspot.userData.targetScene);
            const targetScene = currentHotspot.userData.targetScene;
            loadScene(targetScene);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function switchRoom() {
    const nextScene = currentSceneId === 'room1' ? 'room2' : 'room1';
    console.log('✓ 切換房間:', nextScene);
    loadScene(nextScene);
}

function toggleAutoRotate() {
    autoRotate = !autoRotate;
    const btn = document.getElementById('autoRotateBtn');
    btn.classList.toggle('active');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && !isUserInteracting) {
        lon += 0.1;
    }

    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    animateHotspot();

    renderer.render(scene, camera);
}

init();
animate();
