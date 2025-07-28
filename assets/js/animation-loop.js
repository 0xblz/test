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
    
    // Update 3D arrow positions every 3 frames for performance
    this.frameCount++;
    if (Config.settings.showWindArrows && AppState.selectedFlightLevel !== null && this.frameCount % 3 === 0) {
      SelectionManager.updateArrowPositions();
    }
    
    AppState.renderer.render(AppState.scene, AppState.camera);
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
  }
}; 