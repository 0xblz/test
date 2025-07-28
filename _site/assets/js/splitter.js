// === SPLITTER FUNCTIONALITY ===
const Splitter = {
  isDragging: false,
  startX: 0,
  startY: 0,
  startMapWidth: 0,
  startMapHeight: 0,
  resizeTimeout: null,
  
  init() {
    const splitter = document.getElementById('splitter');
    if (!splitter) return;
    
    splitter.addEventListener('mousedown', this.startDrag.bind(this));
    splitter.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
    
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
    
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    document.addEventListener('touchend', this.stopDrag.bind(this));
  },
  
  startDrag(event) {
    event.preventDefault();
    this.isDragging = true;
    
    const mapPanel = document.getElementById('map-panel');
    const isMobile = window.innerWidth <= 768;
    
    console.log('Starting drag - isMobile:', isMobile, 'window width:', window.innerWidth);
    
    if (isMobile) {
      this.startY = event.type === 'mousedown' ? event.clientY : event.touches[0].clientY;
      this.startMapHeight = mapPanel.offsetHeight;
      console.log('Mobile drag start - startY:', this.startY, 'startMapHeight:', this.startMapHeight);
    } else {
      this.startX = event.type === 'mousedown' ? event.clientX : event.touches[0].clientX;
      this.startMapWidth = mapPanel.offsetWidth;
      console.log('Desktop drag start - startX:', this.startX, 'startMapWidth:', this.startMapWidth);
    }
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isMobile ? 'ns-resize' : 'ew-resize';
  },
  
  drag(event) {
    if (!this.isDragging) return;
    event.preventDefault();
    
    const mapPanel = document.getElementById('map-panel');
    const canvasPanel = document.getElementById('canvas-panel');
    const container = document.getElementById('app-container');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Vertical resizing for mobile
      const currentY = event.type === 'mousemove' ? event.clientY : event.touches[0].clientY;
      const deltaY = currentY - this.startY;
      const newHeight = this.startMapHeight + deltaY;
      const containerHeight = container.offsetHeight;
      
      // Enforce minimum heights
      const minHeight = 150;
      const maxHeight = containerHeight - minHeight - 4; // 4px for splitter
      
      console.log('Mobile drag - currentY:', currentY, 'deltaY:', deltaY, 'newHeight:', newHeight, 'containerHeight:', containerHeight);
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        const heightPercentage = (newHeight / containerHeight) * 100;
        console.log('Setting height to:', heightPercentage + '%');
        mapPanel.style.setProperty('height', `${heightPercentage}%`, 'important');
        // Canvas panel will flex to fill remaining space
      } else {
        console.log('Height out of bounds - min:', minHeight, 'max:', maxHeight, 'attempted:', newHeight);
      }
    } else {
      // Horizontal resizing for desktop
      const currentX = event.type === 'mousemove' ? event.clientX : event.touches[0].clientX;
      const deltaX = currentX - this.startX;
      const newWidth = this.startMapWidth + deltaX;
      const containerWidth = container.offsetWidth;
      
      // Enforce minimum widths
      const minWidth = 200;
      const maxWidth = containerWidth - minWidth - 4; // 4px for splitter
      
      console.log('Desktop drag - currentX:', currentX, 'deltaX:', deltaX, 'newWidth:', newWidth, 'containerWidth:', containerWidth);
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        const widthPercentage = (newWidth / containerWidth) * 100;
        console.log('Setting width to:', widthPercentage + '%');
        mapPanel.style.setProperty('width', `${widthPercentage}%`, 'important');
        // Canvas panel will flex to fill remaining space
      } else {
        console.log('Width out of bounds - min:', minWidth, 'max:', maxWidth, 'attempted:', newWidth);
      }
    }
    
    // Throttle resize events during drag
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => this.notifyResize(), 16); // ~60fps
  },
  
  stopDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Clear any pending resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Final comprehensive resize
    setTimeout(() => {
      this.notifyResize();
      // Additional render frame to ensure everything is properly centered
      if (AppState.renderer && AppState.scene && AppState.camera) {
        AppState.renderer.render(AppState.scene, AppState.camera);
      }
    }, 10);
  },
  
  notifyResize() {
    // Notify Leaflet map to resize
    if (AppState.leafletMap) {
      AppState.leafletMap.invalidateSize();
    }
    
    // Notify Three.js renderer to resize and recenter
    if (AppState.renderer && AppState.camera) {
      const canvasPanel = document.getElementById('canvas-panel');
      const rect = canvasPanel.getBoundingClientRect();
      
      // Update camera aspect ratio
      AppState.camera.aspect = rect.width / rect.height;
      AppState.camera.updateProjectionMatrix();
      
      // Resize renderer
      AppState.renderer.setSize(rect.width, rect.height);
      AppState.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Update controls if they exist
      if (AppState.controls) {
        AppState.controls.update();
      }
      
      // Force a render to show changes immediately
      if (AppState.scene) {
        AppState.renderer.render(AppState.scene, AppState.camera);
      }
    }
    
    // Update wind arrow positions if visible
    if (Config.settings.showWindArrows && AppState.selectedFlightLevel !== null && SelectionManager.updateArrowPositions) {
      SelectionManager.updateArrowPositions();
    }
  }
}; 