export interface CycloneParameters {
  windSpeed: string;
  seaSurfaceTemperature: string;
  atmosphericPressure: string;
  windDirection: string;
  latitude: string;
  longitude: string;
  rainfall: string;
}

export interface ImageAnalysisData {
  brightness: string;
  contrast: string;
  cloudCoverage: string;
  imageQuality: string;
  rawBrightness: number;
  rawContrast: number;
  rawCloudCoverage: number;
  dimensions: string;
}

export interface EnvironmentalAnalysisData {
  windSpeed: string;
  sst: string;
  pressure: string;
  rainfall: string;
  windDirection: string;
  coordinates: string;
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
  trendData: {
    time: string;
    windSpeed: number;
  }[];
}
