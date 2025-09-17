'use client';

import { useState, useEffect } from 'react';
import { Wine } from '@/types/wine';
import { X, Wine as WineIcon, Star, Calendar, MapPin, Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface WineModalProps {
  wine: Wine;
  isOpen: boolean;
  onClose: () => void;
  onSave: (wine: Wine) => void;
  mode: 'edit' | 'view';
  locale?: 'en' | 'pt';
}

export default function WineModal({ wine, isOpen, onClose, onSave, mode, locale = 'en' }: WineModalProps) {
  const [formData, setFormData] = useState<Wine>(wine);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalLocation, setOriginalLocation] = useState<string>(wine.location);
  const [isEnrichingPairing, setIsEnrichingPairing] = useState(false);
  const [isSuggestingMeal, setIsSuggestingMeal] = useState(false);

<<<<<<< ours
  const normalizedLocationOptions = useMemo(() => {
    const uniqueOptions = new Map<string, string>();

    locationOptions.forEach((loc) => {
      const trimmed = loc.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, trimmed);
      }
    });

    const currentLocation = formData.location?.trim();
    if (currentLocation) {
      const key = currentLocation.toLowerCase();
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, currentLocation);
      }
    }

    return Array.from(uniqueOptions.values()).sort((a, b) => a.localeCompare(b));
  }, [locationOptions, formData.location]);

=======
>>>>>>> theirs
  useEffect(() => {
    setFormData(wine);
    setOriginalLocation(wine.location);
  }, [wine]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'vintage' || name === 'peakYear' || name === 'quantity' || name === 'rating' ? 
        (value === '' ? null : parseInt(value)) : 
        name === 'price' ? 
        (value === '' ? null : parseFloat(value)) : 
        value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bottle.trim()) newErrors.bottle = 'Bottle name is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.style.trim()) newErrors.style = 'Style is required';
    if (!formData.grapes.trim()) newErrors.grapes = 'Grapes are required';
    if (!formData.location.trim() && formData.status !== 'consumed') newErrors.location = 'Location is required';
    if (formData.vintage && (formData.vintage < 1900 || formData.vintage > new Date().getFullYear() + 1)) {
      newErrors.vintage = 'Vintage must be between 1900 and next year';
    }
    if (formData.peakYear && formData.vintage && formData.peakYear < formData.vintage) {
      newErrors.peakYear = 'Peak year must be after vintage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  // Call AI to enrich pairing notes / suggest meal
  const callEnrichAPI = async (modeSel: 'pairing' | 'meal' | 'both') => {
    const payload = {
      wine: {
        bottle: formData.bottle,
        country: formData.country,
        region: formData.region,
        vintage: formData.vintage,
        style: formData.style,
        grapes: formData.grapes,
      },
      currentPairing: formData.foodPairingNotes,
      currentMeal: formData.mealToHaveWithThisWine,
      mode: modeSel,
      locale,
    };
    const res = await fetch('/api/ai/enrich-pairing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'AI enrichment failed');
    }
    return res.json() as Promise<{ foodPairingNotes: string; mealToHaveWithThisWine: string }>;
  };

  const handleEnrichPairing = async () => {
    try {
      setIsEnrichingPairing(true);
      const out = await callEnrichAPI('pairing');
      setFormData(prev => ({ ...prev, foodPairingNotes: out.foodPairingNotes || prev.foodPairingNotes }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnrichingPairing(false);
    }
  };

  const handleSuggestMeal = async () => {
    try {
      setIsSuggestingMeal(true);
      const out = await callEnrichAPI('meal');
      setFormData(prev => ({ ...prev, mealToHaveWithThisWine: out.mealToHaveWithThisWine || prev.mealToHaveWithThisWine }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingMeal(false);
    }
  };

  const handleStatusChange = (newStatus: Wine['status']) => {
    setFormData(prev => {
      // If changing to consumed, store the current location and set to N/A
      if (newStatus === 'consumed' && prev.status !== 'consumed') {
        setOriginalLocation(prev.location);
        return {
          ...prev,
          status: newStatus,
          consumedDate: new Date().toISOString().split('T')[0],
          location: 'N/A',
        };
      }
      
      // If changing from consumed to something else, restore the original location
      if (prev.status === 'consumed' && newStatus !== 'consumed') {
        return {
          ...prev,
          status: newStatus,
          consumedDate: null,
          location: originalLocation,
        };
      }
      
      // For other status changes, just update the status
      return {
        ...prev,
        status: newStatus,
        consumedDate: newStatus === 'consumed' ? new Date().toISOString().split('T')[0] : null,
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-wine-100 flex items-center justify-center">
              <WineIcon className="h-6 w-6 text-wine-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Wine' : 'Wine Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status and Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value as Wine['status'])}
                  className="select-field w-auto"
                  disabled={mode === 'view'}
                >
                  <option value="in_cellar">In Cellar</option>
                  <option value="consumed">Consumed</option>
                  <option value="sold">Sold</option>
                  <option value="gifted">Gifted</option>
                </select>
                
                {formData.status === 'consumed' && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      name="consumedDate"
                      value={formData.consumedDate || ''}
                      onChange={handleInputChange}
                      className="input-field w-auto"
                      disabled={mode === 'view'}
                    />
                  </div>
                )}
              </div>
              
              {formData.status === 'consumed' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                        className={`p-1 ${formData.rating && formData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        disabled={mode === 'view'}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bottle" className="block text-sm font-medium text-gray-700 mb-2">
                Bottle Name *
              </label>
              <input
                type="text"
                id="bottle"
                name="bottle"
                value={formData.bottle}
                onChange={handleInputChange}
                className={`input-field ${errors.bottle ? 'border-red-500' : ''}`}
                disabled={mode === 'view'}
              />
              {errors.bottle && <p className="mt-1 text-sm text-red-600">{errors.bottle}</p>}
            </div>

            <div>
              <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                Style *
              </label>
              <select
                id="style"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className={`select-field ${errors.style ? 'border-red-500' : ''}`}
                disabled={mode === 'view'}
              >
                <option value="Red">Red</option>
                <option value="White">White</option>
                <option value="Rosé">Rosé</option>
                <option value="Sparkling">Sparkling</option>
                <option value="Sweet">Sweet</option>
                <option value="Fortified">Fortified</option>
              </select>
              {errors.style && <p className="mt-1 text-sm text-red-600">{errors.style}</p>}
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`input-field ${errors.country ? 'border-red-500' : ''}`}
                disabled={mode === 'view'}
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className={`input-field ${errors.region ? 'border-red-500' : ''}`}
                disabled={mode === 'view'}
              />
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
            </div>
          </div>

          {/* Vintage Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="vintage" className="block text-sm font-medium text-gray-700 mb-2">
                Vintage *
              </label>
              <input
                type="number"
                id="vintage"
                name="vintage"
                value={formData.vintage || ''}
                onChange={handleInputChange}
                className={`input-field ${errors.vintage ? 'border-red-500' : ''}`}
                min="1900"
                max={new Date().getFullYear() + 1}
                disabled={mode === 'view'}
              />
              {errors.vintage && <p className="mt-1 text-sm text-red-600">{errors.vintage}</p>}
            </div>

            <div>
              <label htmlFor="peakYear" className="block text-sm font-medium text-gray-700 mb-2">
                Peak Year
              </label>
              <input
                type="number"
                id="peakYear"
                name="peakYear"
                value={formData.peakYear || ''}
                onChange={handleInputChange}
                className={`input-field ${errors.peakYear ? 'border-red-500' : ''}`}
                min={formData.vintage || 1900}
                disabled={mode === 'view'}
              />
              {errors.peakYear && <p className="mt-1 text-sm text-red-600">{errors.peakYear}</p>}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="input-field"
                min="1"
                max="99"
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {/* Grapes and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="grapes" className="block text-sm font-medium text-gray-700 mb-2">
                Grapes *
              </label>
              <input
                type="text"
                id="grapes"
                name="grapes"
                value={formData.grapes}
                onChange={handleInputChange}
                className={`input-field ${errors.grapes ? 'border-red-500' : ''}`}
                disabled={mode === 'view'}
              />
              {errors.grapes && <p className="mt-1 text-sm text-red-600">{errors.grapes}</p>}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location {formData.status !== 'consumed' ? '*' : ''}
              </label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                  disabled={mode === 'view' || formData.status === 'consumed'}
                  placeholder={formData.status === 'consumed' ? 'N/A - Wine has been consumed' : 'Enter storage location'}
                />
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              {formData.status === 'consumed' && (
                <p className="mt-1 text-sm text-gray-500">Location set to N/A for consumed wines</p>
              )}
            </div>
          </div>

          {/* Food Pairing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="foodPairingNotes" className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Food Pairing Notes</span>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleEnrichPairing}
                    disabled={isEnrichingPairing}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-md border transition-colors ${
                      isEnrichingPairing ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                    title="Enrich pairing with AI"
                  >
                    {isEnrichingPairing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Enriching
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Enrich with AI
                      </>
                    )}
                  </button>
                )}
              </label>
              <textarea
                id="foodPairingNotes"
                name="foodPairingNotes"
                value={formData.foodPairingNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label htmlFor="mealToHaveWithThisWine" className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Suggested Meal</span>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleSuggestMeal}
                    disabled={isSuggestingMeal}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-md border transition-colors ${
                      isSuggestingMeal ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                    title={formData.mealToHaveWithThisWine ? 'Suggest another meal' : 'Suggest a meal with AI'}
                  >
                    {isSuggestingMeal ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Thinking
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        {formData.mealToHaveWithThisWine ? 'Suggest another' : 'AI Suggest'}
                      </>
                    )}
                  </button>
                )}
              </label>
              <input
                type="text"
                id="mealToHaveWithThisWine"
                name="mealToHaveWithThisWine"
                value={formData.mealToHaveWithThisWine}
                onChange={handleInputChange}
                className="input-field"
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                className="input-field"
                step="0.01"
                min="0"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label htmlFor="drinkingWindow" className="block text-sm font-medium text-gray-700 mb-2">
                Drinking Window
              </label>
              <input
                type="text"
                id="drinkingWindow"
                name="drinkingWindow"
                value={formData.drinkingWindow}
                onChange={handleInputChange}
                className="input-field"
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="input-field"
              placeholder="Add your tasting notes, thoughts, or any additional information..."
              disabled={mode === 'view'}
            />
          </div>

          {/* Technical Sheet */}
          <div>
            <label htmlFor="technical_sheet" className="block text-sm font-medium text-gray-700 mb-2">
              Technical Sheet URL
            </label>
            <input
              type="url"
              id="technical_sheet"
              name="technical_sheet"
              value={formData.technical_sheet || ''}
              onChange={handleInputChange}
              className="input-field"
              placeholder="https://example.com/technical-sheet.pdf"
              disabled={mode === 'view'}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Link to the wine's technical sheet or detailed information
            </p>
          </div>

          {/* Bottle Image */}
          <div>
            <label htmlFor="bottle_image" className="block text-sm font-medium text-gray-700 mb-2">
              Bottle Image URL
            </label>
            <input
              type="url"
              id="bottle_image"
              name="bottle_image"
              value={formData.bottle_image || ''}
              onChange={handleInputChange}
              className="input-field"
              placeholder="https://example.com/bottle-image.jpg"
              disabled={mode === 'view'}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Link to the wine bottle's image
            </p>
          </div>

          {/* Form Actions */}
          {mode === 'edit' && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
