// === WIND CALCULATION ===
const WindCalculator = {
  generateDirection(x, y, z, windPattern) {
    const flightLevel = CONSTANTS.FLIGHT_LEVELS.MIN + ((y / CONSTANTS.GRID.SPACING) * CONSTANTS.FLIGHT_LEVELS.INCREMENT);
    let directionAngle = 0;
    
    if (Config.settings.hurricaneActive) {
      directionAngle += this.calculateHurricaneEffect(x, y, z);
    } else if (Config.settings.thunderstormActive) {
      directionAngle += this.calculateThunderstormEffect(x, y, z);
    }
    
    directionAngle += this.getAltitudeWindPattern(flightLevel, x, z);
    directionAngle += this.getRegionalWindPattern(windPattern, x, y, z);
    directionAngle += this.getTimeBasedVariation(x, y, z);
    
    const angleRad = (directionAngle * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(angleRad), 0, Math.sin(angleRad)).normalize();
  },

  calculateHurricaneEffect(x, y, z) {
    const dx = x - Config.settings.hurricanePosition.x;
    const dz = z - Config.settings.hurricanePosition.z;
    const distanceFromCenter = Utils.calculateDistance({ x, z }, Config.settings.hurricanePosition);
    
    const { EYE_BASE_RADIUS, EYE_RADIUS_SCALE, EYEWALL_OFFSET, SPIRAL_BASE_RADIUS, SPIRAL_RADIUS_SCALE } = CONSTANTS.HURRICANE;
    const eyeRadius = EYE_BASE_RADIUS + (Config.settings.hurricaneIntensity * EYE_RADIUS_SCALE);
    const eyeWallRadius = eyeRadius + EYEWALL_OFFSET;
    const spiralRadius = SPIRAL_BASE_RADIUS + (Config.settings.hurricaneIntensity * SPIRAL_RADIUS_SCALE);
    
    if (distanceFromCenter < eyeRadius) return Math.random() * 60 - 30;
    
    const hurricaneAngle = Math.atan2(dz, dx) * 180 / Math.PI;
    
    if (distanceFromCenter < eyeWallRadius) {
      const rotationAngle = hurricaneAngle + 90;
      const spiralAngle = rotationAngle - 15;
      const altitudeEffect = Math.sin((y / 10) * Math.PI) * 10;
      return spiralAngle + altitudeEffect;
    }
    
    if (distanceFromCenter < spiralRadius) {
      const spiralIntensity = 1 - ((distanceFromCenter - eyeWallRadius) / (spiralRadius - eyeWallRadius));
      const spiralAngle = hurricaneAngle + 90 - (30 * spiralIntensity);
      const bandEffect = Math.sin(distanceFromCenter * 2 + hurricaneAngle * 0.1) * 15;
      const shearEffect = (y > 6) ? (y - 6) * 5 : 0;
      return spiralAngle + bandEffect + shearEffect;
    }
    
    if (y > 8) {
      const outflowAngle = hurricaneAngle - 90;
      const outflowIntensity = Math.exp(-(distanceFromCenter - spiralRadius) / 3);
      return outflowAngle * outflowIntensity * 0.3;
    }
    
    return 0;
  },

  calculateThunderstormEffect(x, y, z) {
    const dx = x - Config.settings.thunderstormPosition.x;
    const dz = z - Config.settings.thunderstormPosition.z;
    const distanceFromStorm = Utils.calculateDistance({ x, z }, Config.settings.thunderstormPosition);
    
    const stormAngle = Math.atan2(dz, dx) * 180 / Math.PI;
    const rotationStrength = Math.exp(-distanceFromStorm / 3) * 180;
    const verticalComponent = Math.sin((y / 10) * Math.PI) * 45;
    const turbulence = (Math.sin(x * 3 + y * 2 + z * 2.5) + Math.cos(x * 2 + y * 2.5 + z * 2)) * 30;
    
    let effect = stormAngle + rotationStrength + verticalComponent + turbulence;
    if (distanceFromStorm < 3) effect += Math.random() * 60 - 30;
    
    return effect;
  },

  getAltitudeWindPattern(flightLevel, x, z) {
    const patterns = [
      { max: 100, fn: () => Math.sin((x + z) * 0.6) * 25 + Math.cos(x * 0.8) * 15 },
      { max: 200, fn: () => Math.sin((x - z) * 0.4) * 20 + Math.cos(z * 0.7) * 18 },
      { max: 300, fn: () => Math.cos((x + z) * 0.3) * 15 + Math.sin(x * 0.5) * 12 },
      { max: 400, fn: () => 30 + Math.sin(z * 0.2) * 10 + Math.cos(x * 0.3) * 8 },
      { max: Infinity, fn: () => 45 + Math.cos((x - z) * 0.2) * 12 + Math.sin(x * 0.25) * 6 }
    ];
    
    return patterns.find(p => flightLevel <= p.max).fn();
  },

  getRegionalWindPattern(pattern, x, y, z) {
    const timeSeed = AppState.currentDate.getTime() + AppState.currentTime.hour;
    const seededRandom = (Math.sin(timeSeed + x * 1000 + y * 100 + z * 10) + 1) / 2;
    const randomFactor = Math.sin(timeSeed * 0.001 + x * 0.3 + y * 0.5 + z * 0.7) * 15;
    
    const patterns = {
      'nor_easter': () => (z * 2) + Math.sin(y * 0.8) * 15 + (seededRandom * 18 - 9),
      'gulf_stream': () => (x * 1.2) + Math.cos(y * 0.6) * 12 + (seededRandom * 16 - 8),
      'continental': () => (x + z) * 0.8 + Math.sin(y * 0.5) * 18 + (seededRandom * 22 - 11),
      'desert': () => {
        const thermalEffect = Math.max(0, 1 - (y / 10));
        return Math.sin(x * 0.4) * 10 * thermalEffect + Math.cos(y * 0.7) * 20 + (seededRandom * 14 - 7);
      },
      'pacific': () => {
        const jetStreamEffect = Math.min(1, y / 8);
        return 25 * jetStreamEffect + (z * 1.5) + Math.sin(y * 0.4) * 25 + (seededRandom * 16 - 8);
      },
      'plains': () => (x - z) * 1.2 + Math.cos(y * 0.6) * 16 + (seededRandom * 25 - 12.5)
    };
    
    return randomFactor + (patterns[pattern] ? patterns[pattern]() : 0);
  },

  getTimeBasedVariation(x, y, z) {
    const timeSeed = AppState.currentDate.getTime() + AppState.currentTime.hour;
    return Math.sin(timeSeed + x * 30 + y * 40 + z * 35) * (5 + y * 2);
  },

  calculateSpeed(pattern, x, y, z) {
    const baseSpeed = 10 + (y * CONSTANTS.WIND_SPEED.BASE_ALTITUDE_FACTOR);
    let speed = baseSpeed;
    
    const hourFactor = Math.sin((AppState.currentTime.hour / 24) * 2 * Math.PI) * 5;
    const dayOfYear = Math.floor((AppState.currentDate - new Date(AppState.currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const seasonalFactor = Math.cos((dayOfYear / 365) * 2 * Math.PI) * 8;
    
    if (Config.settings.hurricaneActive) {
      speed = this.calculateHurricaneSpeed(x, y, z);
    } else if (Config.settings.thunderstormActive) {
      speed += this.calculateThunderstormSpeed(x, y, z);
    }
    
    speed += this.getRegionalSpeedModifier(pattern, x, y, z) + hourFactor + seasonalFactor;
    
    return Math.max(CONSTANTS.WIND_SPEED.MIN, Math.min(CONSTANTS.WIND_SPEED.MAX, speed));
  },

  calculateHurricaneSpeed(x, y, z) {
    const distanceFromCenter = Utils.calculateDistance({ x, z }, Config.settings.hurricanePosition);
    const { EYE_BASE_RADIUS, EYE_RADIUS_SCALE, EYEWALL_OFFSET, SPIRAL_BASE_RADIUS, SPIRAL_RADIUS_SCALE, CATEGORY_WINDS } = CONSTANTS.HURRICANE;
    const eyeRadius = EYE_BASE_RADIUS + (Config.settings.hurricaneIntensity * EYE_RADIUS_SCALE);
    const eyeWallRadius = eyeRadius + EYEWALL_OFFSET;
    const spiralRadius = SPIRAL_BASE_RADIUS + (Config.settings.hurricaneIntensity * SPIRAL_RADIUS_SCALE);
    const maxWind = CATEGORY_WINDS[Config.settings.hurricaneIntensity];
    
    if (distanceFromCenter < eyeRadius) {
      return 5 + Math.random() * 10;
    }
    
    if (distanceFromCenter < eyeWallRadius) {
      const eyeWallIntensity = 1 - ((distanceFromCenter - eyeRadius) / (eyeWallRadius - eyeRadius));
      let speed = maxWind * 0.7 + (maxWind * 0.3 * eyeWallIntensity);
      const turbulence = (Math.sin(x * 3 + y * 2 + z * 2.5) + Math.cos(x * 2 + y * 2.5 + z * 2)) * 20;
      speed += turbulence;
      const verticalProfile = Math.sin((y / 10) * Math.PI);
      return speed * (0.7 + verticalProfile * 0.3);
    }
    
    if (distanceFromCenter < spiralRadius) {
      const bandIntensity = 1 - ((distanceFromCenter - eyeWallRadius) / (spiralRadius - eyeWallRadius));
      let speed = maxWind * 0.3 + (maxWind * 0.4 * bandIntensity);
      const bandVariation = Math.sin(distanceFromCenter * 1.5 + Date.now() * 0.001) * 15;
      const feederBandEffect = Math.cos(distanceFromCenter * 0.8) * 10;
      return speed + bandVariation + feederBandEffect;
    }
    
    let speed = 10 + (y * 2.5);
    if (y > 8) {
      const outflowIntensity = Math.exp(-(distanceFromCenter - spiralRadius) / 4);
      speed += outflowIntensity * 25;
    } else {
      const inflowIntensity = Math.exp(-(distanceFromCenter - spiralRadius) / 6);
      speed += inflowIntensity * 15;
    }
    return Math.max(5, speed);
  },

  calculateThunderstormSpeed(x, y, z) {
    const distanceFromStorm = Utils.calculateDistance({ x, z }, Config.settings.thunderstormPosition);
    const stormInfluence = Math.exp(-distanceFromStorm / 4);
    const verticalDevelopment = Math.sin((y / 10) * Math.PI) * 30;
    const turbulence = (Math.sin(x * 2.5 + y * 1.8 + z * 2.2) + Math.cos(x * 1.8 + y * 2.2 + z * 1.5)) * 15;
    const stormEffect = (verticalDevelopment + turbulence) * stormInfluence;
    
    let additionalSpeed = stormEffect;
    if (distanceFromStorm < 3 && y > 2) {
      additionalSpeed = Math.max(additionalSpeed, 60 + (Math.random() * 20));
    }
    
    return additionalSpeed;
  },

  getRegionalSpeedModifier(pattern, x, y, z) {
    const timeSeed = AppState.currentDate.getTime() + AppState.currentTime.hour;
    const seededRandom = (Math.sin(timeSeed + x * 1000 + y * 100 + z * 10) + 1) / 2;
    
    const patterns = {
      'nor_easter': () => (x + 10) * 1.8 + Math.sin(z * 0.4) * 8 + (seededRandom * 18 - 9),
      'gulf_stream': () => Math.sin((z + 10) * 0.3) * 12 + (seededRandom * 16 - 8),
      'continental': () => Math.cos(x * 0.6) * Math.sin(z * 0.5) * 15 + (seededRandom * 22 - 11),
      'desert': () => {
        const thermalEffect = Math.abs(x) + Math.abs(z);
        const thermalBoost = AppState.currentTime.hour >= 10 && AppState.currentTime.hour <= 16 ? 8 : 0;
        return thermalEffect * 0.8 + Math.sin(y * 0.4) * 10 + (seededRandom * 14 - 7) + thermalBoost;
      },
      'pacific': () => (10 - x) * 2.0 + Math.cos(y * 0.3) * 6 + (seededRandom * 16 - 8),
      'plains': () => Math.sin((x + z) * 0.4) * 12 + (seededRandom * 25 - 12.5)
    };
    
    return patterns[pattern] ? patterns[pattern]() : 0;
  }
}; 