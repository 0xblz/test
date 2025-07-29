# 3D Wind Vector Visualization

A sophisticated web application that provides interactive 3D visualization of atmospheric wind patterns across the United States, combining real-time geographic mapping with complex meteorological modeling.

## 🌪️ Features

### Core Visualization
- **3D Wind Grid**: 10 flight levels (FL050-FL500) with color-coded wind speed cubes
- **Interactive Flight Levels**: Click to select and inspect specific altitudes
- **Wind Direction Arrows**: Optional vectors showing wind direction and intensity
- **Geographic Integration**: All 50 US states with accurate coordinate mapping
- **Split-Panel Interface**: Leaflet map (left) ↔ Three.js 3D scene (right)

### Weather Simulations
- **Hurricane Modeling**: Physics-based simulation with eye, eyewall, and spiral bands
  - 5 intensity categories (Cat 1-5)
  - Dynamic positioning and intensity control
- **Thunderstorm Simulation**: Core updrafts, rotation, and turbulence modeling
- **Regional Wind Patterns**: 6 distinct patterns based on geographic location
  - Pacific, Gulf Stream, Continental, Desert, Plains, Nor'easter

### Interactive Controls
- **Real-time Parameter Adjustment**: dat.GUI interface for all settings
- **Time Controls**: Date/time picker affecting wind calculations
- **Map Styles**: OpenStreetMap, Satellite, Terrain options
- **Mobile Responsive**: Touch-optimized with vertical layout on mobile


## 🏗️ Technical Architecture

### Frontend Stack
- **Jekyll**: Static site generator with Liquid templating
- **Three.js**: 3D graphics engine with WebGL rendering
- **Leaflet.js**: Interactive mapping library
- **dat.GUI**: Real-time control interface
- **SCSS**: Modular CSS preprocessing

### JavaScript Architecture
```
app.js                 → Main application coordinator
├── constants.js       → Configuration & settings
├── wind-calculator.js → Atmospheric physics engine
├── wind-generator.js  → 3D cube generation & management
├── scene-manager.js   → Three.js scene setup & rendering
├── map-manager.js     → Leaflet map integration
├── ui-manager.js      → GUI controls & user interface
├── event-handlers.js  → Mouse/touch interaction handling
├── utils.js          → Shared utility functions
├── state-coordinates.js → US state geographic data
├── animation-loop.js  → Render loop management
└── splitter.js       → Panel resizing functionality
```

## 📁 Project Structure

```
/
├── _config.yml           # Jekyll configuration
├── _layouts/
│   └── default.html      # Main HTML template
├── _sass/
│   ├── _default.scss     # Base styles & variables
│   └── _custom.scss      # Application-specific styles
├── assets/
│   ├── css/
│   │   └── main.scss     # Main stylesheet entry
│   └── js/               # JavaScript modules (see architecture above)
├── index.html            # Main application page
├── Gemfile              # Ruby dependencies
└── _site/               # Generated static site (ignored in git)
```

## 🧠 Wind Physics Engine

### Multi-layered Calculations
- **Altitude Effects**: Wind patterns vary by flight level (50-500 FL)
- **Regional Patterns**: Geographic-specific behaviors based on location
- **Storm Dynamics**: Physics-based hurricane and thunderstorm modeling
- **Temporal Variations**: Hour-of-day and seasonal factors
- **Turbulence**: Realistic random variations and chaotic effects

### Hurricane Physics
- **Eye Region**: Calm center with radius based on intensity
- **Eyewall**: Maximum winds with pulsing visual effects
- **Spiral Bands**: Decreasing intensity with distance from center
- **Upper Outflow**: High-altitude wind patterns above storm

## 🎮 User Interaction

### 3D Scene Controls
- **Mouse/Touch**: Orbit camera controls (OrbitControls)
- **Hover**: Detailed tooltips with wind data and coordinates
- **Click**: Flight level selection and deselection
- **Scroll**: Zoom in/out of 3D scene

### Interface Controls
- **State Selector**: Choose from 50 US states
- **Map Style**: Toggle between map visualizations
- **Storm Toggles**: Enable/disable weather simulations
- **Time Controls**: Navigate dates and times
- **Display Options**: Opacity, arrows, background settings

## 🔧 Development Notes

### Key Constants (assets/js/constants.js)
- `GRID`: 3D grid configuration (size, spacing, range)
- `FLIGHT_LEVELS`: Altitude definitions (50-500 FL)
- `COLORS`: Wind speed and storm color schemes
- `HURRICANE`/`WIND_SPEED`: Physics parameters

### Performance Considerations
- Arrow position updates throttled to every 3 frames
- Distance-based cube opacity for performance
- Tile-based map texture loading with fallbacks
- Mobile-optimized touch event handling

### Browser Compatibility
- WebGL support required for 3D graphics
- Modern ES6+ JavaScript features
- Responsive design for mobile devices
- Cross-browser tested (Chrome, Firefox, Safari, Edge)

## 🤖 AI Assistant Notes

### Project Understanding
This is a **meteorological visualization tool** combining 3D graphics with geographic mapping. The core purpose is educational/professional demonstration of atmospheric wind patterns.

### Key Technical Concepts
- **Three.js Scene Management**: Camera, renderer, controls, lighting setup
- **Atmospheric Physics**: Complex wind calculations with multiple influencing factors
- **Geographic Mapping**: Coordinate transformations between 3D space and lat/lng
- **Real-time Interactivity**: Event handling, GUI controls, responsive updates

### Common Modification Patterns
1. **Adding New States**: Update `state-coordinates.js` with center/bounds/zoom
2. **New Wind Patterns**: Extend functions in `wind-calculator.js`
3. **Visual Enhancements**: Modify `scene-manager.js` for 3D elements
4. **UI Changes**: Update `ui-manager.js` for controls and `_custom.scss` for styling
5. **Map Features**: Extend `map-manager.js` for Leaflet functionality

### Debugging Tips
- Check browser console for Three.js/WebGL errors
- Verify wind cube generation in `WindGenerator.generateGrid()`
- Monitor performance with browser dev tools
- Test mobile responsiveness with device emulation

### Code Quality Notes
- Modular architecture with clear separation of concerns
- Extensive use of ES6+ features (arrow functions, destructuring, modules)
- Consistent naming conventions (PascalCase for managers, camelCase for methods)
- Well-documented physics calculations with inline comments

### Extension Opportunities
- **Data Integration**: Connect to real meteorological APIs
- **Advanced Physics**: Add more atmospheric phenomena (jet streams, fronts)
- **Export Features**: Save visualizations as images or data
- **Multi-language**: Internationalization support
- **VR/AR**: WebXR integration for immersive experiences

### Performance Optimization Areas
- **Instanced Rendering**: For large numbers of wind cubes
- **Level-of-Detail**: Reduce complexity at distance
- **Web Workers**: Offload wind calculations
- **Texture Atlasing**: Optimize map tile loading
- **Shader Optimization**: Custom materials for better performance

---

**Demo Status**: This is currently a demonstration/educational tool with simulated data. For production use with real meteorological data, API integration would be required.