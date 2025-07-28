// === MAP MANAGEMENT ===
const MapManager = {
  tileUrls: {
    'OpenStreetMap': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'Satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'Terrain': 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  },

  init() {
    this.initLeaflet();
    const stateData = getStateData(Config.settings.state);
    this.updateState(stateData);
  },

  initLeaflet() {
    const mapDiv = document.getElementById('leaflet-map-main');
    AppState.leafletMap = L.map(mapDiv, {
      zoomControl: true, attributionControl: true, dragging: true,
      touchZoom: true, scrollWheelZoom: true, doubleClickZoom: true, boxZoom: true
    });
    
    L.tileLayer(this.tileUrls[Config.settings.mapStyle], { maxZoom: 19 }).addTo(AppState.leafletMap);
  },

  updateState(stateData) {
    if (!stateData) return;
    
    // Set a wider view for the main map
    AppState.leafletMap.setView(stateData.center, Math.max(stateData.zoom - 1, 3));
    
    // Add bounds rectangle to show wind data area
    if (AppState.windDataBounds) {
      AppState.leafletMap.removeLayer(AppState.windDataBounds);
    }
    
    const bounds = L.latLngBounds(stateData.bounds);
    AppState.windDataBounds = L.rectangle(bounds, {
      color: '#000000',
      weight: 3,
      fillOpacity: 0.1,
      fillColor: '#00ddff'
    }).addTo(AppState.leafletMap);
    
    this.captureTexture();
  },

  updateStyle(styleName) {
    AppState.leafletMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        AppState.leafletMap.removeLayer(layer);
      }
    });
    
    L.tileLayer(this.tileUrls[styleName] || this.tileUrls['OpenStreetMap']).addTo(AppState.leafletMap);
    this.captureTexture();
  },

  captureTexture() {
    const stateData = getStateData(Config.settings.state);
    if (!stateData) return;
    
    // Instead of using a single tile, we'll capture the exact bounds area
    // by taking a screenshot of the leaflet map's bounds rectangle area
    this.captureFromLeafletBounds();
  },

  captureFromLeafletBounds() {
    const stateData = getStateData(Config.settings.state);
    if (!stateData) return;
    
    // Use the same zoom as the left map
    const zoom = Math.max(stateData.zoom - 1, 3);
    const bounds = stateData.bounds;
    
    // Convert bounds to tile coordinates
    const nwTile = this.latLngToTile(bounds[1][0], bounds[0][1], zoom); // North-West (max lat, min lng)
    const seTile = this.latLngToTile(bounds[0][0], bounds[1][1], zoom); // South-East (min lat, max lng)
    
    // Calculate how many tiles we need
    const tilesX = Math.abs(seTile.x - nwTile.x) + 1;
    const tilesY = Math.abs(seTile.y - nwTile.y) + 1;
    
    // Create a larger canvas to hold all tiles
    const tileCanvas = document.createElement('canvas');
    const tileSize = 256; // Standard tile size
    tileCanvas.width = tilesX * tileSize;
    tileCanvas.height = tilesY * tileSize;
    const tileCtx = tileCanvas.getContext('2d');
    
    let tilesLoaded = 0;
    const totalTiles = tilesX * tilesY;
    
    // Load all tiles
    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        const tileX = Math.min(nwTile.x, seTile.x) + x;
        const tileY = Math.min(nwTile.y, seTile.y) + y;
        
        const tileUrl = (this.tileUrls[Config.settings.mapStyle] || this.tileUrls['OpenStreetMap'])
          .replace('{z}', zoom)
          .replace('{x}', tileX)
          .replace('{y}', tileY)
          .replace('{s}', 'a');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Draw this tile to the composite canvas
          tileCtx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
          tilesLoaded++;
          
          // When all tiles are loaded, create the final texture
          if (tilesLoaded === totalTiles) {
            this.finalizeBoundsTexture(tileCanvas, bounds, zoom);
          }
        };
        
        img.onerror = () => {
          tilesLoaded++;
          if (tilesLoaded === totalTiles) {
            this.createFallbackTexture();
          }
        };
        
        img.src = tileUrl;
      }
    }
  },

  finalizeBoundsTexture(tileCanvas, bounds, zoom) {
    // Clear the app's map canvas
    AppState.mapContext.clearRect(0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE);
    
    // Calculate the exact crop area within the tile canvas that matches our bounds
    const nwTile = this.latLngToTile(bounds[1][0], bounds[0][1], zoom);
    const seTile = this.latLngToTile(bounds[0][0], bounds[1][1], zoom);
    
    // Convert bounds back to pixel coordinates within the tiles
    const nwPixel = this.latLngToPixel(bounds[1][0], bounds[0][1], zoom);
    const sePixel = this.latLngToPixel(bounds[0][0], bounds[1][1], zoom);
    
    // Calculate crop area
    const cropX = nwPixel.x - (Math.min(nwTile.x, seTile.x) * 256);
    const cropY = nwPixel.y - (Math.min(nwTile.y, seTile.y) * 256);
    const cropWidth = sePixel.x - nwPixel.x;
    const cropHeight = sePixel.y - nwPixel.y;
    
    // Draw the cropped area to fit our texture
    AppState.mapContext.drawImage(
      tileCanvas, 
      cropX, cropY, cropWidth, cropHeight,
      0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE
    );
    
    this.addStateLabel();
    this.updateTexture();
  },

  latLngToTile(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  },

  latLngToPixel(lat, lng, zoom) {
    const x = (lng + 180) / 360 * Math.pow(2, zoom) * 256;
    const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom) * 256;
    return { x: Math.floor(x), y: Math.floor(y) };
  },

  processLoadedImage(img) {
    AppState.mapContext.clearRect(0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE);
    AppState.mapContext.drawImage(img, 0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE);
    
    this.addStateLabel();
    this.updateTexture();
  },

  createFallbackTexture() {
    AppState.mapContext.fillStyle = '#4a7c59';
    AppState.mapContext.fillRect(0, 0, CONSTANTS.MAP.TEXTURE_SIZE, CONSTANTS.MAP.TEXTURE_SIZE);
    
    this.addGridPattern();
    this.addStateLabel();
    this.updateTexture();
  },

  addGridPattern() {
    AppState.mapContext.strokeStyle = '#3a5a2a';
    AppState.mapContext.lineWidth = 1;
    for (let i = 0; i < CONSTANTS.MAP.TEXTURE_SIZE; i += 64) {
      AppState.mapContext.beginPath();
      AppState.mapContext.moveTo(i, 0);
      AppState.mapContext.lineTo(i, CONSTANTS.MAP.TEXTURE_SIZE);
      AppState.mapContext.stroke();
      AppState.mapContext.beginPath();
      AppState.mapContext.moveTo(0, i);
      AppState.mapContext.lineTo(CONSTANTS.MAP.TEXTURE_SIZE, i);
      AppState.mapContext.stroke();
    }
  },

  addStateLabel() {
    AppState.mapContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    AppState.mapContext.fillRect(10, 10, 150, 30);
    AppState.mapContext.fillStyle = 'white';
    AppState.mapContext.font = '16px Arial';
    AppState.mapContext.fillText(Config.settings.state, 20, 30);
  },

  updateTexture() {
    if (AppState.mapTexture) {
      AppState.mapTexture.needsUpdate = true;
    } else {
      AppState.mapTexture = new THREE.CanvasTexture(AppState.mapCanvas);
    }
    
    if (AppState.groundPlane) {
      AppState.groundPlane.material.map = AppState.mapTexture;
      AppState.groundPlane.material.needsUpdate = true;
    }
  },

  addWindCubesToMap(flightLevel = null) {
    console.log('addWindCubesToMap called with flightLevel:', flightLevel);
    
    // Clear existing wind markers
    if (AppState.windMapMarkers) {
      AppState.windMapMarkers.forEach(marker => {
        AppState.leafletMap.removeLayer(marker);
      });
    }
    AppState.windMapMarkers = [];

    if (flightLevel === null && AppState.selectedFlightLevel === null) {
      console.log('Early return: no flightLevel and no selectedFlightLevel');
      return;
    }

    const targetLevel = flightLevel !== null ? flightLevel : AppState.selectedFlightLevel;
    console.log('addWindCubesToMap - targetLevel:', targetLevel);
    
    const stateData = getStateData(Config.settings.state);
    if (!stateData) {
      console.log('Early return: no stateData');
      return;
    }
    
    console.log('stateData found, proceeding with map update');
    const bounds = stateData.bounds;

    // Calculate grid spacing to make cubes touch
    const latLngBounds = L.latLngBounds(bounds);
    const latRange = latLngBounds.getNorth() - latLngBounds.getSouth();
    const lngRange = latLngBounds.getEast() - latLngBounds.getWest();
    
    // Calculate grid dimensions (matching the 3D grid)
    const gridSize = CONSTANTS.GRID.RANGE * 2 / CONSTANTS.GRID.SPACING + 1; // Should be 10x10
    const cellLat = latRange / gridSize;
    const cellLng = lngRange / gridSize;

    let matchingCubes = 0;
    AppState.windCubes.forEach(cube => {
      if (cube.userData.yLevel === targetLevel) {
        matchingCubes++;
        // Convert cube position to lat/lng
        const normalizedX = Utils.normalizeGridPosition(cube.position.x);
        const normalizedZ = Utils.normalizeGridPosition(cube.position.z);
        
        // Fix the coordinate mapping - Z should be inverted for latitude
        const lat = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (1 - normalizedZ);
        const lng = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * normalizedX;

        // Debug first few cubes
        if (matchingCubes <= 3) {
          console.log(`Cube ${matchingCubes}: 3D pos(${cube.position.x}, ${cube.position.z}) -> normalized(${normalizedX.toFixed(3)}, ${normalizedZ.toFixed(3)}) -> lat/lng(${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        }

        // Get wind speed color
        const speed = cube.userData.speed;
        const color = this.getWindSpeedColorHex(speed, cube.position);

        // Create rectangle instead of point marker to fill the grid cell
        const cellBounds = [
          [lat - cellLat/2, lng - cellLng/2],
          [lat + cellLat/2, lng + cellLng/2]
        ];

        const rectangle = L.rectangle(cellBounds, {
          color: color,
          weight: 0,
          fillColor: color,
          fillOpacity: 0.4,
          className: 'wind-cube-cell'
        });

        // Add tooltip
        rectangle.bindTooltip(`FL${String(cube.userData.flightLevel).padStart(3, '0')}<br/>Wind: ${speed} kt`, {
          permanent: false,
          direction: 'top'
        });

        rectangle.addTo(AppState.leafletMap);
        AppState.windMapMarkers.push(rectangle);

        // Add wind direction arrow if wind arrows are enabled
        if (Config.settings.showWindArrows) {
          const windDirection = cube.userData.windDirection;
          const windAngle = Math.atan2(windDirection.x, -windDirection.z) * 180 / Math.PI;
          
          const arrowMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'wind-arrow-map',
              html: `<div style="
                width: 0; 
                height: 0; 
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 12px solid #00ddff;
                transform: rotate(${windAngle}deg);
                transform-origin: center bottom;
                filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
              "></div>`,
              iconSize: [8, 12],
              iconAnchor: [4, 6]
            })
          });

          arrowMarker.addTo(AppState.leafletMap);
          AppState.windMapMarkers.push(arrowMarker);
        }
      }
    });
    
    console.log('Found', matchingCubes, 'cubes matching yLevel:', targetLevel);
  },

  clearHoverEffects() {
    // Only clear if no flight level is currently selected
    if (AppState.selectedFlightLevel === null) {
      if (AppState.windMapMarkers) {
        AppState.windMapMarkers.forEach(marker => {
          AppState.leafletMap.removeLayer(marker);
        });
        AppState.windMapMarkers = [];
      }
    }
  },

  getWindSpeedColorHex(speed, cubePosition) {
    // Calculate storm parameters just like the 3D cubes do
    let stormType = null, distanceFromCenter = Infinity, isStormCore = false;
    
    if (Config.settings.hurricaneActive) {
      stormType = 'hurricane';
      distanceFromCenter = Utils.calculateDistance(
        { x: cubePosition.x, z: cubePosition.z }, 
        Config.settings.hurricanePosition
      );
    } else if (Config.settings.thunderstormActive) {
      stormType = 'thunderstorm';
      distanceFromCenter = Utils.calculateDistance(
        { x: cubePosition.x, z: cubePosition.z }, 
        Config.settings.thunderstormPosition
      );
      isStormCore = distanceFromCenter < 3 && cubePosition.y > 2;
    }
    
    // Use the same color logic as 3D cubes, then convert to hex string
    const threeColor = Utils.getWindSpeedColor(speed, stormType, distanceFromCenter, isStormCore);
    console.log('Speed:', speed, 'ThreeColor:', threeColor, 'Type:', typeof threeColor);
    
    // Handle both THREE.Color objects and hex numbers
    if (threeColor && typeof threeColor.getHexString === 'function') {
      return '#' + threeColor.getHexString();
    } else if (typeof threeColor === 'number') {
      return '#' + threeColor.toString(16).padStart(6, '0');
    } else {
      // Fallback to original logic
      const { THRESHOLDS } = CONSTANTS.WIND_SPEED;
      
      if (speed < THRESHOLDS[0]) return '#00AA00';      // CALM - green
      if (speed < THRESHOLDS[1]) return '#66FF66';      // LIGHT - light green
      if (speed < THRESHOLDS[2]) return '#FFFF00';      // MODERATE - yellow
      if (speed < THRESHOLDS[3]) return '#FF8800';      // STRONG - orange
      return '#FF0000';                                 // VERY_STRONG - red
    }
  }
};

// === REGION MANAGEMENT ===
const RegionManager = {
  updateRegion(regionName) {
    Config.settings.region = regionName;
    MapManager.updateRegion(regionName);
    WindGenerator.regenerate();
  }
}; 