// === EVENT HANDLERS ===
const EventHandlers = {
  init() {
    const canvas = AppState.renderer.domElement;
    
    // Mouse and touch events
    const events = [
      ['mousemove', this.onMouseMove], ['mousedown', this.onMouseDown], 
      ['mouseup', this.onMouseUp], ['click', this.onMouseClick],
      ['touchstart', this.onTouchStart], ['touchmove', this.onTouchMove], ['touchend', this.onTouchEnd]
    ];
    
    events.forEach(([event, handler]) => {
      const options = event.startsWith('touch') ? { passive: false } : undefined;
      canvas.addEventListener(event, handler.bind(this), options);
    });
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('blur', this.onWindowBlur.bind(this));
  },

  updateMousePosition(clientX, clientY) {
    const canvas = AppState.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    AppState.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    AppState.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  },

  onMouseMove(event) {
    if (AppState.miniMap.isResizing) return;
    this.updateMousePosition(event.clientX, event.clientY);
    this.handleHover(event);
  },

  onMouseDown(event) {
    AppState.mouseDownPosition = { x: event.clientX, y: event.clientY };
    AppState.isDragging = false;
  },

  onMouseUp(event) {
    const deltaX = Math.abs(event.clientX - AppState.mouseDownPosition.x);
    const deltaY = Math.abs(event.clientY - AppState.mouseDownPosition.y);
    AppState.isDragging = deltaX > 5 || deltaY > 5;
  },

  onMouseClick(event) {
    if (AppState.miniMap.isResizing || AppState.isDragging) return;
    this.updateMousePosition(event.clientX, event.clientY);
    this.handleClick();
  },

  onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      AppState.mouseDownPosition = { x: touch.clientX, y: touch.clientY };
      AppState.isDragging = false;
    }
  },

  onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
      this.handleHover(event);
    }
  },

  onTouchEnd(event) {
    event.preventDefault();
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - AppState.mouseDownPosition.x);
      const deltaY = Math.abs(touch.clientY - AppState.mouseDownPosition.y);
      AppState.isDragging = deltaX > 5 || deltaY > 5;
      
      if (!AppState.isDragging) {
        this.updateMousePosition(touch.clientX, touch.clientY);
        this.handleClick();
      }
      
      UIManager.hideTooltip();
      AppState.isHovering = false;
    }
  },

  onWindowResize() {
    const canvas = AppState.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    AppState.camera.aspect = rect.width / rect.height;
    AppState.camera.updateProjectionMatrix();
    AppState.renderer.setSize(rect.width, rect.height);
    
    if (Config.settings.showWindArrows && AppState.selectedFlightLevel !== null) {
      SelectionManager.updateArrowPositions();
    }
  },

  onWindowBlur() {
    // Handle any cleanup when window loses focus
  },

  handleHover(event) {
    AppState.raycaster.setFromCamera(AppState.mouse, AppState.camera);
    const intersects = AppState.raycaster.intersectObjects(AppState.windCubes);
    
    if (intersects.length > 0) {
      const hoveredCube = intersects[0].object;
      console.log('Hovered cube - yLevel:', hoveredCube.userData.yLevel, 'position.y:', hoveredCube.position.y, 'flightLevel:', hoveredCube.userData.flightLevel);
      
      let cubeToShow = hoveredCube;
      
      if (AppState.selectedFlightLevel !== null) {
        const targetCube = AppState.windCubes.find(cube => 
          cube.position.x === hoveredCube.position.x && 
          cube.position.z === hoveredCube.position.z && 
          cube.userData.yLevel === AppState.selectedFlightLevel
        );
        if (targetCube) cubeToShow = targetCube;
      }
      
      AppState.isHovering = true;
      AppState.renderer.domElement.style.cursor = 'pointer';
      UIManager.showTooltip(cubeToShow, event.clientX, event.clientY);
      
      if (AppState.selectedFlightLevel === null) {
        this.applyHoverEffects(hoveredCube.userData.yLevel);
      }
    } else {
      this.handleHoverEnd();
    }
  },

  handleHoverEnd() {
    AppState.isHovering = false;
    AppState.renderer.domElement.style.cursor = 'move';
    UIManager.hideTooltip();
    
    if (AppState.selectedFlightLevel === null) {
      AppState.windArrows.forEach(arrow => arrow.style.display = 'none');
      // Clear hover effects on left map
      MapManager.clearHoverEffects();
    }
  },

  applyHoverEffects(hoveredYLevel) {
    console.log('Hover effects for yLevel:', hoveredYLevel);
    
    AppState.windCubes.forEach(cube => {
      cube.material.opacity = cube.userData.yLevel === hoveredYLevel ? 0.4 : Config.settings.cubeOpacity;
    });
    
    AppState.windArrows.forEach(arrow => {
      const shouldShow = Config.settings.showWindArrows && arrow.userData.yLevel === hoveredYLevel;
      arrow.style.display = shouldShow ? 'block' : 'none';
    });
    
    if (Config.settings.showWindArrows) {
      SelectionManager.updateArrowPositions();
    }
    
    // Show wind cubes on the left map for the hovered flight level
    console.log('Calling addWindCubesToMap with yLevel:', hoveredYLevel);
    MapManager.addWindCubesToMap(hoveredYLevel);
  },

  handleClick() {
    AppState.raycaster.setFromCamera(AppState.mouse, AppState.camera);
    const intersects = AppState.raycaster.intersectObjects(AppState.windCubes);
    
    if (intersects.length > 0) {
      const clickedCube = intersects[0].object;
      const clickedYLevel = clickedCube.userData.yLevel;
      
      if (AppState.selectedFlightLevel === clickedYLevel) {
        SelectionManager.deselectFlightLevel();
      } else {
        SelectionManager.selectFlightLevel(clickedYLevel);
      }
    }
  }
}; 