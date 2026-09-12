export interface CycloneParameters {
  windSpeed: string;
  seaSurfaceTemperature: string;
  atmosphericPressure: string;
  windDirection: string;
  latitude: string;
  longitude: string;
  rainfall: string;
  targetRegion?: string;
}

export interface ImageAnalysisData {
  width: number;
  height: number;
  dimensions: string;
  averageBrightness: number; // 0 - 100
  contrast: number; // 0 - 100 (RMS contrast)
  brightnessVariation: number; // 0 - 100 (std dev)
  darkPixelRatio: number; // 0 - 100 (% ocean/background dark pixels)
  lightCloudPixelRatio: number; // 0 - 100 (% convective cloud pixels)
  approximateCloudCoverage: number; // 0 - 100
  edgeDensity: number; // 0 - 100 (high-frequency gradient density)
  centerVsEdgeBrightness: number; // difference indicating central core/eye
  spiralStructureScore: number; // 0 - 100 (vortex/curvature coherence)
  chromaticSaturation: number; // 0 - 100 (colorfulness)
  nonWeatherColorRatio: number; // 0 - 100 (% non-meteorological skin/city/food colors)
  opticalIndex: number; // 0 - 100 (combined optical storm strength)
  // Formatted string representations for UI cards
  brightness: string;
  contrastStr: string;
  cloudCoverage: string;
  imageQuality: string;
}

export interface ImageValidationResult {
  isCycloneLike: boolean;
  isValidCycloneImage: boolean;
  confidence: number;
  confidenceScore: number;
  status: 'valid' | 'invalid' | 'checking' | 'idle';
  message: string;
  reason?: string;
  features?: ImageAnalysisData;
}

export interface EnvironmentalAnalysisData {
  windSpeed: string;
  sst: string;
  pressure: string;
  rainfall: string;
  windDirection: string;
  coordinates: string;
}

export interface MovementPrediction {
  currentLocation: string;
  predictedDirection: string;
  bearingDegrees: number;
  arrowSymbol: string;
  movementSpeed: string;
  speedNumber: number;
}

export interface RegionalImpactEstimate {
  targetRegion: string;
  distanceKm: string;
  estimatedHours: string;
  estimatedDateTime: string;
  impactStatus: string;
  impactRisk: string;
}

export interface PredictionResult {
  cycloneStatus: string;
  classification: string;
  predictedWindSpeed: string;
  confidence: string;
  development: string;
  riskLevel: string;
  pressure: string;
  sst: string;
  imageAnalysis: ImageAnalysisData;
  environmentalAnalysis: EnvironmentalAnalysisData;
  movement: MovementPrediction;
  impact: RegionalImpactEstimate;
  trendData: {
    time: string;
    windSpeed: number;
  }[];
}
