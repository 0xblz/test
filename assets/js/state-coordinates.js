// === STATE COORDINATES ===
const StateCoordinates = {
  'Alabama': { center: [32.806671, -86.791130], zoom: 7 },
  'Alaska': { center: [61.370716, -152.404419], zoom: 4 },
  'Arizona': { center: [33.729759, -111.431221], zoom: 7 },
  'Arkansas': { center: [34.969704, -92.373123], zoom: 7 },
  'California': { center: [36.116203, -119.681564], zoom: 6 },
  'Colorado': { center: [39.059811, -105.311104], zoom: 7 },
  'Connecticut': { center: [41.597782, -72.755371], zoom: 8 },
  'Delaware': { center: [39.318523, -75.507141], zoom: 8 },
  'Florida': { center: [27.766279, -81.686783], zoom: 7 },
  'Georgia': { center: [33.040619, -83.643074], zoom: 7 },
  'Hawaii': { center: [21.094318, -157.498337], zoom: 7 },
  'Idaho': { center: [44.240459, -114.478828], zoom: 6 },
  'Illinois': { center: [40.349457, -88.986137], zoom: 7 },
  'Indiana': { center: [39.849426, -86.258278], zoom: 7 },
  'Iowa': { center: [42.011539, -93.210526], zoom: 7 },
  'Kansas': { center: [38.526600, -96.726486], zoom: 7 },
  'Kentucky': { center: [37.668140, -84.670067], zoom: 7 },
  'Louisiana': { center: [31.169546, -91.867805], zoom: 7 },
  'Maine': { center: [44.693947, -69.381927], zoom: 7 },
  'Maryland': { center: [39.063946, -76.802101], zoom: 8 },
  'Massachusetts': { center: [42.230171, -71.530106], zoom: 8 },
  'Michigan': { center: [43.326618, -84.536095], zoom: 7 },
  'Minnesota': { center: [45.694454, -93.900192], zoom: 7 },
  'Mississippi': { center: [32.741646, -89.678696], zoom: 7 },
  'Missouri': { center: [38.456085, -92.288368], zoom: 7 },
  'Montana': { center: [46.921925, -110.454353], zoom: 6 },
  'Nebraska': { center: [41.125370, -98.268082], zoom: 7 },
  'Nevada': { center: [38.313515, -117.055374], zoom: 6 },
  'New Hampshire': { center: [43.452492, -71.563896], zoom: 8 },
  'New Jersey': { center: [40.298904, -74.521011], zoom: 8 },
  'New Mexico': { center: [34.840515, -106.248482], zoom: 7 },
  'New York': { center: [42.165726, -74.948051], zoom: 7 },
  'North Carolina': { center: [35.630066, -79.806419], zoom: 7 },
  'North Dakota': { center: [47.528912, -99.784012], zoom: 7 },
  'Ohio': { center: [40.388783, -82.764915], zoom: 7 },
  'Oklahoma': { center: [35.565342, -96.928917], zoom: 7 },
  'Oregon': { center: [44.572021, -122.070938], zoom: 6 },
  'Pennsylvania': { center: [40.590752, -77.209755], zoom: 7 },
  'Rhode Island': { center: [41.680893, -71.511780], zoom: 9 },
  'South Carolina': { center: [33.856892, -80.945007], zoom: 7 },
  'South Dakota': { center: [44.299782, -99.438828], zoom: 7 },
  'Tennessee': { center: [35.747845, -86.692345], zoom: 7 },
  'Texas': { center: [31.054487, -97.563461], zoom: 6 },
  'Utah': { center: [40.150032, -111.862434], zoom: 7 },
  'Vermont': { center: [44.045876, -72.710686], zoom: 8 },
  'Virginia': { center: [37.769337, -78.169968], zoom: 7 },
  'Washington': { center: [47.400902, -121.490494], zoom: 7 },
  'West Virginia': { center: [38.491226, -80.954453], zoom: 7 },
  'Wisconsin': { center: [44.268543, -89.616508], zoom: 7 },
  'Wyoming': { center: [42.755966, -107.302490], zoom: 7 }
};

// Function to calculate square bounds from center point
function calculateSquareBounds(center, size) {
  // Size in degrees - adjust based on latitude to maintain square shape
  const latSize = size;
  const lngSize = size / Math.cos(center[0] * Math.PI / 180);
  
  return [
    [center[0] - latSize/2, center[1] - lngSize/2], // Southwest
    [center[0] + latSize/2, center[1] + lngSize/2]  // Northeast
  ];
}

// Function to get state data with square bounds
function getStateData(stateName) {
  const state = StateCoordinates[stateName];
  if (!state) return null;
  
  // Calculate bounds size based on zoom level
  // Smaller zoom = larger area
  const sizeMap = {
    4: 20,   // Alaska
    6: 10,   // Large states
    7: 5,    // Medium states
    8: 2.5,  // Small states
    9: 1.25  // Rhode Island
  };
  
  const boundsSize = sizeMap[state.zoom] || 5;
  const bounds = calculateSquareBounds(state.center, boundsSize);
  
  return {
    center: state.center,
    zoom: state.zoom,
    bounds: bounds,
    // Use the closest matching wind pattern based on location
    windPattern: determineWindPattern(state.center)
  };
}

// Function to determine wind pattern based on location
function determineWindPattern(center) {
  const [lat, lng] = center;
  
  // Pacific coast
  if (lng < -120) return 'pacific';
  
  // Northeast
  if (lat > 40 && lng > -85) return 'nor_easter';
  
  // Southeast and Gulf Coast
  if (lat < 35 && lng > -90) return 'gulf_stream';
  
  // Great Plains
  if (lng > -105 && lng < -90) return 'plains';
  
  // Southwest
  if (lat < 40 && lng < -105) return 'desert';
  
  // Default to continental
  return 'continental';
} 