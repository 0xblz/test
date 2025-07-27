// === UTILITY FUNCTIONS ===
const Utils = {
  formatDate: (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  formatTime: (timeObj) => `${timeObj.hour.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`,
  
  getWindSpeedColor(speed, stormType = null, distanceFromCenter = Infinity, isStormCore = false) {
    if (stormType === 'hurricane') {
      const { EYE_BASE_RADIUS, EYE_RADIUS_SCALE, EYEWALL_OFFSET, SPIRAL_BASE_RADIUS, SPIRAL_RADIUS_SCALE } = CONSTANTS.HURRICANE;
      const eyeRadius = EYE_BASE_RADIUS + (Config.settings.hurricaneIntensity * EYE_RADIUS_SCALE);
      const eyeWallRadius = eyeRadius + EYEWALL_OFFSET;
      const spiralRadius = SPIRAL_BASE_RADIUS + (Config.settings.hurricaneIntensity * SPIRAL_RADIUS_SCALE);
      
      if (distanceFromCenter < eyeRadius) return new THREE.Color(CONSTANTS.COLORS.HURRICANE.EYE);
      if (distanceFromCenter < eyeWallRadius) {
        const intensity = 1 - ((distanceFromCenter - eyeRadius) / (eyeWallRadius - eyeRadius));
        const color = new THREE.Color(CONSTANTS.COLORS.HURRICANE.EYEWALL).lerp(new THREE.Color(CONSTANTS.COLORS.HURRICANE.EYEWALL_INTENSE), intensity);
        const pulseIntensity = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
        return color.multiplyScalar(0.8 + pulseIntensity * 0.2);
      }
      if (distanceFromCenter < spiralRadius) {
        const bandIntensity = 1 - ((distanceFromCenter - eyeWallRadius) / (spiralRadius - eyeWallRadius));
        if (speed > 60) return new THREE.Color(0xFF0000).lerp(new THREE.Color(0xFF8800), 1 - bandIntensity);
        if (speed > 40) return new THREE.Color(0xFF8800).lerp(new THREE.Color(0xFFFF00), 1 - bandIntensity);
        return new THREE.Color(0xFFFF00).lerp(new THREE.Color(0x66FF66), 1 - bandIntensity);
      }
    }
    
    if (stormType === 'thunderstorm') {
      if (isStormCore) {
        const color = new THREE.Color(CONSTANTS.COLORS.WIND_SPEED.VERY_STRONG);
        const pulseIntensity = (Math.sin(Date.now() * 0.002) + 1) * 0.5;
        return color.multiplyScalar(0.7 + pulseIntensity * 0.3);
      }
      if (distanceFromCenter < 5) {
        const intensity = Math.max(0.5, 1 - (distanceFromCenter / 5));
        return new THREE.Color(CONSTANTS.COLORS.WIND_SPEED.STRONG).lerp(new THREE.Color(CONSTANTS.COLORS.WIND_SPEED.VERY_STRONG), intensity);
      }
    }
    
    const { THRESHOLDS } = CONSTANTS.WIND_SPEED;
    const { WIND_SPEED: COLORS } = CONSTANTS.COLORS;
    
    if (speed < THRESHOLDS[0]) return COLORS.CALM;
    if (speed < THRESHOLDS[1]) return COLORS.LIGHT;
    if (speed < THRESHOLDS[2]) return COLORS.MODERATE;
    if (speed < THRESHOLDS[3]) return COLORS.STRONG;
    return COLORS.VERY_STRONG;
  },

  normalizeGridPosition: (worldPos) => (worldPos + CONSTANTS.GRID.RANGE + 1) / (2 * CONSTANTS.GRID.RANGE + 2),
  calculateDistance: (pos1, pos2) => Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.z - pos2.z) ** 2),
  getRandomPosition: () => ({ x: Math.random() * 16 - 8, z: Math.random() * 16 - 8 }),

  createArrowElement(className = 'mini-map-arrow') {
    const arrow = document.createElement('div');
    arrow.className = className;
    return arrow;
  },

  applyElementStyles(element, styles) {
    Object.assign(element.style, styles);
  },

  worldToScreen(position, camera, renderer) {
    const vector = new THREE.Vector3().copy(position).project(camera);
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    const screenX = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
    const screenY = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
    
    return (vector.z < 1 && screenX >= rect.left && screenX <= rect.right && screenY >= rect.top && screenY <= rect.bottom) 
      ? { x: screenX, y: screenY } : null;
  }
}; 