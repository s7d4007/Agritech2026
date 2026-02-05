import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { saveDiagnostic } from '../services/db';
import { detectPlantDisease } from '../services/api';

const DiseaseDetector: React.FC = () => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedDisease, setDetectedDisease] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const simulateDiseaseDetection = async (imageData: string) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Call the API to detect disease
      const result = await detectPlantDisease(imageData);
      
      if (result.success && result.data) {
        setDetectedDisease(result.data.disease);
        setConfidence(result.data.confidence);
        
        // Save to IndexedDB
        await saveDiagnostic({
          imageData,
          result: { disease: result.data.disease, confidence: result.data.confidence }
        });
      } else {
        setError('Unable to detect disease. Please try another image.');
      }
    } catch (err) {
      console.error('Error during detection:', err);
      setError('An error occurred during detection. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setSelectedImage(imageData);
        setDetectedDisease(null);
        setError(null);
        simulateDiseaseDetection(imageData);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setSelectedImage(imageData);
        setDetectedDisease(null);
        setError(null);
        simulateDiseaseDetection(imageData);
      };
      reader.onerror = () => {
        setError('Failed to capture image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setDetectedDisease(null);
    setConfidence(0);
    setError(null);
  };

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Camera className="w-8 h-8" />
            <h1 className="text-4xl font-bold">{t('disease.title')}</h1>
          </div>
          <p className="text-primary-100">
            {t('disease.description')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!selectedImage ? (
          // Upload Section
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upload Option */}
              <div className="card cursor-pointer hover:border-primary-400 transition-all"
                onClick={() => fileInputRef.current?.click()}>
                <div className="text-center">
                  <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-accent-900 mb-2">
                    {t('disease.uploadPhoto')}
                  </h3>
                  <p className="text-accent-600 mb-4">
                    Select a photo from your device
                  </p>
                  <button className="btn-primary w-full">
                    Choose File
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Camera Option */}
              <div className="card cursor-pointer hover:border-primary-400 transition-all"
                onClick={() => cameraInputRef.current?.click()}>
                <div className="text-center">
                  <div className="bg-secondary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-secondary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-accent-900 mb-2">
                    {t('disease.takePhoto')}
                  </h3>
                  <p className="text-accent-600 mb-4">
                    Capture a photo using your camera
                  </p>
                  <button className="btn-secondary w-full">
                    Open Camera
                  </button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
              </div>
            </div>

            {/* Tips Section */}
            <div className="card bg-blue-50 border-l-4 border-blue-500">
              <h3 className="font-bold text-lg text-accent-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-accent-700">
                <li>✓ Capture the affected leaf clearly</li>
                <li>✓ Ensure good lighting for accurate detection</li>
                <li>✓ Show the disease symptoms clearly</li>
                <li>✓ Works offline - no internet needed</li>
              </ul>
            </div>
          </div>
        ) : (
          // Analysis Section
          <div className="space-y-8">
            {/* Selected Image */}
            <div className="card">
              <img
                src={selectedImage}
                alt="Crop leaf"
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
              <button
                onClick={handleReset}
                className="btn-outline w-full"
              >
                Take Another Photo
              </button>
            </div>

            {/* Results Section */}
            {analyzing ? (
              <div className="card text-center py-12">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                </div>
                <h3 className="text-xl font-bold text-accent-900 mb-2">
                  {t('disease.analyzing')}
                </h3>
                <p className="text-accent-600">
                  Using AI to identify disease in your crop...
                </p>
              </div>
            ) : detectedDisease ? (
              <div className="space-y-6">
                {/* Disease Result Card */}
                <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h2 className="text-3xl font-bold text-accent-900 mb-2">
                          {detectedDisease.name}
                        </h2>
                        <div className="flex items-center gap-4">
                          <span className="badge-success">
                            {t('disease.confidence')}: {confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment and Prevention */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Treatment */}
                  <div className="card border-l-4 border-primary-600">
                    <h3 className="text-xl font-bold text-accent-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary-600" />
                      {t('disease.treatment')}
                    </h3>
                    <p className="text-accent-700 leading-relaxed">
                      {detectedDisease.treatment}
                    </p>
                  </div>

                  {/* Prevention */}
                  <div className="card border-l-4 border-secondary-600">
                    <h3 className="text-xl font-bold text-accent-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-secondary-600" />
                      {t('disease.prevention')}
                    </h3>
                    <p className="text-accent-700 leading-relaxed">
                      {detectedDisease.prevention}
                    </p>
                  </div>
                </div>

                {/* Additional Tips */}
                <div className="card bg-green-50">
                  <h3 className="font-bold text-lg text-accent-900 mb-4">
                    Additional Tips
                  </h3>
                  <ul className="space-y-2 text-accent-700">
                    <li>✓ {t('disease.useOrganic')}</li>
                    <li>✓ {t('disease.wateringTips')}</li>
                    <li>✓ {t('disease.rotationTips')}</li>
                    <li>✓ {t('disease.consultFarmer')}</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="btn-primary flex-1"
                  >
                    Check Another Leaf
                  </button>
                  <button className="btn-outline flex-1">
                    Share Results
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-accent-900 mb-2">
                  No Disease Detected
                </h3>
                <p className="text-accent-600 mb-6">
                  {t('disease.notFound')}
                </p>
                <button
                  onClick={handleReset}
                  className="btn-primary"
                >
                  Check Another Leaf
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetector;
