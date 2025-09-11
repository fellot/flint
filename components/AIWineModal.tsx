'use client';

import { useState, useRef } from 'react';
import { WineFormData } from '@/types/wine';
import { X, Upload, Camera, Loader2, CheckCircle, AlertCircle, Wine as WineIcon } from 'lucide-react';

interface AIWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (wineData: WineFormData) => void;
}

type ProcessingStep = 'upload' | 'processing' | 'review' | 'saving';

export default function AIWineModal({ isOpen, onClose, onAddWine }: AIWineModalProps) {
  // Client-side image downscaling helpers
  const MAX_SIDE = 1600;
  const JPEG_QUALITY = 0.82;

  const fileToDataURL = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Failed to read file'));
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(file);
    });

  const blobToDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Failed to read blob'));
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(blob);
    });

  const downscaleImageToDataURL = async (
    file: File,
    maxSide: number = MAX_SIDE,
    quality: number = JPEG_QUALITY
  ): Promise<string> => {
    try {
      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        // Use createImageBitmap to respect EXIF orientation when supported
        // @ts-ignore - imageOrientation is supported in modern browsers
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const { width, height } = bitmap;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) throw new Error('Failed to encode image');
        return await blobToDataURL(blob);
      }
    } catch (e) {
      // Fallback to HTMLImageElement pipeline if createImageBitmap fails
      console.warn('createImageBitmap pipeline failed, falling back:', e);
    }

    // Fallback path using Image element
    const dataUrl = await fileToDataURL(file);
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
    const img = document.createElement('img');
    img.src = dataUrl;
    const targetPromise = new Promise<string>((resolve, reject) => {
      img.onload = async () => {
        const { width, height } = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
        if (!blob) return reject(new Error('Failed to encode image'));
        const out = await blobToDataURL(blob);
        resolve(out);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    });
    return targetPromise;
  };

  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<WineFormData> | null>(null);
  const [formData, setFormData] = useState<WineFormData>({
    bottle: '',
    country: '',
    region: '',
    vintage: new Date().getFullYear(),
    drinkingWindow: '',
    peakYear: new Date().getFullYear() + 5,
    foodPairingNotes: '',
    mealToHaveWithThisWine: '',
    style: '',
    grapes: '',
    location: '',
    quantity: 1,
    price: undefined,
    notes: '',
    technical_sheet: '',
    bottle_image: '',
    fromCellar: true,
    status: 'in_cellar',
    consumedDate: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await downscaleImageToDataURL(file);
      setUploadedImage(compressedDataUrl);
      // Keep in form for preview; will be replaced by a web URL from AI if found
      setFormData(prev => ({ ...prev, bottle_image: compressedDataUrl }));
      await processImageWithAI(compressedDataUrl);
    } catch (err) {
      console.error('Image processing failed:', err);
      setProcessingError('Could not process image. Please try a different photo.');
    }
  };

  const processImageWithAI = async (imageData: string) => {
    setCurrentStep('processing');
    setProcessingError(null);

    try {
      const res = await fetch('/api/ai/extract-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'AI extraction failed');
      }

      const data = await res.json();
      const extracted = data?.extracted as Partial<WineFormData>;

      if (!extracted || !extracted.bottle) {
        throw new Error('AI did not return valid data');
      }

      // Ensure style conforms to main app expectations
      const normalizedStyle = (() => {
        const s = (extracted.style || '').toLowerCase();
        if (s.includes('spark')) return 'Sparkling';
        if (s.includes('rosé') || s.includes('rose')) return 'Rosé';
        if (s.includes('sweet') || s.includes('dessert')) return 'Sweet';
        if (s.includes('fortified') || s.includes('port') || s.includes('sherry')) return 'Fortified';
        if (s.includes('white')) return 'White';
        if (s.includes('red')) return 'Red';
        return extracted.style || '';
      })();

      const merged: Partial<WineFormData> = {
        ...extracted,
        style: normalizedStyle,
      };

      setExtractedData(merged);
      setFormData(prev => ({ ...prev, ...merged }));
      setCurrentStep('review');
    } catch (error) {
      console.error('AI extraction error:', error);
      setProcessingError('Failed to process image. Please try again.');
      setCurrentStep('upload');
    }
  };

  const handleSave = async () => {
    setCurrentStep('saving');
    try {
      await onAddWine(formData);
      handleClose();
    } catch (error) {
      setProcessingError('Failed to save wine. Please try again.');
      setCurrentStep('review');
    }
  };

  const handleClose = () => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setProcessingError(null);
    setExtractedData(null);
    setFormData({
      bottle: '',
      country: '',
      region: '',
      vintage: new Date().getFullYear(),
      drinkingWindow: '',
      peakYear: new Date().getFullYear() + 5,
      foodPairingNotes: '',
      mealToHaveWithThisWine: '',
      style: '',
      grapes: '',
      location: '',
      quantity: 1,
      price: undefined,
      notes: '',
      technical_sheet: '',
      bottle_image: '',
      fromCellar: true,
      status: 'in_cellar',
      consumedDate: null,
    });
    onClose();
  };

  const handleInputChange = (field: keyof WineFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            Add Wine with AI Recognition
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-red-600' : currentStep === 'processing' || currentStep === 'review' || currentStep === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-red-100' : currentStep === 'processing' || currentStep === 'review' || currentStep === 'saving' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStep === 'upload' ? <Upload className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">Upload</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'processing' || currentStep === 'review' || currentStep === 'saving' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'processing' ? 'text-red-600' : currentStep === 'review' || currentStep === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-red-100' : currentStep === 'review' || currentStep === 'saving' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStep === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : currentStep === 'review' || currentStep === 'saving' ? <CheckCircle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">Process</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'review' || currentStep === 'saving' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'review' ? 'text-red-600' : currentStep === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'review' ? 'bg-red-100' : currentStep === 'saving' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStep === 'review' ? <CheckCircle className="h-4 w-4" /> : currentStep === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {processingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{processingError}</span>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Wine Bottle Photo</h4>
              <p className="text-gray-600 text-sm mb-6">
                Take a clear photo of the wine bottle label. Our AI will extract all the wine information automatically.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-8"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900 mb-2">Click to upload or drag and drop</span>
                <span className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</span>
              </button>
            </div>

            {uploadedImage && (
              <div className="mb-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded wine bottle"
                  className="mx-auto max-h-48 rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 text-red-600 animate-spin mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Processing Image...</h4>
            <p className="text-gray-600 text-sm">
              Our AI is analyzing the wine bottle label to extract information.
            </p>
          </div>
        )}

        {/* Review Step */}
        {(currentStep === 'review' || currentStep === 'saving') && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Wine Information Extracted</h4>
              <p className="text-gray-600 text-sm">
                Please review and edit the information below before saving.
              </p>
            </div>

            {uploadedImage && (
              <div className="mb-6 text-center">
                <img
                  src={uploadedImage}
                  alt="Wine bottle"
                  className="mx-auto max-h-32 rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wine Name</label>
                <input
                  type="text"
                  value={formData.bottle}
                  onChange={(e) => handleInputChange('bottle', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                <input
                  type="number"
                  value={formData.vintage}
                  onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grapes</label>
                <input
                  type="text"
                  value={formData.grapes}
                  onChange={(e) => handleInputChange('grapes', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drinking Window</label>
                <input
                  type="text"
                  value={formData.drinkingWindow}
                  onChange={(e) => handleInputChange('drinkingWindow', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peak Year</label>
                <input
                  type="number"
                  value={formData.peakYear}
                  onChange={(e) => handleInputChange('peakYear', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Pairing Notes</label>
                <textarea
                  value={formData.foodPairingNotes}
                  onChange={(e) => handleInputChange('foodPairingNotes', e.target.value)}
                  className="input-field"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Meal</label>
                <input
                  type="text"
                  value={formData.mealToHaveWithThisWine}
                  onChange={(e) => handleInputChange('mealToHaveWithThisWine', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Upload
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                disabled={currentStep === 'saving'}
              >
                {currentStep === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Wine'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
