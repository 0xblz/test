// === CONSTANTS & CONFIGURATION ===
const CONSTANTS = {
  GRID: { SIZE: 10, RANGE: 9, SPACING: 2, VERTICAL_SCALE: 2 },
  FLIGHT_LEVELS: { MIN: 50, MAX: 500, INCREMENT: 50, COUNT: 10 },
  COLORS: {
    WIND_SPEED: { CALM: 0x00AA00, LIGHT: 0x66FF66, MODERATE: 0xFFFF00, STRONG: 0xFF8800, VERY_STRONG: 0xFF0000 },
    HURRICANE: { EYE: 0x87CEEB, EYEWALL: 0xFF00FF, EYEWALL_INTENSE: 0x8B0000 },
    ARROW: 0x00ddff,
    BACKGROUND: { DARK: 0x000000, LIGHT: 0xffffff }
  },
  HURRICANE: { CATEGORY_WINDS: [0, 74, 96, 111, 131, 157], EYE_BASE_RADIUS: 0.5, EYE_RADIUS_SCALE: 0.2, EYEWALL_OFFSET: 0.8, SPIRAL_BASE_RADIUS: 8, SPIRAL_RADIUS_SCALE: 2 },
  WIND_SPEED: { THRESHOLDS: [20, 35, 50, 65], BASE_ALTITUDE_FACTOR: 2.5, MIN: 5, MAX: 100 },
  ANIMATION: { OSCILLATION_SPEED: 1.5, OSCILLATION_AMPLITUDE: 0.03, MINI_MAP_OSCILLATION: 2 },
  MAP: { TEXTURE_SIZE: 512, GROUND_SIZE: 20 }
};

const Config = {
  settings: {
    state: 'Florida',
    cubeOpacity: 0.03,
    mapStyle: 'Terrain',
    darkBackground: true,
    showWindArrows: false,
    currentDate: 'Oct 15, 2024',
    currentTime: '14:00',
    thunderstormActive: false,
    thunderstormPosition: { x: 0, z: 0 },
    hurricaneActive: false,
    hurricanePosition: { x: 0, z: 0 },
    hurricaneIntensity: 3
  }
};

// === STATE MANAGEMENT ===
const AppState = {
  scene: null, camera: null, renderer: null, controls: null,
  windCubes: [], windArrows: [], groundPlane: null, arrowGeometry: null, arrowMaterial: null,
  raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(), isHovering: false,
  selectedFlightLevel: null, selectedCubes: [], isDragging: false, mouseDownPosition: { x: 0, y: 0 },
  gui: null, tooltip: null, leafletMap: null, mapCanvas: null, mapContext: null, mapTexture: null,
  windDataBounds: null, windMapMarkers: [],
  currentDate: new Date(), currentTime: { hour: new Date().getHours(), minute: new Date().getMinutes() },
  miniMap: {
    scene: null, camera: null, renderer: null, canvas: null, container: null, groundPlane: null,
    cubes: [], arrows: [], isResizing: false, resizeStartSize: { width: 0, height: 0 }, resizeStartMouse: { x: 0, y: 0 }
  }
}; 