// === SCENE MANAGEMENT ===
const SceneManager = {
  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.createGroundPlane();
    this.createArrowGeometry();
  },

  setupScene() {
    AppState.scene = new THREE.Scene();
    this.updateBackgroundColor(Config.settings.darkBackground);
  },

  setupCamera() {
    const canvas = document.getElementById('three-canvas');
    const rect = canvas.getBoundingClientRect();
    AppState.camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);
    AppState.camera.position.set(20, 25, 20);
  },

  setupRenderer() {
    const canvas = document.getElementById('three-canvas');
    const canvasPanel = document.getElementById('canvas-panel');
    const rect = canvasPanel.getBoundingClientRect();
    AppState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    AppState.renderer.setSize(rect.width, rect.height);
    AppState.renderer.setPixelRatio(window.devicePixelRatio);
  },

  setupControls() {
    AppState.controls = new THREE.OrbitControls(AppState.camera, AppState.renderer.domElement);
    AppState.controls.enableDamping = true;
    AppState.controls.dampingFactor = 0.05;
    AppState.controls.enablePan = false;
  },

  setupLighting() {
    AppState.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  },

  updateBackgroundColor(isDark) {
    const color = isDark ? CONSTANTS.COLORS.BACKGROUND.DARK : CONSTANTS.COLORS.BACKGROUND.LIGHT;
    AppState.scene.background = new THREE.Color(color);
  },

  createGroundPlane() {
    const geometry = new THREE.PlaneGeometry(CONSTANTS.MAP.GROUND_SIZE, CONSTANTS.MAP.GROUND_SIZE);
    
    AppState.mapCanvas = document.createElement('canvas');
    AppState.mapCanvas.width = CONSTANTS.MAP.TEXTURE_SIZE;
    AppState.mapCanvas.height = CONSTANTS.MAP.TEXTURE_SIZE;
    AppState.mapContext = AppState.mapCanvas.getContext('2d');
    
    AppState.mapContext.fillStyle = '#4a7c59';
    AppState.mapContext.fillRect(0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE);
    
    AppState.mapTexture = new THREE.CanvasTexture(AppState.mapCanvas);
    
    const material = new THREE.MeshLambertMaterial({ map: AppState.mapTexture });
    AppState.groundPlane = new THREE.Mesh(geometry, material);
    AppState.groundPlane.rotation.x = -Math.PI / 2;
    AppState.groundPlane.position.y = -1;
    AppState.scene.add(AppState.groundPlane);
  },

  createArrowGeometry() {
    const shaftGeometry = new THREE.CylinderGeometry(0.03, 0.06, 1.0, 8);
    const headGeometry = new THREE.ConeGeometry(0.12, 0.3, 8);
    
    const shaftMatrix = new THREE.Matrix4();
    const headMatrix = new THREE.Matrix4();
    headMatrix.setPosition(0, 0.65, 0);
    
    const shaftGeo = shaftGeometry.clone().applyMatrix4(shaftMatrix);
    const headGeo = headGeometry.clone().applyMatrix4(headMatrix);
    
    AppState.arrowGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries([shaftGeo, headGeo]);
    AppState.arrowMaterial = new THREE.MeshLambertMaterial({
      color: CONSTANTS.COLORS.ARROW,
      transparent: true,
      opacity: 0.85
    });
  }
};

// === SELECTION MANAGEMENT ===
const SelectionManager = {
  selectFlightLevel(yLevel) {
    this.deselectFlightLevel();
    AppState.selectedFlightLevel = yLevel;
    
    AppState.windCubes.forEach(cube => {
      if (cube.userData.yLevel === yLevel) {
        cube.material.opacity = 0.5;
        
        const wireframeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        wireframe.position.copy(cube.position);
        AppState.scene.add(wireframe);
        AppState.selectedCubes.push(wireframe);
      } else {
        cube.material.opacity = Config.settings.cubeOpacity;
      }
    });
    
    this.updateArrowVisibility();
    MiniMapManager.update();
    MapManager.addWindCubesToMap();
  },

  deselectFlightLevel() {
    AppState.selectedFlightLevel = null;
    AppState.selectedCubes.forEach(wireframe => AppState.scene.remove(wireframe));
    AppState.selectedCubes = [];
    
    AppState.windCubes.forEach(cube => {
      cube.material.opacity = Config.settings.cubeOpacity;
    });
    
    this.updateArrowVisibility();
    MiniMapManager.update();
    MapManager.addWindCubesToMap();
  },

  updateArrowVisibility() {
    AppState.windArrows.forEach(arrow => {
      const shouldShow = Config.settings.showWindArrows && 
                        AppState.selectedFlightLevel !== null && 
                        arrow.userData.yLevel === AppState.selectedFlightLevel;
      arrow.style.display = shouldShow ? 'block' : 'none';
    });
    
    if (Config.settings.showWindArrows && AppState.selectedFlightLevel !== null) {
      this.updateArrowPositions();
    }
  },

  updateArrowPositions() {
    AppState.windArrows.forEach(arrow => {
      if (arrow.style.display === 'block') {
        const cube = arrow.userData.cube;
        const screenPosition = Utils.worldToScreen(
          new THREE.Vector3(cube.position.x, cube.position.y + 1.5, cube.position.z),
          AppState.camera, AppState.renderer
        );
        
        if (screenPosition) {
          Utils.applyElementStyles(arrow, {
            left: screenPosition.x + 'px',
            top: screenPosition.y + 'px',
            visibility: 'visible'
          });
        } else {
          arrow.style.visibility = 'hidden';
        }
      }
    });
  },

  toggleWindArrows(showArrows) {
    Config.settings.showWindArrows = showArrows;
    this.updateArrowVisibility();
    MiniMapManager.updateArrowVisibility();
    MapManager.addWindCubesToMap();
  }
};

// === LABELS MANAGEMENT ===
const LabelsManager = {
  create() {
    this.createFlightLevelLabels();
    this.createCompassLabels();
  },

  createFlightLevelLabels() {
    for (let y = 0; y < CONSTANTS.FLIGHT_LEVELS.COUNT * CONSTANTS.GRID.SPACING; y += CONSTANTS.GRID.SPACING) {
      const flightLevel = CONSTANTS.FLIGHT_LEVELS.MIN + ((y / CONSTANTS.GRID.SPACING) * CONSTANTS.FLIGHT_LEVELS.INCREMENT);
      const flStr = String(flightLevel).padStart(3, '0');
      this.createTextSprite(`FL${flStr}`, 11, y, 0);
    }
  },

  createCompassLabels() {
    const labels = [['N', 0, 0, -11], ['S', 0, 0, 11], ['E', 11, 0, 0], ['W', -11, 0, 0]];
    labels.forEach(([text, x, y, z]) => this.createTextSprite(text, x, y, z));
  },

  createTextSprite(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '24px Geist, system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 1, 1);
    AppState.scene.add(sprite);
  }
}; 