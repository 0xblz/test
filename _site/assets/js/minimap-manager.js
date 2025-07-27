// === MINI MAP MANAGEMENT ===
const MiniMapManager = {
  init() {
    AppState.miniMap.container = document.getElementById('mini-map-container');
    AppState.miniMap.canvas = document.getElementById('mini-map-canvas');
    
    // If elements don't exist, don't initialize minimap
    if (!AppState.miniMap.container || !AppState.miniMap.canvas) {
      console.warn('Minimap elements not found - minimap disabled');
      return;
    }
    
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.createGroundPlane();
  },

  setupScene() {
    if (!AppState.miniMap.container) return;
    AppState.miniMap.scene = new THREE.Scene();
    AppState.miniMap.scene.background = new THREE.Color(0x000000);
  },

  setupCamera() {
    if (!AppState.miniMap.container) return;
    AppState.miniMap.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    AppState.miniMap.camera.position.set(0, 50, 0);
    AppState.miniMap.camera.lookAt(0, 0, 0);
  },

  setupRenderer() {
    if (!AppState.miniMap.container || !AppState.miniMap.canvas) return;
    AppState.miniMap.renderer = new THREE.WebGLRenderer({ 
      canvas: AppState.miniMap.canvas, 
      antialias: true 
    });
    
    const containerRect = AppState.miniMap.container.getBoundingClientRect();
    AppState.miniMap.renderer.setSize(containerRect.width - 8, containerRect.height - 8);
  },

  setupLighting() {
    if (!AppState.miniMap.scene) return;
    AppState.miniMap.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  },

  createGroundPlane() {
    if (!AppState.miniMap.scene) return;
    const miniMapGeometry = new THREE.PlaneGeometry(CONSTANTS.MAP.GROUND_SIZE, CONSTANTS.MAP.GROUND_SIZE);
    const miniMapMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
    AppState.miniMap.groundPlane = new THREE.Mesh(miniMapGeometry, miniMapMaterial);
    AppState.miniMap.groundPlane.rotation.x = -Math.PI / 2;
    AppState.miniMap.groundPlane.position.y = -1;
    AppState.miniMap.scene.add(AppState.miniMap.groundPlane);
  },

  update() {
    if (!AppState.miniMap.renderer || !AppState.miniMap.container) return;
    
    if (AppState.selectedFlightLevel !== null) {
      AppState.miniMap.container.classList.add('visible');
      this.updateCubes();
      this.updateArrows();
    } else {
      AppState.miniMap.container.classList.remove('visible');
      this.clearArrows();
    }
  },

  updateCubes() {
    if (!AppState.miniMap.scene) return;
    AppState.miniMap.cubes.forEach(cube => AppState.miniMap.scene.remove(cube));
    AppState.miniMap.cubes = [];
    
    AppState.windCubes.forEach(cube => {
      if (cube.userData.yLevel === AppState.selectedFlightLevel) {
        const miniCube = cube.clone();
        miniCube.position.copy(cube.position);
        miniCube.position.y = 0;
        miniCube.material = cube.material.clone();
        miniCube.material.opacity = 0.25;
        AppState.miniMap.scene.add(miniCube);
        AppState.miniMap.cubes.push(miniCube);
        
        this.createArrow(cube);
      }
    });
  },

  updateArrows() {
    if (!AppState.miniMap.container) return;
    AppState.miniMap.arrows.forEach(arrow => {
      arrow.style.display = Config.settings.showWindArrows ? 'block' : 'none';
    });
  },

  createArrow(cube) {
    if (!AppState.miniMap.container) return;
    const arrow = Utils.createArrowElement('mini-map-arrow');
    
    const windDirection = cube.userData.windDirection;
    const containerRect = AppState.miniMap.container.getBoundingClientRect();
    const mapSize = containerRect.width - 8;
    
    const normalizedX = Utils.normalizeGridPosition(cube.position.x);
    const normalizedZ = Utils.normalizeGridPosition(cube.position.z);
    
    const pixelX = normalizedX * mapSize;
    const pixelZ = normalizedZ * mapSize;
    
    const windAngle = Math.atan2(windDirection.x, -windDirection.z) * 180 / Math.PI;
    const speed = cube.userData.speed;
    const bankingEffect = Math.sin((cube.position.x + cube.position.z) * 0.3) * 5;
    const speedBanking = (speed - 50) / 10;
    const totalRotation = windAngle + bankingEffect + speedBanking;
    
    const scale = 0.6 + (speed / 100) * 0.4;
    
    Utils.applyElementStyles(arrow, {
      left: `${pixelX}px`,
      top: `${pixelZ}px`,
      transform: `translate(-50%, -100%) rotate(${totalRotation}deg) scale(${scale})`,
      display: Config.settings.showWindArrows ? 'block' : 'none'
    });
    
    arrow.dataset.cubeIndex = AppState.windCubes.indexOf(cube);
    
    AppState.miniMap.container.appendChild(arrow);
    AppState.miniMap.arrows.push(arrow);
  },

  clearArrows() {
    if (!AppState.miniMap.container) return;
    AppState.miniMap.arrows.forEach(arrow => {
      if (arrow.parentNode) {
        AppState.miniMap.container.removeChild(arrow);
      }
    });
    AppState.miniMap.arrows = [];
  },

  updateArrowVisibility() {
    if (!AppState.miniMap.container) return;
    AppState.miniMap.arrows.forEach(arrow => {
      arrow.style.display = Config.settings.showWindArrows ? 'block' : 'none';
    });
  },

  updateGroundPlane() {
    if (!AppState.miniMap.groundPlane || !AppState.mapTexture) return;
    
    AppState.miniMap.groundPlane.material = new THREE.MeshLambertMaterial({ 
      map: AppState.mapTexture,
      color: 0xcccccc
    });
    
    AppState.miniMap.groundPlane.material.emissive = new THREE.Color(0x111111);
    AppState.miniMap.groundPlane.material.needsUpdate = true;
  },

  updateArrowPositions() {
    if (!AppState.miniMap.container) return;
    const containerRect = AppState.miniMap.container.getBoundingClientRect();
    const mapSize = containerRect.width - 8;
    
    AppState.miniMap.arrows.forEach(arrow => {
      const cubeIndex = parseInt(arrow.dataset.cubeIndex);
      const cube = AppState.windCubes[cubeIndex];
      
      if (cube && cube.userData.yLevel === AppState.selectedFlightLevel) {
        const normalizedX = Utils.normalizeGridPosition(cube.position.x);
        const normalizedZ = Utils.normalizeGridPosition(cube.position.z);
        
        const pixelX = normalizedX * mapSize;
        const pixelZ = normalizedZ * mapSize;
        
        Utils.applyElementStyles(arrow, {
          left: `${pixelX}px`,
          top: `${pixelZ}px`
        });
      }
    });
  },

  onResizeStart(event) {
    if (!AppState.miniMap.container) return;
    // Minimap resize functionality - disabled when container doesn't exist
  },

  onResize(event) {
    if (!AppState.miniMap.container) return;
    // Minimap resize functionality - disabled when container doesn't exist
  },

  onResizeEnd(event) {
    if (!AppState.miniMap.container) return;
    // Minimap resize functionality - disabled when container doesn't exist
  }
}; 