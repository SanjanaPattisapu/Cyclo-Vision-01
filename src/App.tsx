import React, { useState, useRef } from 'react';
import { Upload, RotateCcw, Sparkles, AlertCircle, Eye, Activity, Wind, Thermometer, Gauge, CloudRain } from 'lucide-react';
import { CycloneParameters, PredictionResult, ImageAnalysisData } from './types';
import { extractImageFeatures, analyzeCyclone } from './services/predictionService';

// Three distinct satellite presets for one-click testing
const SCENARIO_PRESETS = [
  {
    id: 'scenario-1',
    name: 'Scenario 1: Non-Cyclone / Weak Disturbance',
    label: 'Scenario 1 (Normal / Weak)',
    filename: 'satellite_non_cyclone_normal.svg',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%230f1c2b"/><circle cx="200" cy="200" r="180" fill="%2314273b"/><path d="M40,160 Q120,130 200,160 T360,160" fill="none" stroke="%23334d6b" stroke-width="6"/><path d="M60,240 Q150,220 240,240 T370,230" fill="none" stroke="%23334d6b" stroke-width="4"/><ellipse cx="140" cy="180" rx="35" ry="15" fill="%23718096" opacity="0.4"/><ellipse cx="270" cy="220" rx="45" ry="18" fill="%23718096" opacity="0.35"/><text x="200" y="370" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">CALM SEA / NON-CYCLONIC SCAN</text></svg>`,
    params: {
      windSpeed: '24',
      seaSurfaceTemperature: '26.2',
      atmosphericPressure: '1010',
      windDirection: '95',
      latitude: '11.5',
      longitude: '83.2',
      rainfall: '14',
    },
  },
  {
    id: 'scenario-2',
    name: 'Scenario 2: Developing Cyclonic Storm',
    label: 'Scenario 2 (Moderate Cyclone)',
    filename: 'satellite_cyclone_developing.svg',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%2313202e"/><circle cx="200" cy="200" r="170" fill="%231c2e42"/><path d="M200,80 A120,120 0 0,1 320,200 A120,120 0 0,1 200,320 A60,60 0 0,1 140,260 A60,60 0 0,1 200,200" fill="none" stroke="%23CBD5E1" stroke-width="32" stroke-linecap="round"/><path d="M200,110 A90,90 0 0,1 290,200 A90,90 0 0,1 200,290" fill="none" stroke="%23E2E8F0" stroke-width="18" stroke-linecap="round"/><circle cx="200" cy="200" r="16" fill="%2313202e"/><text x="200" y="370" font-family="sans-serif" font-size="12" fill="%23E2E8F0" text-anchor="middle">DEVELOPING VORTEX SCAN</text></svg>`,
    params: {
      windSpeed: '75',
      seaSurfaceTemperature: '28.8',
      atmosphericPressure: '988',
      windDirection: '230',
      latitude: '14.8',
      longitude: '86.5',
      rainfall: '85',
    },
  },
  {
    id: 'scenario-3',
    name: 'Scenario 3: Intense Severe Cyclone',
    label: 'Scenario 3 (Intense Cyclone)',
    filename: 'satellite_cyclone_severe_eye.svg',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%230c141f"/><circle cx="200" cy="200" r="185" fill="%23182638"/><path d="M200,50 A150,150 0 0,1 350,200 A150,150 0 0,1 200,350 A150,150 0 0,1 50,200 A150,150 0 0,1 200,50" fill="none" stroke="%23F8FAFC" stroke-width="48" stroke-linecap="round"/><path d="M200,90 A110,110 0 0,1 310,200 A110,110 0 0,1 200,310 A110,110 0 0,1 90,200" fill="none" stroke="%23FFFFFF" stroke-width="36" stroke-linecap="round"/><circle cx="200" cy="200" r="48" fill="%23E98272" opacity="0.85"/><circle cx="200" cy="200" r="22" fill="%230c141f"/><circle cx="200" cy="200" r="6" fill="%23FFFFFF"/><text x="200" y="370" font-family="sans-serif" font-size="12" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">INTENSE EYEWALL VORTEX</text></svg>`,
    params: {
      windSpeed: '160',
      seaSurfaceTemperature: '30.5',
      atmosphericPressure: '935',
      windDirection: '310',
      latitude: '18.2',
      longitude: '89.1',
      rainfall: '220',
    },
  },
];

const INITIAL_PARAMETERS: CycloneParameters = {
  windSpeed: '75',
  seaSurfaceTemperature: '28.8',
  atmosphericPressure: '988',
  windDirection: '230',
  latitude: '14.8',
  longitude: '86.5',
  rainfall: '85',
};

export default function App() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [extractedFeatures, setExtractedFeatures] = useState<ImageAnalysisData | null>(null);
  const [parameters, setParameters] = useState<CycloneParameters>(INITIAL_PARAMETERS);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Process and extract features whenever an image is loaded
  const processImage = async (dataUrl: string, name: string) => {
    setImagePreview(dataUrl);
    setImageName(name);
    const features = await extractImageFeatures(dataUrl);
    setExtractedFeatures(features);
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await processImage(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await processImage(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select a preset scenario
  const handleSelectScenario = async (scenario: typeof SCENARIO_PRESETS[0]) => {
    await processImage(scenario.svgData, scenario.filename);
    setParameters(scenario.params);
    // Clear previous prediction when switching scenarios so user clicks Predict
    setPrediction(null);
  };

  // Handle input changes
  const handleInputChange = (field: keyof CycloneParameters, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Run dynamic analysis and prediction
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      // Use extracted features or analyze the image directly
      let features = extractedFeatures;
      if (!features && imagePreview) {
        features = await extractImageFeatures(imagePreview);
        setExtractedFeatures(features);
      }

      // Call the dynamic image-dependent prediction function
      const result = await analyzeCyclone(features || imagePreview, parameters);
      setPrediction(result);

      // Smooth scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset all fields
  const handleReset = () => {
    setImagePreview(null);
    setImageName('');
    setExtractedFeatures(null);
    setParameters({
      windSpeed: '',
      seaSurfaceTemperature: '',
      atmosphericPressure: '',
      windDirection: '',
      latitude: '',
      longitude: '',
      rainfall: '',
    });
    setPrediction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#3D2B27] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-[#EADCCE] py-6 px-4 shadow-xs">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2B27]">
            Cyclo<span className="text-[#E98272]">Vision</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#7A6661] mt-1">
            AI-Powered Cyclone Prediction
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* SATELLITE IMAGE UPLOAD */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
              Satellite Image Upload
            </h2>
            <span className="text-xs text-[#7A6661] font-medium">
              JPG, PNG, TIFF, or SVG Satellite Scans
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7A6661] mb-5">
            Upload storm imagery. The system analyzes actual image brightness, contrast, and cloud density for prediction.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="satellite-upload-input"
          />

          {/* Large Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[220px] ${
              imagePreview
                ? 'border-[#E98272] bg-[#FAF5EF]/50'
                : 'border-[#EADCCE] bg-[#FAF5EF] hover:border-[#E98272]'
            }`}
          >
            {imagePreview ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="max-w-xs w-full aspect-square rounded-xl overflow-hidden border border-[#EADCCE] bg-white shadow-xs p-1">
                  <img
                    src={imagePreview}
                    alt="Satellite Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#3D2B27] truncate max-w-xs">
                    {imageName || 'Selected Satellite Image'}
                  </p>
                  {extractedFeatures && (
                    <p className="text-[11px] text-[#7A6661] mt-0.5">
                      Extracted: {extractedFeatures.cloudCoverage} cloud cover • {extractedFeatures.brightness} brightness
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-[#E98272] hover:text-[#D97363] underline underline-offset-2 cursor-pointer inline-block"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#EADCCE] flex items-center justify-center text-[#E98272] shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3D2B27]">
                    Upload Satellite Image
                  </h3>
                  <p className="text-xs text-[#7A6661] mt-0.5">
                    Drag and drop your satellite image here, or click browse
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-[#E98272] hover:bg-[#D97363] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Browse Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Scenario Test Presets */}
          <div className="mt-5 pt-4 border-t border-[#EADCCE]">
            <p className="text-xs font-bold text-[#7A6661] mb-2.5">
              Quick Test Scenarios (Instant image & parameter load):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SCENARIO_PRESETS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario)}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                    imageName === scenario.filename
                      ? 'border-[#E98272] bg-white font-bold shadow-xs text-[#E98272]'
                      : 'border-[#EADCCE] bg-[#FAF5EF] hover:bg-white text-[#3D2B27]'
                  }`}
                >
                  <span className="block font-bold">{scenario.label}</span>
                  <span className="block text-[11px] text-[#7A6661] mt-0.5">
                    {scenario.params.windSpeed} km/h • {scenario.params.atmosphericPressure} hPa
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CYCLONE PARAMETERS */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27] mb-1">
            Cyclone Parameters
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6661] mb-6">
            Enter in-situ meteorological measurements. Values will be fused with the uploaded image analysis.
          </p>

          <form onSubmit={handlePredict} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Wind Speed */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Wind Speed (km/h)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 145"
                  value={parameters.windSpeed}
                  onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Sea Surface Temperature */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Sea Surface Temperature (°C)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 29.1"
                  value={parameters.seaSurfaceTemperature}
                  onChange={(e) => handleInputChange('seaSurfaceTemperature', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Atmospheric Pressure */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Atmospheric Pressure (hPa)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 950"
                  value={parameters.atmosphericPressure}
                  onChange={(e) => handleInputChange('atmosphericPressure', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Wind Direction */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Wind Direction (°)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 285"
                  value={parameters.windDirection}
                  onChange={(e) => handleInputChange('windDirection', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15.2"
                  value={parameters.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 82.4"
                  value={parameters.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>

              {/* Rainfall */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Rainfall (mm)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 120"
                  value={parameters.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
              </div>
            </div>

            {/* Action Buttons: Predict Cyclone & Reset */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E98272] hover:bg-[#D97363] disabled:opacity-75 text-white font-extrabold text-sm sm:text-base shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing Inputs...' : 'Predict Cyclone'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5EBE1] text-[#7A6661] font-semibold text-sm border border-[#EADCCE] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </section>

        {/* PREDICTION RESULT & ANALYSIS SECTIONS */}
        {prediction && (
          <div ref={resultRef} className="space-y-8">
            
            {/* 1. IMAGE ANALYSIS DETAILS */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EADCCE]">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#E98272]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#3D2B27]">
                    Image Analysis
                  </h3>
                </div>
                <span className="text-xs text-[#7A6661] font-medium">
                  Optical Feature Extraction
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Image Brightness
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.imageAnalysis.brightness}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Image Contrast
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.imageAnalysis.contrast}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Cloud Coverage Estimate
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.imageAnalysis.cloudCoverage}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Image Quality
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#3D2B27] truncate block">
                    {prediction.imageAnalysis.imageQuality}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. ENVIRONMENTAL ANALYSIS DETAILS */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EADCCE]">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#E98272]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#3D2B27]">
                    Environmental Analysis
                  </h3>
                </div>
                <span className="text-xs text-[#7A6661] font-medium">
                  In-situ Meteorological Metrics
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Wind Speed
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.environmentalAnalysis.windSpeed}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    SST
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.environmentalAnalysis.sst}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Pressure
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.environmentalAnalysis.pressure}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Rainfall
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                    {prediction.environmentalAnalysis.rainfall}
                  </span>
                </div>
              </div>
            </section>

            {/* 3. PREDICTION RESULT */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-[#EADCCE]">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
                    Prediction
                  </h2>
                  <p className="text-xs text-[#7A6661] mt-0.5">
                    Fused optical-meteorological assessment
                  </p>
                </div>
                <span className="inline-block self-start sm:self-auto px-3 py-1 rounded-full bg-[#FAF5EF] text-[#E98272] border border-[#EADCCE] text-xs font-bold uppercase tracking-wider">
                  Demo Prediction
                </span>
              </div>

              {/* Simple Result Card Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cyclone Status */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Cyclone Status:
                  </span>
                  <span className="text-lg font-extrabold text-[#3D2B27]">
                    {prediction.cycloneStatus}
                  </span>
                </div>

                {/* Classification */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Classification:
                  </span>
                  <span className="text-lg font-extrabold text-[#E98272]">
                    {prediction.classification}
                  </span>
                </div>

                {/* Predicted Wind Speed */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Predicted Wind Speed:
                  </span>
                  <span className="text-lg font-extrabold text-[#3D2B27]">
                    {prediction.predictedWindSpeed}
                  </span>
                </div>

                {/* Demo Confidence */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Demo Confidence:
                  </span>
                  <span className="text-lg font-extrabold text-[#3D2B27]">
                    {prediction.confidence}
                  </span>
                </div>

                {/* Development Stage */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Development Stage:
                  </span>
                  <span className="text-lg font-extrabold text-[#3D2B27]">
                    {prediction.development}
                  </span>
                </div>

                {/* Risk Level */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Risk Level:
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-lg text-white font-extrabold text-sm ${
                    prediction.riskLevel === 'Extreme' || prediction.riskLevel === 'Severe'
                      ? 'bg-[#C9685B]'
                      : prediction.riskLevel === 'High'
                      ? 'bg-[#E98272]'
                      : prediction.riskLevel === 'Moderate'
                      ? 'bg-[#E29377]'
                      : 'bg-[#5B8266]'
                  }`}>
                    {prediction.riskLevel}
                  </span>
                </div>
              </div>
            </section>

            {/* 4. DASHBOARD */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm space-y-8">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
                  Dashboard
                </h2>
                <p className="text-xs text-[#7A6661] mt-0.5">
                  Core parameters and chronological intensity projection
                </p>
              </div>

              {/* 4 Small Dashboard Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-center">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Wind Speed
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#3D2B27]">
                    {prediction.predictedWindSpeed}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-center">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Pressure
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#3D2B27]">
                    {prediction.pressure}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-center">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    SST
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#3D2B27]">
                    {prediction.sst}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-center">
                  <span className="text-xs font-bold text-[#7A6661] block mb-1">
                    Confidence
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#E98272]">
                    {prediction.confidence}
                  </span>
                </div>
              </div>

              {/* One Simple Coral Line Chart: Cyclone Intensity Trend */}
              <div className="pt-4 border-t border-[#EADCCE]">
                <h3 className="text-base font-bold text-[#3D2B27] mb-4">
                  Cyclone Intensity Trend
                </h3>

                {/* Clean Responsive SVG Chart */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 500 200" className="w-full min-w-[340px] h-48 select-none">
                      {/* Grid lines */}
                      <line x1="40" y1="30" x2="460" y2="30" stroke="#EADCCE" strokeDasharray="3,3" strokeWidth="1" />
                      <line x1="40" y1="80" x2="460" y2="80" stroke="#EADCCE" strokeDasharray="3,3" strokeWidth="1" />
                      <line x1="40" y1="130" x2="460" y2="130" stroke="#EADCCE" strokeDasharray="3,3" strokeWidth="1" />
                      <line x1="40" y1="160" x2="460" y2="160" stroke="#EADCCE" strokeWidth="1.5" />

                      {/* Line Path */}
                      {(() => {
                        const speeds = prediction.trendData.map((d) => d.windSpeed);
                        const min = Math.max(0, Math.min(...speeds) - 15);
                        const max = Math.max(...speeds) + 20;
                        const range = max - min || 1;

                        const pts = prediction.trendData.map((d, i) => {
                          const x = 70 + i * 85;
                          const y = 160 - ((d.windSpeed - min) / range) * 120;
                          return { x, y, speed: d.windSpeed, time: d.time };
                        });

                        const pathStr = pts.reduce(
                          (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
                          ''
                        );

                        return (
                          <>
                            {/* Coral Line */}
                            <path
                              d={pathStr}
                              fill="none"
                              stroke="#E98272"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Data points & text labels */}
                            {pts.map((pt, i) => (
                              <g key={i}>
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill="#FFFFFF"
                                  stroke="#E98272"
                                  strokeWidth="2.5"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 10}
                                  textAnchor="middle"
                                  className="text-[10px] font-extrabold fill-[#3D2B27]"
                                >
                                  {pt.speed} km/h
                                </text>
                                <text
                                  x={pt.x}
                                  y="180"
                                  textAnchor="middle"
                                  className="text-[11px] font-medium fill-[#7A6661]"
                                >
                                  {pt.time}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <p className="text-center text-[11px] text-[#7A6661] mt-2 font-medium">
                    Wind Speed Trend (km/h) across chronological observation intervals
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-[#EADCCE] bg-white py-6 px-4 mt-12 text-center text-xs text-[#7A6661]">
        <p>
          CycloVision — Tropical Cyclone Intelligence Prototype
        </p>
        <p className="text-[11px] text-[#7A6661]/80 mt-1">
          Developed with a Coral & Beige theme • Client-side Demonstration Interface
        </p>
      </footer>
    </div>
  );
}
