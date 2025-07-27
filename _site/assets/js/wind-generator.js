// === WIND GENERATION ===
const WindGenerator = {
  generateGrid() {
    this.clearExisting();
    const stateData = getStateData(Config.settings.state);
    if (!stateData) return;
    
    const windPattern = stateData.windPattern;
    
    for (let x = -CONSTANTS.GRID.RANGE; x <= CONSTANTS.GRID.RANGE; x += CONSTANTS.GRID.SPACING) {
      for (let y = 0; y < CONSTANTS.FLIGHT_LEVELS.COUNT; y++) {
        for (let z = -CONSTANTS.GRID.RANGE; z <= CONSTANTS.GRID.RANGE; z += CONSTANTS.GRID.SPACING) {
          const flightLevel = CONSTANTS.FLIGHT_LEVELS.MIN + (y * CONSTANTS.FLIGHT_LEVELS.INCREMENT);
          const speed = WindCalculator.calculateSpeed(windPattern, x, y * CONSTANTS.GRID.SPACING, z);
          this.createCube(x, y * CONSTANTS.GRID.SPACING, z, Math.round(speed), flightLevel);
        }
      }
    }
  },

  clearExisting() {
    AppState.windCubes.forEach(cube => AppState.scene.remove(cube));
    AppState.windArrows.forEach(arrow => arrow.parentNode?.removeChild(arrow));
    AppState.windCubes = [];
    AppState.windArrows = [];
  },

  createCube(x, y, z, speed, flightLevel) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const stateData = getStateData(Config.settings.state);
    if (!stateData) return;
    
    const windPattern = stateData.windPattern;
    const windDirection = WindCalculator.generateDirection(x, y, z, windPattern);
    
    let color, stormType = null, distanceFromCenter = Infinity, isStormCore = false;
    
    if (Config.settings.hurricaneActive) {
      stormType = 'hurricane';
      distanceFromCenter = Utils.calculateDistance({ x, z }, Config.settings.hurricanePosition);
    } else if (Config.settings.thunderstormActive) {
      stormType = 'thunderstorm';
      distanceFromCenter = Utils.calculateDistance({ x, z }, Config.settings.thunderstormPosition);
      isStormCore = distanceFromCenter < 3 && y > 2;
    }
    
    color = Utils.getWindSpeedColor(speed, stormType, distanceFromCenter, isStormCore);
    
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      transparent: true,
      opacity: Config.settings.cubeOpacity
    });
    
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    cube.userData = { 
      speed, flightLevel,
      yLevel: y / CONSTANTS.GRID.SPACING,
      windDirection
    };
    
    const arrow = this.createArrow(cube, windDirection, speed);
    
    AppState.scene.add(cube);
    AppState.windCubes.push(cube);
    AppState.windArrows.push(arrow);
  },

  createArrow(cube, windDirection, speed) {
    const arrow = Utils.createArrowElement('wind-arrow-3d');
    Utils.applyElementStyles(arrow, {
      position: 'absolute',
      display: 'none',
      zIndex: '1'
    });
    
    const windAngle = Math.atan2(windDirection.x, -windDirection.z) * 180 / Math.PI;
    const bankingEffect = Math.sin((cube.position.x + cube.position.z) * 0.3) * 5;
    const speedBanking = (speed - 50) / 10;
    const totalRotation = windAngle + bankingEffect + speedBanking;
    
    const scale = 0.6 + (speed / 100) * 0.4;
    arrow.style.transform = `translate(-50%, -100%) rotate(${totalRotation}deg) scale(${scale})`;
    
    arrow.userData = { 
      cubeIndex: AppState.windCubes.length,
      yLevel: cube.position.y / CONSTANTS.GRID.SPACING,
      cube
    };
    
    document.body.appendChild(arrow);
    return arrow;
  },

  regenerate() {
    this.generateGrid();
    if (AppState.selectedFlightLevel !== null && typeof SelectionManager !== 'undefined') {
      SelectionManager.selectFlightLevel(AppState.selectedFlightLevel);
    }
  }
}; 