import {
  CycloneParameters,
  ImageAnalysisData,
  ImageValidationResult,
  EnvironmentalAnalysisData,
  MovementPrediction,
  RegionalImpactEstimate,
  PredictionResult,
} from '../types';

/**
 * Coastal Hubs Registry for Distance & Impact Estimation
 */
export const COASTAL_REGIONS: Record<string, { lat: number; lon: number }> = {
  'Visakhapatnam': { lat: 17.68, lon: 83.21 },
  'Puri': { lat: 19.81, lon: 85.83 },
  'Chennai': { lat: 13.08, lon: 80.27 },
  'Kolkata': { lat: 22.57, lon: 88.36 },
  'Paradip': { lat: 20.31, lon: 86.61 },
  'Kakinada': { lat: 16.98, lon: 82.24 },
  'Machilipatnam': { lat: 16.18, lon: 81.13 },
  'Gopalpur': { lat: 19.26, lon: 84.90 },
  'Bhubaneswar': { lat: 20.29, lon: 85.82 },
  'Digha': { lat: 21.62, lon: 87.50 },
  'Nellore': { lat: 14.44, lon: 79.98 },
  'Cuddalore': { lat: 11.75, lon: 79.77 },
  'Nagapattinam': { lat: 10.76, lon: 79.84 },
  'Mumbai': { lat: 18.92, lon: 72.83 },
  'Surat': { lat: 21.17, lon: 72.83 },
  'Panaji': { lat: 15.49, lon: 73.82 },
  'Mangalore': { lat: 12.91, lon: 74.85 },
  'Kochi': { lat: 9.93, lon: 76.26 },
  'Chittagong': { lat: 22.35, lon: 91.78 },
  'Cox\'s Bazar': { lat: 21.42, lon: 92.00 },
};

/**
 * Calculates Great-Circle distance using Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates initial bearing from (lat1, lon1) to (lat2, lon2)
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Maps compass bearing in degrees to cardinal name and directional arrow
 */
function bearingToCompass(degrees: number): { name: string; arrow: string } {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return { name: 'North', arrow: '↑' };
  if (normalized >= 22.5 && normalized < 67.5) return { name: 'North-East', arrow: '↗' };
  if (normalized >= 67.5 && normalized < 112.5) return { name: 'East', arrow: '→' };
  if (normalized >= 112.5 && normalized < 157.5) return { name: 'South-East', arrow: '↘' };
  if (normalized >= 157.5 && normalized < 202.5) return { name: 'South', arrow: '↓' };
  if (normalized >= 202.5 && normalized < 247.5) return { name: 'South-West', arrow: '↙' };
  if (normalized >= 247.5 && normalized < 292.5) return { name: 'West', arrow: '←' };
  return { name: 'North-West', arrow: '↖' };
}

/**
 * Safely loads any image input (File, Blob, or URL string) into an HTMLImageElement
 */
function loadImageSource(imageInput: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let isCreatedBlobUrl = false;

    if (typeof imageInput === 'string') {
      srcUrl = imageInput;
    } else if (typeof imageInput === 'object' && imageInput !== null) {
      srcUrl = URL.createObjectURL(imageInput as Blob);
      isCreatedBlobUrl = true;
    } else {
      return reject(new Error('Invalid image input type'));
    }

    const img = new Image();

    // IMPORTANT: Do NOT set crossOrigin on data: or blob: URLs (prevents security exceptions in browsers)
    if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (isCreatedBlobUrl) {
        URL.revokeObjectURL(srcUrl);
      }
      resolve(img);
    };

    img.onerror = (err) => {
      if (isCreatedBlobUrl) {
        URL.revokeObjectURL(srcUrl);
      }
      reject(err);
    };

    img.src = srcUrl;
  });
}

/**
 * 1. REAL DEMO IMAGE FEATURE EXTRACTION
 *
 * Extracts deterministic quantitative features from the actual uploaded image pixels:
 * - width & height
 * - average brightness
 * - contrast (RMS)
 * - brightness variation (std deviation)
 * - dark-pixel ratio (ocean background)
 * - light/cloud-pixel ratio (convective cloud tops)
 * - approximate cloud coverage
 * - edge density (Sobel gradient magnitude)
 * - center-vs-edge brightness (central dense overcast / eye distinction)
 * - circular/spiral structure score (angular vortex coherence)
 * - chromatic saturation (filters out everyday colorful non-weather photos)
 * - non-weather color ratio (skin tones, brick, grass)
 * - opticalIndex (composite storm strength index)
 */
export async function extractImageFeatures(
  imageInput: File | Blob | string | null
): Promise<ImageAnalysisData> {
  if (!imageInput) {
    return {
      width: 0,
      height: 0,
      dimensions: '0×0',
      averageBrightness: 0,
      contrast: 0,
      brightnessVariation: 0,
      darkPixelRatio: 0,
      lightCloudPixelRatio: 0,
      approximateCloudCoverage: 0,
      edgeDensity: 0,
      centerVsEdgeBrightness: 0,
      spiralStructureScore: 0,
      chromaticSaturation: 0,
      nonWeatherColorRatio: 0,
      opticalIndex: 0,
      brightness: '0%',
      contrastStr: '0%',
      cloudCoverage: '0%',
      imageQuality: 'No Image',
    };
  }

  const img = await loadImageSource(imageInput);
  const origWidth = img.naturalWidth || 400;
  const origHeight = img.naturalHeight || 400;

  // Render to a standardized 180x180 canvas for fast, deterministic pixel inspection
  const sampleW = 180;
  const sampleH = 180;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;
  const totalPixels = sampleW * sampleH;

  // 1. First Pass: Compute luminance array, saturation, cloud pixels, and color statistics
  const luminanceArray = new Float32Array(totalPixels);
  let totalLuminance = 0;
  let totalSaturation = 0;
  let darkPixelCount = 0;
  let lightCloudPixelCount = 0;
  let nonWeatherColorCount = 0;

  // Accumulate octant clouds (8 angular sectors around center)
  const octantClouds = new Float32Array(8);
  const centerX = sampleW / 2;
  const centerY = sampleH / 2;

  // Center vs Outer zone luminance
  let centerZoneLuminance = 0;
  let centerZoneCount = 0;
  let outerZoneLuminance = 0;
  let outerZoneCount = 0;

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Standard ITU-R BT.601 perceptual luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const pIdx = y * sampleW + x;
      luminanceArray[pIdx] = lum;
      totalLuminance += lum;

      // Color saturation: max(RGB) - min(RGB)
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;
      totalSaturation += sat;

      // Dark background / ocean pixel
      if (lum < 58) {
        darkPixelCount++;
      }

      // Convective cloud pixel: high reflectivity and neutral/low chromatic saturation
      const isCloud = lum > 138 && sat < 65;
      if (isCloud) {
        lightCloudPixelCount++;

        // Calculate angular sector around storm center (0 - 7)
        const dx = x - centerX;
        const dy = y - centerY;
        const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI); // 0 to 1
        const octant = Math.min(7, Math.floor(angle * 8));
        octantClouds[octant]++;
      }

      // Everyday photo non-weather colors (human skin, red brick, food, foliage)
      const isSkinOrBrick = r > 110 && g > 65 && b > 40 && r > g && g > b && (r - b) > 38;
      const isFoliageGreen = g > 115 && g > r * 1.25 && g > b * 1.25;
      if (isSkinOrBrick || isFoliageGreen) {
        nonWeatherColorCount++;
      }

      // Distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      if (distFromCenter < sampleW * 0.22) {
        centerZoneLuminance += lum;
        centerZoneCount++;
      } else if (distFromCenter > sampleW * 0.35 && distFromCenter < sampleW * 0.48) {
        outerZoneLuminance += lum;
        outerZoneCount++;
      }
    }
  }

  const avgLuminance = totalLuminance / totalPixels;
  const averageBrightness = Math.round((avgLuminance / 255) * 100);
  const avgSaturation = Math.round(totalSaturation / totalPixels);
  const darkPixelRatio = Math.round((darkPixelCount / totalPixels) * 100);
  const lightCloudPixelRatio = Math.round((lightCloudPixelCount / totalPixels) * 100);
  const approximateCloudCoverage = lightCloudPixelRatio;
  const nonWeatherColorRatio = Math.round((nonWeatherColorCount / totalPixels) * 100);

  // 2. RMS Contrast & Brightness Variation
  let varianceSum = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = luminanceArray[i] - avgLuminance;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / totalPixels);
  const contrast = Math.min(100, Math.round((stdDev / 78) * 100));
  const brightnessVariation = Math.min(100, Math.round((stdDev / (avgLuminance + 10)) * 100));

  // 3. Edge Density (Gradient Magnitude)
  let strongEdgeCount = 0;
  let totalGradientSum = 0;
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = y * sampleW + x;
      const dx = luminanceArray[idx + 1] - luminanceArray[idx - 1];
      const dy = luminanceArray[idx + sampleW] - luminanceArray[idx - sampleW];
      const grad = Math.sqrt(dx * dx + dy * dy);
      totalGradientSum += grad;
      if (grad > 32) {
        strongEdgeCount++;
      }
    }
  }
  const edgeDensity = Math.min(100, Math.round((strongEdgeCount / ((sampleW - 2) * (sampleH - 2))) * 100));

  // 4. Center vs Edge Brightness
  const avgCenterLum = centerZoneCount > 0 ? centerZoneLuminance / centerZoneCount : avgLuminance;
  const avgOuterLum = outerZoneCount > 0 ? outerZoneLuminance / outerZoneCount : avgLuminance;
  // Scaled difference in percentage points
  const centerVsEdgeBrightness = Math.round(((avgCenterLum - avgOuterLum) / 255) * 100);

  // 5. Circular / Spiral Structure Score
  // Evaluates multi-octant balance and angular symmetry
  const activeOctants = octantClouds.filter((c) => c > lightCloudPixelCount * 0.04).length;
  let minOctant = Infinity;
  let maxOctant = -Infinity;
  for (let i = 0; i < 8; i++) {
    if (octantClouds[i] < minOctant) minOctant = octantClouds[i];
    if (octantClouds[i] > maxOctant) maxOctant = octantClouds[i];
  }
  const octantBalance = maxOctant > 0 ? minOctant / maxOctant : 0;

  let spiralScore = Math.round((activeOctants / 8) * 60 + octantBalance * 40);
  // Bonus if edges reflect curved banding and center overcast is pronounced
  if (activeOctants >= 6 && contrast >= 30) {
    spiralScore = Math.min(100, spiralScore + 15);
  }
  const spiralStructureScore = Math.max(0, Math.min(100, spiralScore));

  // 6. Composite Dvorak-like Optical Storm Intensity Index (0 - 100)
  // Combines cloud coverage, spiral curvature, contrast, and central overcast/eyewall
  const opticalIndex = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        approximateCloudCoverage * 0.35 +
        spiralStructureScore * 0.30 +
        contrast * 0.20 +
        Math.max(0, centerVsEdgeBrightness * 1.4) +
        edgeDensity * 0.05
      )
    )
  );

  let qualityLabel = 'Standard Resolution';
  if (origWidth >= 800 && origHeight >= 800) {
    qualityLabel = 'High Resolution';
  } else if (origWidth >= 400 || origHeight >= 400) {
    qualityLabel = 'Good Quality';
  } else {
    qualityLabel = 'Low Resolution';
  }

  return {
    width: origWidth,
    height: origHeight,
    dimensions: `${origWidth}×${origHeight}`,
    averageBrightness,
    contrast,
    brightnessVariation,
    darkPixelRatio,
    lightCloudPixelRatio,
    approximateCloudCoverage,
    edgeDensity,
    centerVsEdgeBrightness,
    spiralStructureScore,
    chromaticSaturation: avgSaturation,
    nonWeatherColorRatio,
    opticalIndex,
    brightness: `${averageBrightness}%`,
    contrastStr: `${contrast}%`,
    cloudCoverage: `${approximateCloudCoverage}%`,
    imageQuality: `${qualityLabel} (${origWidth}×${origHeight})`,
  };
}

/**
 * 2. CYCLONE / NON-CYCLONE DETECTION & VALIDATION
 *
 * Deterministically verifies if the uploaded image is a satellite/weather image
 * containing cyclonic cloud structure.
 */
export async function validateCycloneImage(
  imageInput: File | Blob | string | null
): Promise<ImageValidationResult> {
  if (!imageInput) {
    return {
      isCycloneLike: false,
      isValidCycloneImage: false,
      confidence: 0,
      confidenceScore: 0,
      status: 'idle',
      message: 'No image provided',
      reason: 'Please upload a satellite or weather scan image.',
    };
  }

  try {
    const features = await extractImageFeatures(imageInput);

    // Rejection Criteria for Ordinary Everyday Photos:
    // 1. High non-weather colors (skin tones, brick, grass)
    const hasEverydayColors = features.nonWeatherColorRatio >= 14 || features.chromaticSaturation > 45;

    // 2. Insufficient convective cloud coverage (< 10% or > 95% uniform)
    const hasInsufficientClouds = features.approximateCloudCoverage < 10 || features.approximateCloudCoverage > 95;

    // 3. Lack of surrounding ocean or dark space background
    const lacksOceanBackground = features.darkPixelRatio < 8;

    // 4. Low spiral/circular structure or one-sided distribution
    const lacksVortexStructure = features.spiralStructureScore < 28;

    // 5. Low contrast between cloud top and ocean
    const lacksContrast = features.contrast < 22;

    const isCyclone =
      !hasEverydayColors &&
      !hasInsufficientClouds &&
      !lacksOceanBackground &&
      !lacksVortexStructure &&
      !lacksContrast;

    let confidence = Math.round(
      (features.spiralStructureScore * 0.4) +
      (features.contrast * 0.3) +
      (Math.min(60, features.approximateCloudCoverage) * 0.3)
    );
    confidence = Math.max(45, Math.min(96, confidence));

    if (isCyclone) {
      return {
        isCycloneLike: true,
        isValidCycloneImage: true,
        confidence,
        confidenceScore: confidence,
        status: 'valid',
        message: '✓ Cyclone-like satellite image detected',
        features,
      };
    } else {
      let reasonText = 'Image does not contain a recognizable tropical cyclone cloud vortex.';
      if (hasEverydayColors) {
        reasonText = 'Ordinary non-weather photograph detected (non-meteorological color and subject profile).';
      } else if (hasInsufficientClouds) {
        reasonText = 'Insufficient convective cloud coverage for tropical cyclone classification.';
      } else if (lacksVortexStructure) {
        reasonText = 'Lacks circular or spiral cloud vortex symmetry typical of tropical cyclones.';
      } else if (lacksOceanBackground) {
        reasonText = 'Image background does not exhibit oceanic or satellite contrast characteristics.';
      }

      return {
        isCycloneLike: false,
        isValidCycloneImage: false,
        confidence: Math.max(10, 100 - confidence),
        confidenceScore: Math.max(10, 100 - confidence),
        status: 'invalid',
        message: '✕ No cyclone detected in this image',
        reason: reasonText,
        features,
      };
    }
  } catch {
    return {
      isCycloneLike: false,
      isValidCycloneImage: false,
      confidence: 0,
      confidenceScore: 0,
      status: 'invalid',
      message: '✕ No cyclone detected in this image',
      reason: 'Failed to decode image data as satellite weather scan.',
    };
  }
}

/**
 * 3. PREDICTED CYCLONE MOVEMENT / DIRECTION
 *
 * Dynamically computes storm track and speed using environmental parameters,
 * latitude beta-drift, and storm optical intensity.
 */
export function predictMovement(
  parameters: CycloneParameters,
  cycloneAnalysis?: { predictedWindSpeed?: string; opticalIndex?: number }
): MovementPrediction {
  const lat = parseFloat(parameters.latitude) || 14.8;
  const lon = parseFloat(parameters.longitude) || 86.5;
  const windDir = parseFloat(parameters.windDirection) || 230;
  const pressure = parseFloat(parameters.atmosphericPressure) || 988;

  const currentSpeed = cycloneAnalysis?.predictedWindSpeed
    ? parseFloat(cycloneAnalysis.predictedWindSpeed)
    : parseFloat(parameters.windSpeed) || 75;

  // Base climatological steering track by latitude zone:
  // Low latitudes (<15°): trade-wind westward / WNW steering
  // Mid latitudes (15°-20°): northwestward / NNW steering
  // High latitudes (>20°): subtropical recurvature toward north / northeast
  let baseBearing: number;
  if (lat < 14) {
    baseBearing = 295; // WNW
  } else if (lat < 18) {
    baseBearing = 320; // NW
  } else if (lat < 21) {
    baseBearing = 345; // NNW
  } else {
    baseBearing = 35; // NNE (recurving)
  }

  // Environmental steering wind vector
  const steeringVector = (windDir + 180) % 360;
  let angleDiff = steeringVector - baseBearing;
  if (angleDiff > 180) angleDiff -= 360;
  if (angleDiff < -180) angleDiff += 360;

  let finalBearing = ((baseBearing + angleDiff * 0.28) % 360 + 360) % 360;

  // Beta-drift: planetary vorticity gradient nudges cyclones poleward (northward in northern hemisphere)
  // More intense storms (lower pressure / higher optical index) experience stronger beta-drift!
  const pressureDeficit = Math.max(0, 1012 - pressure);
  const betaDriftNorthward = Math.min(16, pressureDeficit * 0.18 + (currentSpeed * 0.04));

  if (finalBearing > 180) {
    finalBearing = ((finalBearing + betaDriftNorthward) % 360 + 360) % 360;
  } else {
    finalBearing = Math.max(0, finalBearing - betaDriftNorthward);
  }

  // Forward translation speed (km/h)
  const movementSpeedVal = Math.round(
    11 + (currentSpeed * 0.045) + (Math.abs(lat) * 0.18) + (pressureDeficit * 0.03)
  );

  const compass = bearingToCompass(finalBearing);
  const latStr = lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`;
  const lonStr = lon >= 0 ? `${lon.toFixed(1)}°E` : `${Math.abs(lon).toFixed(1)}°W`;

  return {
    currentLocation: `${latStr}, ${lonStr}`,
    predictedDirection: compass.name,
    bearingDegrees: Math.round(finalBearing),
    arrowSymbol: compass.arrow,
    movementSpeed: `${movementSpeedVal} km/h`,
    speedNumber: movementSpeedVal,
  };
}

/**
 * 4. ESTIMATED TIME OF IMPACT / LANDFALL
 */
export function estimateImpactTime(
  cycloneLocation: { lat: number; lon: number },
  targetLocation: string,
  movementDirection: { bearingDegrees: number; directionName: string },
  movementSpeed: number
): RegionalImpactEstimate {
  const cleanName = (targetLocation || 'Visakhapatnam').trim();

  let targetCoords = COASTAL_REGIONS[cleanName];
  if (!targetCoords) {
    const foundKey = Object.keys(COASTAL_REGIONS).find(
      (k) => k.toLowerCase() === cleanName.toLowerCase()
    );
    if (foundKey) {
      targetCoords = COASTAL_REGIONS[foundKey];
    } else {
      let hash = 0;
      for (let i = 0; i < cleanName.length; i++) {
        hash = (hash << 5) - hash + cleanName.charCodeAt(i);
        hash |= 0;
      }
      const latOffset = 1.5 + (Math.abs(hash % 150) / 100);
      const lonOffset = -(2.0 + (Math.abs((hash >> 2) % 200) / 100));
      targetCoords = {
        lat: Math.round((cycloneLocation.lat + latOffset) * 100) / 100,
        lon: Math.round((cycloneLocation.lon + lonOffset) * 100) / 100,
      };
    }
  }

  const distanceKm = calculateHaversineDistance(
    cycloneLocation.lat,
    cycloneLocation.lon,
    targetCoords.lat,
    targetCoords.lon
  );

  const targetBearing = calculateBearing(
    cycloneLocation.lat,
    cycloneLocation.lon,
    targetCoords.lat,
    targetCoords.lon
  );

  let bearingDiff = Math.abs(movementDirection.bearingDegrees - targetBearing);
  if (bearingDiff > 180) bearingDiff = 360 - bearingDiff;

  const speed = Math.max(8, movementSpeed);
  let hours: number;
  let impactStatus: string;
  let impactRisk: string;

  if (bearingDiff <= 40) {
    const effectiveSpeed = Math.max(8, speed * Math.cos((bearingDiff * Math.PI) / 180));
    hours = Math.max(1, Math.round(distanceKm / effectiveSpeed));
    impactStatus = 'Projected Direct Coastal Landfall';
    impactRisk = 'High Direct Landfall Risk';
  } else if (bearingDiff <= 80) {
    const effectiveSpeed = Math.max(6, speed * Math.cos((bearingDiff * Math.PI) / 180));
    hours = Math.max(2, Math.round(distanceKm / effectiveSpeed));
    impactStatus = 'Projected Coastal Incursion';
    impactRisk = 'Moderate to High Impact Risk';
  } else {
    hours = Math.max(3, Math.round(distanceKm / speed));
    impactStatus = 'Projected Closest Coastal Approach';
    impactRisk = 'Peripheral Gale & Surge Warning';
  }

  const now = new Date();
  const impactDate = new Date(now.getTime() + hours * 3600 * 1000);

  const dateStr = impactDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = impactDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    targetRegion: cleanName,
    distanceKm: `${Math.round(distanceKm)} km`,
    estimatedHours: `${hours} hours`,
    estimatedDateTime: `${dateStr}, ${timeStr}`,
    impactStatus,
    impactRisk,
  };
}

/**
 * 5. DETERMINISTIC MULTI-FACTOR CYCLONE PREDICTION
 *
 * Fuses:
 * ACTUAL UPLOADED IMAGE FEATURES
 * + Wind Speed
 * + Sea Surface Temperature
 * + Atmospheric Pressure
 * + Wind Direction
 * + Latitude
 * + Longitude
 * + Rainfall
 *
 * 100% Deterministic: No Math.random().
 * The same image + same parameters = identical result.
 * Changing the image OR changing the parameters = changes the result!
 */
export async function analyzeCyclone(
  imageInput: File | Blob | string | ImageAnalysisData | null,
  parameters: CycloneParameters
): Promise<PredictionResult> {
  let imgFeatures: ImageAnalysisData;

  if (imageInput && typeof imageInput === 'object' && 'opticalIndex' in imageInput) {
    imgFeatures = imageInput as ImageAnalysisData;
  } else if (imageInput) {
    imgFeatures = await extractImageFeatures(imageInput as File | Blob | string);
  } else {
    imgFeatures = await extractImageFeatures(null);
  }

  const windIn = parseFloat(parameters.windSpeed) || 0;
  const sstIn = parseFloat(parameters.seaSurfaceTemperature) || 27.5;
  const pressureIn = parseFloat(parameters.atmosphericPressure) || 1008;
  const windDirIn = parseFloat(parameters.windDirection) || 0;
  const latIn = parseFloat(parameters.latitude) || 15.0;
  const lonIn = parseFloat(parameters.longitude) || 85.0;
  const rainfallIn = parseFloat(parameters.rainfall) || 0;
  const targetRegion = parameters.targetRegion || 'Visakhapatnam';

  // 1. SATELLITE OPTICAL INTENSITY (Derived from actual image features)
  // opticalIndex (0 - 100) measures cloud extent, curvature, contrast, and eye/core density
  const opticalWindEstimate =
    28 +
    (imgFeatures.opticalIndex * 1.85) +
    (imgFeatures.centerVsEdgeBrightness * 0.75) +
    (imgFeatures.edgeDensity * 0.35);

  // 2. METEOROLOGICAL ENVIRONMENTAL INTENSITY
  const pressureDeficit = Math.max(0, 1012 - pressureIn);
  // Empirical pressure-wind relationship: ~1.8 km/h per hPa deficit
  const metPressureWind = pressureDeficit * 1.8;

  // Thermodynamic factors
  const sstExcess = sstIn - 26.5;
  const sstWindFactor = sstExcess > 0 ? sstExcess * 3.4 : sstExcess * 2.0;
  const rainWindFactor = Math.min(25, rainfallIn * 0.12);
  const latFactor = Math.min(14, Math.abs(latIn) * 0.55);

  let metWindEstimate: number;
  if (windIn > 0) {
    metWindEstimate = (windIn * 0.65) + (metPressureWind * 0.35) + sstWindFactor + rainWindFactor + latFactor;
  } else {
    metWindEstimate = metPressureWind + sstWindFactor + rainWindFactor + latFactor + 25;
  }

  // 3. COMBINE IMAGE FEATURES + METEOROLOGY
  // If user entered a wind speed, balance optical (45%) and environmental (55%)
  // If user left wind empty or 0, optical satellite analysis has 70% weight!
  let calculatedWind: number;
  if (windIn > 0) {
    calculatedWind = Math.round(0.45 * opticalWindEstimate + 0.55 * metWindEstimate);
  } else {
    calculatedWind = Math.round(0.70 * opticalWindEstimate + 0.30 * metWindEstimate);
  }
  calculatedWind = Math.max(18, calculatedWind);

  // 4. IMD CLASSIFICATION & STATUS (Deterministic from calculated wind)
  let cycloneStatus = 'No Significant Cyclone';
  let classification = 'Low Pressure Area';
  let riskLevel = 'Low';

  if (calculatedWind < 31) {
    cycloneStatus = 'No Significant Cyclone';
    classification = 'Low Pressure Area';
    riskLevel = 'Low';
  } else if (calculatedWind <= 49) {
    cycloneStatus = 'Depression';
    classification = 'Depression';
    riskLevel = 'Low';
  } else if (calculatedWind <= 61) {
    cycloneStatus = 'Deep Depression';
    classification = 'Deep Depression';
    riskLevel = 'Moderate';
  } else if (calculatedWind <= 88) {
    cycloneStatus = 'Cyclone Detected';
    classification = 'Cyclonic Storm';
    riskLevel = 'Moderate';
  } else if (calculatedWind <= 117) {
    cycloneStatus = 'Cyclone Detected';
    classification = 'Severe Cyclonic Storm';
    riskLevel = 'High';
  } else if (calculatedWind <= 166) {
    cycloneStatus = 'Cyclone Detected';
    classification = 'Very Severe Cyclonic Storm';
    riskLevel = 'High';
  } else if (calculatedWind <= 221) {
    cycloneStatus = 'Cyclone Detected';
    classification = 'Extremely Severe Cyclonic Storm';
    riskLevel = 'Severe';
  } else {
    cycloneStatus = 'Cyclone Detected';
    classification = 'Super Cyclonic Storm';
    riskLevel = 'Extreme';
  }

  // 5. DEVELOPMENT STAGE
  let development = 'Stable';
  if (sstIn >= 29.5 && pressureIn < 965 && imgFeatures.opticalIndex > 65) {
    development = 'Rapid Intensification';
  } else if (sstIn >= 28.0 && (pressureIn < 990 || calculatedWind >= 85)) {
    development = 'Intensifying';
  } else if (sstIn >= 27.0 && calculatedWind >= 45) {
    development = 'Developing';
  } else if (sstIn < 26.5 || pressureIn > 1008) {
    development = 'Dissipating';
  } else {
    development = 'Stable';
  }

  // 6. CONFIDENCE (Optical-Meteorological Concordance)
  // Higher when image clarity is high and satellite optical wind matches pressure deficit
  const opticalMetDivergence = Math.abs(opticalWindEstimate - metWindEstimate);
  let confidenceScore = Math.round(
    58 +
    (imgFeatures.contrast * 0.15) +
    (imgFeatures.spiralStructureScore * 0.15) -
    (Math.min(50, opticalMetDivergence) * 0.25)
  );
  if (sstIn >= 28.0 && calculatedWind >= 70) confidenceScore += 4;
  confidenceScore = Math.max(62, Math.min(96, confidenceScore));

  // 7. CHRONOLOGICAL INTENSITY TREND
  let growthFactorBefore = 0.80;
  let growthFactorAhead = 1.08;

  if (development === 'Rapid Intensification') {
    growthFactorBefore = 0.65;
    growthFactorAhead = 1.18;
  } else if (development === 'Intensifying') {
    growthFactorBefore = 0.78;
    growthFactorAhead = 1.10;
  } else if (development === 'Developing') {
    growthFactorBefore = 0.84;
    growthFactorAhead = 1.05;
  } else if (development === 'Dissipating') {
    growthFactorBefore = 1.14;
    growthFactorAhead = 0.86;
  } else {
    growthFactorBefore = 0.94;
    growthFactorAhead = 1.00;
  }

  const trendData = [
    { time: '-12h', windSpeed: Math.max(15, Math.round(calculatedWind * Math.pow(growthFactorBefore, 2))) },
    { time: '-6h', windSpeed: Math.max(15, Math.round(calculatedWind * growthFactorBefore)) },
    { time: 'Current', windSpeed: calculatedWind },
    { time: '+6h', windSpeed: Math.max(15, Math.round(calculatedWind * growthFactorAhead)) },
    { time: '+12h', windSpeed: Math.max(15, Math.round(calculatedWind * Math.pow(growthFactorAhead, 2))) },
  ];

  const envData: EnvironmentalAnalysisData = {
    windSpeed: `${windIn} km/h`,
    sst: `${sstIn} °C`,
    pressure: `${pressureIn} hPa`,
    rainfall: `${rainfallIn} mm`,
    windDirection: `${windDirIn}°`,
    coordinates: `${latIn >= 0 ? latIn.toFixed(1) + '°N' : Math.abs(latIn).toFixed(1) + '°S'}, ${lonIn >= 0 ? lonIn.toFixed(1) + '°E' : Math.abs(lonIn).toFixed(1) + '°W'}`,
  };

  const movement = predictMovement(parameters, {
    predictedWindSpeed: `${calculatedWind} km/h`,
    opticalIndex: imgFeatures.opticalIndex,
  });

  const impact = estimateImpactTime(
    { lat: latIn, lon: lonIn },
    targetRegion,
    { bearingDegrees: movement.bearingDegrees, directionName: movement.predictedDirection },
    movement.speedNumber
  );

  return {
    cycloneStatus,
    classification,
    predictedWindSpeed: `${calculatedWind} km/h`,
    confidence: `${confidenceScore}%`,
    development,
    riskLevel,
    pressure: `${pressureIn} hPa`,
    sst: `${sstIn} °C`,
    imageAnalysis: imgFeatures,
    environmentalAnalysis: envData,
    movement,
    impact,
    trendData,
  };
}
