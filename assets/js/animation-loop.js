// === ANIMATION LOOP ===
const AnimationLoop = {
  frameCount: 0,
  
  start() {
    this.animate();
  },

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    AppState.controls.update();
    
    this.updateCubeOpacity();
    this.animateArrows();
    
    // Update 3D arrow positions every 3 frames for performance
    this.frameCount++;
    if (Config.settings.showWindArrows && AppState.selectedFlightLevel !== null && this.frameCount % 3 === 0) {
      SelectionManager.updateArrowPositions();
    }
    
    AppState.renderer.render(AppState.scene, AppState.camera);
    
    if (AppState.miniMap.renderer && AppState.selectedFlightLevel !== null) {
      AppState.miniMap.renderer.render(AppState.miniMap.scene, AppState.miniMap.camera);
    }
  },

  updateCubeOpacity() {
    if (!AppState.isHovering && AppState.selectedFlightLevel === null) {
      const cameraPosition = AppState.camera.position;
      AppState.windCubes.forEach(cube => {
        const distance = cameraPosition.distanceTo(cube.position);
        const opacity = Math.max(0.02, Math.min(Config.settings.cubeOpacity, (80 - distance) / 80));
        cube.material.opacity = opacity;
      });
    }
  },

  animateArrows() {
    const time = Date.now() * 0.001;
    
    AppState.miniMap.arrows.forEach((arrow, index) => {
      if (!arrow.dataset.baseRotation) {
        const currentTransform = arrow.style.transform;
        const rotateMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
        if (rotateMatch) {
          arrow.dataset.baseRotation = rotateMatch[1];
        }
      }
      
      if (arrow.dataset.baseRotation) {
        const baseRotation = parseFloat(arrow.dataset.baseRotation);
        const oscillation = Math.sin(time * CONSTANTS.ANIMATION.OSCILLATION_SPEED + index * 0.2) * CONSTANTS.ANIMATION.MINI_MAP_OSCILLATION;
        const newRotation = baseRotation + oscillation;
        
        const currentTransform = arrow.style.transform;
        const newTransform = currentTransform.replace(
          /rotate\([^)]+deg\)/,
          `rotate(${newRotation}deg)`
        );
        arrow.style.transform = newTransform;
      }
    });
  }
}; 