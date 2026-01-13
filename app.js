// ============================================
// 場景配置
// ============================================
const scenes = {
    lobby: {
        name: '大廳',
        image: 'images/lobby.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [  
            {
                targetScene: 'lobby2',
                position: { x: -200, y: -20, z: 0 },
                label: '梯廳',
                size: 30
            }
        ]
    },
    ktv: {
        name: '房間1',
        image: 'images/ktv.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [  
            {
                targetScene: 'ktv2',
                position: { x: -200, y: 25, z: -35 },
                label: '房間2',
                size: 30
            }
        ]
    },
    ktv2: {
        name: '房間2',
        image: 'images/ktv2.png',
        initialView: { lon: -140, lat: -4 },
        hotspots: [  
            {
                targetScene: 'ktv',
                position: { x: -200, y: 5, z: -10 },
                label: '房間1',
                size: 30
            }
        ]
    },
    lobby2: {
        name: '梯廳',
        image: 'images/lobby2.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [  
            {
                targetScene: 'ktv',
                position: { x: -100, y: -20, z: -250 },
                label: '房間1',
                size: 30
            },
            {
                targetScene: 'lobby',
                position: { x: 200, y: -20, z: 0 },
                label: '回大廳',
                size: 30
            },
            {
                targetScene: 'aisle',
                position: { x: -100, y: -20, z: 10 },
                label: '廊道1',
                size: 30
            }
        ]
    },
    aisle: {
        name: '廊道1',
        image: 'images/aisle.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [ 
            {
                targetScene: 'lobby2',
                position: { x: 0, y: -20, z: 100 },
                label: '梯廳',
                size: 30
            },
            {
                targetScene: 'functionRoom',
                position: { x: -200, y: -50, z: -150 },
                label: '多功能聽',
                size: 30
            },
            {
                targetScene: 'aisle2',
                position: { x: -100, y: -10, z: 0 },
                label: '廊道2',
                size: 30
            }
        ]
    },
    aisle2: {
        name: '廊道2',
        image: 'images/aisle2.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [ 
            {
                targetScene: 'lounge',
                position: { x: -160, y: 0, z: 0 },
                label: '交誼廳',
                size: 30
            },
            {
                targetScene: 'aisle',
                position: { x: -60, y: -10, z: -100 },
                label: '廊道1',
                size: 30
            }
        ]
    },
    lounge: {
        name: '交誼廳',
        image: 'images/lounge.png',
        initialView: { lon: 180, lat: 0 },
        hotspots: [ 
            {
                targetScene: 'aisle',
                position: { x: -120, y: 0, z: -150 },
                label: '廊道1',
                size: 30
            },
            {
                targetScene: 'aisle2',
                position: { x: 120, y: 0, z: -150 },
                label: '廊道2',
                size: 30
            }
        ]
    },
    functionRoom: {
        name: '多功能聽',
        image: 'images/functionRoom.png',
        initialView: { lon: -115, lat: -10 },
        hotspots: [ 
            {
                targetScene: 'aisle',
                position: { x: 50, y: 0, z: -50 },
                label: '廊道1',
                size: 30
            },
            {
                targetScene: 'aisle2',
                position: { x: 50, y: 0, z: 50 },
                label: '廊道2',
                size: 30
            }
        ]
    },
};

// ============================================
// Three.js 設置
// ============================================
let scene, camera, renderer, sphere;
let currentHotspots = [];  //多個 hotspot
let isUserInteracting = false;
let onPointerDownMouseX = 0, onPointerDownMouseY = 0;
let lon = 0, onPointerDownLon = 0;
let lat = 0, onPointerDownLat = 0;
let phi = 0, theta = 0;
let autoRotate = false;
let currentSceneId = 'ktv';
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

    loadScene('ktv');

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('wheel', onDocumentMouseWheel);
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('resize', onWindowResize);

    document.getElementById('switchRoomBtn').addEventListener('click', switchRoom);
    document.getElementById('autoRotateBtn').addEventListener('click', toggleAutoRotate);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleReturnlobby);
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

    // 重設 FOV 為 80
    camera.fov = 80;
    camera.updateProjectionMatrix();
    console.log('✓ FOV 重設為:', 80);

    // 👇 新增：設定該場景的初始視角
    if (sceneData.initialView) {
        lon = sceneData.initialView.lon;
        lat = sceneData.initialView.lat;
        console.log('✓ 初始視角設定為 - lon:', lon, 'lat:', lat);
    }

    const loader = new THREE.TextureLoader();
    loader.load(
        sceneData.image,
        (texture) => {
            if (sphere) {
                scene.remove(sphere);
            }
            
            // 移除所有舊的 hotspot
            if (currentHotspots.length > 0) {
                currentHotspots.forEach(hotspot => {
                    scene.remove(hotspot);
                });
                currentHotspots = [];
            }

            const geometry = new THREE.SphereGeometry(500, 128, 64);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);

            // 創建所有 hotspot
            if (sceneData.hotspots && sceneData.hotspots.length > 0) {
                sceneData.hotspots.forEach(hotspotData => {
                    createHotspot(hotspotData);
                });
            }

            document.getElementById('loading').style.display = 'none';
            
            console.log('✓ 場景載入完成:', sceneData.name);
            console.log('✓ 熱點數量:', sceneData.hotspots?.length || 0);
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
    // 創建 Canvas 來繪製文字
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // 設置文字樣式
    context.font = 'bold 60px Arial';
    context.fillStyle = '#00FF00';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(hotspotData.label, canvas.width / 2, canvas.height / 2);

    // 創建紋理
    const texture = new THREE.CanvasTexture(canvas);
    
    // 創建平面來顯示文字
    const geometry = new THREE.PlaneGeometry(80, 40);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const hotspot = new THREE.Mesh(geometry, material);
    hotspot.position.set(
        hotspotData.position.x,
        hotspotData.position.y,
        hotspotData.position.z
    );
    hotspot.userData = { 
        targetScene: hotspotData.targetScene,
        label: hotspotData.label
    };
    
    // 加入場景和陣列
    scene.add(hotspot);
    currentHotspots.push(hotspot);  // 👈 加入陣列

    console.log('✓ 熱點已創建:', hotspotData.label, 'at', hotspotData.position);
}

function animateHotspot() {
    // 👇 讓所有 hotspot 面向攝影機
    if (currentHotspots.length > 0) {
        currentHotspots.forEach(hotspot => {
            hotspot.lookAt(camera.position);
        });
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
        console.log('lon', lon, 'lat', lat);
    }
}

function onPointerUp() {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    const fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(fov, 80, 120);
    camera.updateProjectionMatrix();
    console.log('fov', fov);
}

function onDocumentClick(event) {
    // 👇 新增：計算滑鼠移動距離
    const deltaX = Math.abs(event.clientX - onPointerDownMouseX);
    const deltaY = Math.abs(event.clientY - onPointerDownMouseY);
    const dragThreshold = 5; // 移動超過 5 像素就視為拖曳
    
    // 👇 如果有拖曳動作，就不執行點擊事件
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
        console.log('✗ 偵測到拖曳動作，取消場景切換');
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    // 檢查所有 hotspot
    if (currentHotspots.length > 0) {
        const intersects = raycaster.intersectObjects(currentHotspots);
        if (intersects.length > 0) {
            const clickedHotspot = intersects[0].object;
            console.log('✓ 熱點被點擊！切換到:', clickedHotspot.userData.targetScene);
            const targetScene = clickedHotspot.userData.targetScene;
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
    const nextScene = currentSceneId === 'ktv' ? 'ktv2' : 'ktv';
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

function toggleReturnlobby() {
    loadScene('lobby');
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