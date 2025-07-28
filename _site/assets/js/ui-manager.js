// === UI MANAGEMENT ===
const UIManager = {
  init() {
    this.createGUI();
    this.createTooltip();
    TimeControls.updateDisplay();
  },

  createTooltip() {
    AppState.tooltip = document.createElement('div');
    AppState.tooltip.id = 'tooltip';
    document.body.appendChild(AppState.tooltip);
  },

  showTooltip(cube, clientX, clientY) {
    const stateData = getStateData(Config.settings.state);
    const bounds = stateData.bounds;
    const normalizedX = Utils.normalizeGridPosition(cube.position.x);
    const normalizedZ = Utils.normalizeGridPosition(cube.position.z);
    
    const lat = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (1 - normalizedZ);
    const lon = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * normalizedX;
    
    const windDir = cube.userData.windDirection;
    const windAngle = Math.atan2(windDir.z, windDir.x) * 180 / Math.PI;
    const windDirection = ((windAngle + 360) % 360).toFixed(0);
    
    const latStr = Math.abs(lat).toFixed(2) + '°' + (lat >= 0 ? 'N' : 'S');
    const lonStr = Math.abs(lon).toFixed(2) + '°' + (lon >= 0 ? 'E' : 'W');
    
    AppState.tooltip.innerHTML = `FL${String(cube.userData.flightLevel).padStart(3, '0')}<br/>Wind: ${cube.userData.speed} kt @ ${windDirection}°<br/>${latStr} ${lonStr}`;
    AppState.tooltip.className = 'visible';
    AppState.tooltip.style.left = (clientX + 10) + 'px';
    AppState.tooltip.style.top = (clientY - 10) + 'px';
  },

  hideTooltip() {
    AppState.tooltip.className = '';
  },

  createGUI() {
    AppState.gui = new dat.GUI();
    AppState.gui.width = 300;
    
    // Add status display at the top
    const statusController = AppState.gui.add({ status: 'Simulated Data' }, 'status')
      .name('Status')
      .listen();
    
    // Make the status field read-only
    const statusInput = statusController.domElement.querySelector('input');
    statusInput.readOnly = true;
    statusInput.style.opacity = '0.7';
    statusInput.style.cursor = 'default';
    
    AppState.gui.add(Config.settings, 'state', Object.keys(StateCoordinates))
      .name('US State')
      .onChange(StateManager.updateState.bind(StateManager));
    
    AppState.gui.add(Config.settings, 'mapStyle', ['OpenStreetMap', 'Satellite', 'Terrain'])
      .name('Map Style')
      .onChange(MapManager.updateStyle.bind(MapManager));
    
    this.createOptionsFolder();
    this.createSimulationsFolder();
    this.createTimeFolder();
  },

  createOptionsFolder() {
    const optionsFolder = AppState.gui.addFolder('Options');
    
    optionsFolder.add(Config.settings, 'darkBackground')
      .name('Dark Background')
      .onChange(SceneManager.updateBackgroundColor.bind(SceneManager));
    
    optionsFolder.add(Config.settings, 'showWindArrows')
      .name('Wind Direction')
      .onChange(SelectionManager.toggleWindArrows.bind(SelectionManager));
    
    optionsFolder.add(Config.settings, 'cubeOpacity', 0.01, 0.3)
      .name('Cube Opacity')
      .onChange(this.updateCubeOpacity.bind(this));
  },

  createSimulationsFolder() {
    const simulationsFolder = AppState.gui.addFolder('Simulations');
    
    simulationsFolder.add(Config.settings, 'thunderstormActive')
      .name('Thunderstorm')
      .onChange(this.onStormToggle.bind(this, 'thunderstorm'));
    
    simulationsFolder.add(Config.settings, 'hurricaneActive')
      .name('Hurricane')
      .onChange(this.onStormToggle.bind(this, 'hurricane'));
    
    simulationsFolder.add(Config.settings, 'hurricaneIntensity', 1, 5, 1)
      .name('Hurricane Category')
      .onChange(this.onHurricaneIntensityChange.bind(this));
    
    simulationsFolder.add({ randomizeWind: () => this.randomizeWind() }, 'randomizeWind')
      .name('Randomize Wind');
  },

  createTimeFolder() {
    const timeFolder = AppState.gui.addFolder('Date & Time');
    TimeControls.createDateController(timeFolder);
    TimeControls.createTimeController(timeFolder);
  },

  onStormToggle(stormType, value) {
    const positionKey = stormType === 'hurricane' ? 'hurricanePosition' : 'thunderstormPosition';
    if (value) {
      Config.settings[positionKey] = Utils.getRandomPosition();
    }
    WindGenerator.regenerate();
  },

  onHurricaneIntensityChange() {
    if (Config.settings.hurricaneActive) {
      WindGenerator.regenerate();
    }
  },

  randomizeWind() {
    if (Config.settings.thunderstormActive) {
      Config.settings.thunderstormPosition = Utils.getRandomPosition();
    }
    
    if (Config.settings.hurricaneActive) {
      Config.settings.hurricanePosition = Utils.getRandomPosition();
    }
    
    const randomHourOffset = Math.floor(Math.random() * 24);
    const randomDayOffset = Math.floor(Math.random() * 30);
    
    const originalTime = { ...AppState.currentTime };
    const originalDate = new Date(AppState.currentDate);
    
    AppState.currentTime.hour = (AppState.currentTime.hour + randomHourOffset) % 24;
    AppState.currentDate.setDate(AppState.currentDate.getDate() + randomDayOffset);
    
    WindGenerator.regenerate();
    
    AppState.currentTime = originalTime;
    AppState.currentDate = originalDate;
    TimeControls.updateDisplay();
  },

  updateCubeOpacity() {
    if (!AppState.isHovering && AppState.selectedFlightLevel === null) {
      AppState.windCubes.forEach(cube => {
        cube.material.opacity = Config.settings.cubeOpacity;
      });
    } else if (AppState.selectedFlightLevel !== null) {
      AppState.windCubes.forEach(cube => {
        if (cube.userData.yLevel !== AppState.selectedFlightLevel) {
          cube.material.opacity = Config.settings.cubeOpacity;
        }
      });
    }
  }
};

// === TIME CONTROLS ===
const TimeControls = {
  updateDisplay() {
    Config.settings.currentDate = Utils.formatDate(AppState.currentDate);
    Config.settings.currentTime = Utils.formatTime(AppState.currentTime);
    AppState.gui?.updateDisplay();
  },

  changeDate(days) {
    const newDate = new Date(AppState.currentDate);
    newDate.setDate(newDate.getDate() + days);
    AppState.currentDate = newDate;
    this.updateDisplay();
    WindGenerator.regenerate();
  },

  changeTime(hours) {
    AppState.currentTime.hour += hours;
    
    if (AppState.currentTime.hour >= 24) {
      AppState.currentTime.hour = 0;
      this.changeDate(1);
      return;
    } else if (AppState.currentTime.hour < 0) {
      AppState.currentTime.hour = 23;
      this.changeDate(-1);
      return;
    }
    
    this.updateDisplay();
    WindGenerator.regenerate();
  },

  createDateController(folder) {
    const dateController = folder.add(Config.settings, 'currentDate').name('Date').listen();
    const dateRow = dateController.domElement.parentElement.parentElement;
    
    this.setupNavigationRow(dateRow, () => this.changeDate(-1), () => this.changeDate(1));
    
    const dateInput = dateController.domElement.querySelector('input');
    Utils.applyElementStyles(dateInput, { readOnly: true, textAlign: 'center', width: '100%' });
    dateInput.parentElement.style.width = '120px';
  },

  createTimeController(folder) {
    const timeController = folder.add(Config.settings, 'currentTime').name('Time').listen();
    const timeRow = timeController.domElement.parentElement.parentElement;
    
    this.setupNavigationRow(timeRow, () => this.changeTime(-1), () => this.changeTime(1));
    
    const timeInput = timeController.domElement.querySelector('input');
    Utils.applyElementStyles(timeInput, { readOnly: true, textAlign: 'center', width: '100%' });
    timeInput.parentElement.style.width = '120px';
  },

  setupNavigationRow(row, prevCallback, nextCallback) {
    Utils.applyElementStyles(row, { display: 'flex', alignItems: 'center', gap: '8px' });
    
    const label = row.querySelector('.property-name');
    row.insertBefore(label, row.firstChild);
    
    const buttonsContainer = document.createElement('div');
    Utils.applyElementStyles(buttonsContainer, { display: 'flex', gap: '4px' });
    
    const prevBtn = this.createNavButton('←', prevCallback);
    const nextBtn = this.createNavButton('→', nextCallback);
    
    buttonsContainer.appendChild(prevBtn);
    buttonsContainer.appendChild(nextBtn);
    row.appendChild(buttonsContainer);
  },

  createNavButton(text, callback) {
    const button = document.createElement('button');
    button.className = 'nav-button';
    button.textContent = text;
    button.onclick = callback;
    return button;
  }
}; 

// === STATE MANAGEMENT ===
const StateManager = {
  updateState(stateName) {
    Config.settings.state = stateName;
    const stateData = getStateData(stateName);
    if (!stateData) return;
    
    MapManager.updateState(stateData);
    WindGenerator.regenerate();
  }
}; 