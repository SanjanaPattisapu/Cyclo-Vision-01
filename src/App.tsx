import React, { useState, useRef } from 'react';
import {
  Upload,
  RotateCcw,
  Sparkles,
  Eye,
  Activity,
  Compass,
  MapPin,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  CycloneParameters,
  PredictionResult,
  ImageAnalysisData,
  ImageValidationResult,
} from './types';
import {
  validateCycloneImage,
  extractImageFeatures,
  analyzeCyclone,
} from './services/predictionService';

// Quick target region suggestion chips
const POPULAR_TARGET_REGIONS = [
  'Visakhapatnam',
  'Puri',
  'Chennai',
  'Kolkata',
  'Paradip',
];

// Test presets representing distinct image types for instant testing
const SCENARIO_PRESETS = [
  {
    id: 'cyclone-moderate',
    name: 'Developing Cyclonic Storm',
    label: 'Valid Cyclone: Moderate Storm',
    type: 'cyclone',
    filename: 'satellite_cyclone_developing.svg',
    // Realistic multi-quadrant vortex cloud scan on deep ocean
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%230d1a29"/><circle cx="200" cy="200" r="175" fill="%2313263a"/><path d="M200,70 A130,130 0 0,1 330,200 A130,130 0 0,1 200,330 A80,80 0 0,1 120,250 A80,80 0 0,1 200,190" fill="none" stroke="%23CBD5E1" stroke-width="36" stroke-linecap="round"/><path d="M200,105 A95,95 0 0,1 295,200 A95,95 0 0,1 200,295 A50,50 0 0,1 150,220" fill="none" stroke="%23E2E8F0" stroke-width="24" stroke-linecap="round"/><circle cx="200" cy="200" r="28" fill="%230d1a29"/><text x="200" y="375" font-family="sans-serif" font-size="12" fill="%23E2E8F0" text-anchor="middle">SATELLITE SCAN: CYCLONE VORTEX</text></svg>`,
    params: {
      windSpeed: '75',
      seaSurfaceTemperature: '28.8',
      atmosphericPressure: '988',
      windDirection: '230',
      latitude: '14.8',
      longitude: '86.5',
      rainfall: '85',
      targetRegion: 'Visakhapatnam',
    },
  },
  {
    id: 'cyclone-severe',
    name: 'Intense Severe Cyclone',
    label: 'Valid Cyclone: Severe with Eye',
    type: 'cyclone',
    filename: 'satellite_cyclone_severe_eye.svg',
    // Intense eyewall vortex with spiral arms spanning all 4 quadrants
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%230a1320"/><circle cx="200" cy="200" r="185" fill="%23112235"/><path d="M200,50 A150,150 0 0,1 350,200 A150,150 0 0,1 200,350 A150,150 0 0,1 50,200 A150,150 0 0,1 200,50" fill="none" stroke="%23F8FAFC" stroke-width="46" stroke-linecap="round"/><path d="M200,90 A110,110 0 0,1 310,200 A110,110 0 0,1 200,310 A110,110 0 0,1 90,200" fill="none" stroke="%23FFFFFF" stroke-width="34" stroke-linecap="round"/><circle cx="200" cy="200" r="46" fill="%23E98272" opacity="0.8"/><circle cx="200" cy="200" r="22" fill="%230a1320"/><circle cx="200" cy="200" r="6" fill="%23FFFFFF"/><text x="200" y="375" font-family="sans-serif" font-size="12" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">SATELLITE SCAN: SEVERE EYEWALL</text></svg>`,
    params: {
      windSpeed: '160',
      seaSurfaceTemperature: '30.5',
      atmosphericPressure: '935',
      windDirection: '310',
      latitude: '18.2',
      longitude: '89.1',
      rainfall: '220',
      targetRegion: 'Puri',
    },
  },
  {
    id: 'photo-building',
    name: 'Normal Photo (Building & City)',
    label: 'Non-Cyclone: Building Photo',
    type: 'non-cyclone',
    filename: 'photo_building_city.svg',
    // Everyday photograph of an urban building with sky horizon, sharp angles, and warm colors
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="200" fill="%2338bdf8"/><rect y="200" width="400" height="200" fill="%23475569"/><rect x="80" y="100" width="140" height="220" fill="%23b91c1c"/><rect x="240" y="140" width="100" height="180" fill="%23d97706"/><rect x="100" y="120" width="30" height="40" fill="%23fef08a"/><rect x="160" y="120" width="30" height="40" fill="%23fef08a"/><rect x="100" y="180" width="30" height="40" fill="%23fef08a"/><rect x="160" y="180" width="30" height="40" fill="%23fef08a"/><circle cx="60" cy="60" r="30" fill="%23facc15"/><text x="200" y="370" font-family="sans-serif" font-size="12" fill="%23ffffff" text-anchor="middle" font-weight="bold">ORDINARY PHOTO: CITY BUILDING</text></svg>`,
    params: {
      windSpeed: '15',
      seaSurfaceTemperature: '25.0',
      atmosphericPressure: '1013',
      windDirection: '90',
      latitude: '28.6',
      longitude: '77.2',
      rainfall: '0',
      targetRegion: 'Visakhapatnam',
    },
  },
  {
    id: 'photo-landscape',
    name: 'Non-Cyclone (Calm Sea / Landscape)',
    label: 'Non-Cyclone: Calm Sea / Sky',
    type: 'non-cyclone',
    filename: 'photo_calm_sea.svg',
    // Horizon photo with no circular cloud vortex structure
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="220" fill="%230284c7"/><rect y="220" width="400" height="180" fill="%230369a1"/><ellipse cx="200" cy="80" rx="140" ry="25" fill="%23f1f5f9" opacity="0.6"/><ellipse cx="120" cy="140" rx="80" ry="18" fill="%23f1f5f9" opacity="0.5"/><text x="200" y="370" font-family="sans-serif" font-size="12" fill="%23e2e8f0" text-anchor="middle">CALM HORIZON (NO VORTEX)</text></svg>`,
    params: {
      windSpeed: '18',
      seaSurfaceTemperature: '26.0',
      atmosphericPressure: '1011',
      windDirection: '80',
      latitude: '11.0',
      longitude: '82.0',
      rainfall: '5',
      targetRegion: 'Chennai',
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
  targetRegion: 'Visakhapatnam',
};

export default function App() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [extractedFeatures, setExtractedFeatures] = useState<ImageAnalysisData | null>(null);
  const [parameters, setParameters] = useState<CycloneParameters>(INITIAL_PARAMETERS);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const validationSectionRef = useRef<HTMLDivElement | null>(null);

  // Mandatory First Step: Cyclone Image Validation
  const processAndValidateImage = async (dataUrl: string, name: string) => {
    setImagePreview(dataUrl);
    setImageName(name);
    setIsValidating(true);
    setValidationResult({
      isValidCycloneImage: false,
      status: 'checking',
      message: 'Image Analysis: Checking...',
      confidenceScore: 0,
      features: {
        brightness: 0,
        contrast: 0,
        cloudCoverage: 0,
        vortexSymmetry: 0,
        satelliteLikelihood: 0,
        dimensions: 'Checking',
      },
    });

    // Clear any previous prediction whenever a new image is uploaded
    setPrediction(null);
    setExtractedFeatures(null);

    try {
      // Step 1: Run separate deterministic validation function
      const valResult = await validateCycloneImage(dataUrl);
      setValidationResult(valResult);

      if (valResult.isValidCycloneImage) {
        // Step 2: Only if validated, extract optical features for prediction engine
        const features = await extractImageFeatures(dataUrl);
        setExtractedFeatures(features);
      } else {
        // If non-cyclone, clear prediction state completely
        setPrediction(null);
        setExtractedFeatures(null);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await processAndValidateImage(dataUrl, file.name);
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
        await processAndValidateImage(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select a preset scenario
  const handleSelectScenario = async (scenario: typeof SCENARIO_PRESETS[0]) => {
    setParameters(scenario.params);
    await processAndValidateImage(scenario.svgData, scenario.filename);
  };

  // Handle input changes
  const handleInputChange = (field: keyof CycloneParameters, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Run dynamic analysis and prediction (Only permitted if validation passed)
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: Prevent prediction if no image uploaded or image failed validation
    if (!validationResult || !validationResult.isValidCycloneImage) {
      validationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsAnalyzing(true);

    try {
      let features = extractedFeatures;
      if (!features && imagePreview) {
        features = await extractImageFeatures(imagePreview);
        setExtractedFeatures(features);
      }

      // Step 3: Analyze Cyclone with validated image features & parameters
      const result = await analyzeCyclone(features || imagePreview, parameters);
      setPrediction(result);

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
    setValidationResult(null);
    setExtractedFeatures(null);
    setParameters({
      windSpeed: '',
      seaSurfaceTemperature: '',
      atmosphericPressure: '',
      windDirection: '',
      latitude: '',
      longitude: '',
      rainfall: '',
      targetRegion: 'Visakhapatnam',
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
        
        {/* SATELLITE IMAGE UPLOAD & VALIDATION */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
              Satellite Image Upload
            </h2>
            <span className="text-xs text-[#7A6661] font-medium">
              Satellite Scans & Weather Radar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7A6661] mb-5">
            Upload storm imagery. The system automatically inspects whether the image contains a cyclone cloud vortex before running prediction.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="satellite-upload-input"
          />

          {/* Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[220px] ${
              imagePreview
                ? validationResult?.isValidCycloneImage
                  ? 'border-[#E98272] bg-[#FAF5EF]/50'
                  : 'border-[#E29377] bg-[#FFF8F6]'
                : 'border-[#EADCCE] bg-[#FAF5EF] hover:border-[#E98272]'
            }`}
          >
            {imagePreview ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="max-w-xs w-full aspect-square rounded-xl overflow-hidden border border-[#EADCCE] bg-white shadow-xs p-1">
                  <img
                    src={imagePreview}
                    alt="Uploaded Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#3D2B27] truncate max-w-xs">
                    {imageName || 'Selected Image'}
                  </p>
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

          {/* VALIDATION STATUS CARD */}
          {imagePreview && (
            <div ref={validationSectionRef} className="mt-5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADCCE]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A6661]">
                  <ShieldCheck className="w-4 h-4 text-[#E98272]" />
                  <span>Demo Image Validation</span>
                </div>
                <span className="text-[11px] text-[#7A6661]">
                  Step 1: Vortex & Meteorology Gatekeeper
                </span>
              </div>

              {isValidating || validationResult?.status === 'checking' ? (
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#E98272] animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#3D2B27]">
                      Image Analysis: Checking...
                    </p>
                    <p className="text-xs text-[#7A6661] mt-0.5">
                      Verifying cloud coverage, spiral symmetry, and satellite characteristics.
                    </p>
                  </div>
                </div>
              ) : validationResult?.isValidCycloneImage ? (
                <div className="p-4 rounded-xl bg-[#F4F9F4] border border-[#CDE5CD] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-[#1B5E20]">
                      ✓ Cyclone-like satellite image detected
                    </p>
                    <p className="text-xs text-[#386641] mt-0.5">
                      Cloud spiral structure detected (Vortex Symmetry: {validationResult.features?.spiralStructureScore ?? 0}%, Cloud Coverage: {validationResult.features?.approximateCloudCoverage ?? 0}%). Prediction unlocked.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-[#CDE5CD] text-[11px] font-bold text-[#2E7D32] shrink-0">
                    Passed
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#F5C2C7] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-[#B02A37] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold text-[#842029]">
                        ⚠️ No Cyclone Detected
                      </h4>
                      <p className="text-xs font-semibold text-[#842029] mt-0.5">
                        Please upload a satellite/weather image containing a tropical cyclone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#7A6661] pt-1 border-t border-[#F5C2C7]/60">
                    <XCircle className="w-4 h-4 text-[#B02A37] shrink-0" />
                    <span className="font-medium">
                      ✕ No cyclone detected in this image &bull; {validationResult?.reason || 'Lacks circular/spiral vortex structure'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Scenario Test Presets */}
          <div className="mt-6 pt-4 border-t border-[#EADCCE]">
            <p className="text-xs font-bold text-[#7A6661] mb-2.5">
              Quick Test Cases (Test Cyclone Detection vs False Positive Rejection):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold truncate">{scenario.label}</span>
                  </div>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                    scenario.type === 'cyclone'
                      ? 'bg-[#F4F9F4] text-[#2E7D32] border border-[#CDE5CD]'
                      : 'bg-[#FFF5F5] text-[#B02A37] border border-[#F5C2C7]'
                  }`}>
                    {scenario.type === 'cyclone' ? 'Will Pass' : 'Will Reject'}
                  </span>
                  <span className="block text-[11px] text-[#7A6661] mt-1 truncate">
                    {scenario.params.windSpeed} km/h • {scenario.params.targetRegion}
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
            Enter in-situ meteorological measurements and target coastal region for landfall analysis.
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
                  placeholder="e.g. 85"
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
              <div>
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

              {/* Target Coastal Region / City */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#3D2B27] mb-1.5">
                  Target Coastal Region / City (for Landfall Analysis)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visakhapatnam, Puri, Chennai, Kolkata, Paradip"
                  value={parameters.targetRegion || ''}
                  onChange={(e) => handleInputChange('targetRegion', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] text-sm text-[#3D2B27] font-medium focus:outline-none focus:border-[#E98272] focus:ring-1 focus:ring-[#E98272]"
                  required
                />
                {/* Popular Region Quick Selection */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-[#7A6661] font-semibold">Quick Select:</span>
                  {POPULAR_TARGET_REGIONS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleInputChange('targetRegion', city)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        parameters.targetRegion === city
                          ? 'border-[#E98272] bg-[#E98272] text-white font-bold'
                          : 'border-[#EADCCE] bg-white text-[#7A6661] hover:bg-[#FAF5EF]'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons: Predict Cyclone & Reset */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isAnalyzing || isValidating || !validationResult?.isValidCycloneImage}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 ${
                    validationResult?.isValidCycloneImage
                      ? 'bg-[#E98272] hover:bg-[#D97363] text-white cursor-pointer'
                      : 'bg-[#EADCCE] text-[#7A6661] cursor-not-allowed opacity-80'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isAnalyzing
                      ? 'Analyzing Inputs...'
                      : isValidating
                      ? 'Checking Image...'
                      : 'Predict Cyclone'}
                  </span>
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

              {!validationResult?.isValidCycloneImage && imagePreview && (
                <p className="text-xs text-[#842029] font-medium">
                  Prediction is disabled because the uploaded image does not contain a verified cyclone cloud structure.
                </p>
              )}
              {!imagePreview && (
                <p className="text-xs text-[#7A6661] font-medium">
                  Please upload a satellite cyclone image above to enable prediction.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* PREDICTION RESULT & ANALYSIS SECTIONS (ONLY DISPLAYED WHEN VALID CYCLONE & PREDICTED) */}
        {prediction && validationResult?.isValidCycloneImage && (
          <div ref={resultRef} className="space-y-8">
            
            {/* 1. CYCLONE ANALYSIS (Image Analysis + Environmental Analysis) */}
            <div className="space-y-4">
              {/* Image Analysis */}
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
                      {prediction.imageAnalysis.contrastStr || `${prediction.imageAnalysis.contrast}%`}
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

              {/* Environmental Analysis */}
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
            </div>

            {/* 2. PREDICTED CYCLONE MOVEMENT DIRECTION */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-[#EADCCE]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] flex items-center justify-center text-[#E98272]">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
                      Predicted Movement Direction
                    </h2>
                    <p className="text-xs text-[#7A6661] mt-0.5">
                      Estimated track heading & translation forward speed
                    </p>
                  </div>
                </div>
                <span className="inline-block self-start sm:self-auto px-3 py-1 rounded-full bg-[#FAF5EF] text-[#E98272] border border-[#EADCCE] text-xs font-bold uppercase tracking-wider">
                  Demo Prediction
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Location */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Current Location
                  </span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E98272]" />
                    <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                      {prediction.movement.currentLocation}
                    </span>
                  </div>
                </div>

                {/* Predicted Direction with Visual Indicator Arrow */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Predicted Direction
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl font-black text-[#E98272]">
                      {prediction.movement.arrowSymbol}
                    </span>
                    <div>
                      <span className="text-base sm:text-lg font-extrabold text-[#3D2B27] block">
                        {prediction.movement.predictedDirection}
                      </span>
                      <span className="text-[11px] font-semibold text-[#7A6661]">
                        Bearing: {prediction.movement.bearingDegrees}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Predicted Movement Speed */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Movement Speed
                  </span>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#E98272]" />
                    <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                      {prediction.movement.movementSpeed}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#7A6661] block mt-0.5">
                    Translation velocity
                  </span>
                </div>
              </div>
            </section>

            {/* 3. ESTIMATED REGIONAL IMPACT */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EADCCE] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-[#EADCCE]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF5EF] border border-[#EADCCE] flex items-center justify-center text-[#E98272]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#3D2B27]">
                      Estimated Regional Impact
                    </h2>
                    <p className="text-xs text-[#7A6661] mt-0.5">
                      Target location arrival timeline and proximity assessment
                    </p>
                  </div>
                </div>
                <span className="inline-block self-start sm:self-auto px-3 py-1 rounded-full bg-[#FAF5EF] text-[#E98272] border border-[#EADCCE] text-xs font-bold uppercase tracking-wider">
                  Estimated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Target Region */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Target Region
                  </span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#E98272]" />
                    <span className="text-base sm:text-lg font-extrabold text-[#3D2B27]">
                      {prediction.impact.targetRegion}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A6661] block mt-0.5">
                    Coastal Monitoring Zone
                  </span>
                </div>

                {/* Distance from Current Location */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Distance from Cyclone
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#3D2B27] block">
                    {prediction.impact.distanceKm}
                  </span>
                  <span className="text-[11px] text-[#7A6661] block mt-0.5">
                    Great-circle radius
                  </span>
                </div>

                {/* Estimated Time to Impact */}
                <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCE]">
                  <span className="text-xs font-bold text-[#7A6661] uppercase tracking-wider block mb-1">
                    Time to Impact
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#E98272]" />
                    <span className="text-base sm:text-lg font-extrabold text-[#E98272]">
                      {prediction.impact.estimatedHours}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A6661] block mt-0.5">
                    {prediction.impact.impactStatus}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#FAF5EF]/60 border border-[#EADCCE] text-[11px] text-[#7A6661]">
                <strong>Demo Prediction:</strong> Not for operational weather forecasting. All metrics are demonstration estimates.
              </div>
            </section>

            {/* 4. PREDICTION */}
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

            {/* 5. DASHBOARD */}
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

              {/* Simple Coral Line Chart: Cyclone Intensity Trend */}
              <div className="pt-4 border-t border-[#EADCCE]">
                <h3 className="text-base font-bold text-[#3D2B27] mb-4">
                  Cyclone Intensity Trend
                </h3>

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
          Demo Prediction — Not for operational weather forecasting. Developed with a Coral & Beige theme.
        </p>
      </footer>
    </div>
  );
}
