'use client';

import { useState } from 'react';
import { WineFormData } from '@/types/wine';
import { X, Wine as WineIcon } from 'lucide-react';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (wineData: WineFormData) => void;
}

export default function AddWineModal({ isOpen, onClose, onAddWine }: AddWineModalProps) {
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'vintage' || name === 'peakYear' || name === 'quantity' ? parseInt(value) || 0 : value,
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
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.vintage < 1900 || formData.vintage > new Date().getFullYear() + 1) {
      newErrors['vintage'] = 'Vintage must be between 1900 and next year';
    }
    if (formData.peakYear < formData.vintage) {
      newErrors['peakYear'] = 'Peak year must be after vintage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAddWine(formData);
      // Reset form
      setFormData({
        bottle: '',
        country: '',
        region: '',
        vintage: new Date().getFullYear(),
        peakYear: new Date().getFullYear() + 5,
        drinkingWindow: '',
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
      });
      setErrors({});
    }
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
            <h3 className="text-2xl font-bold text-gray-900">Add New Wine</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="e.g., Château Margaux"
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
              >
                <option value="">Select Style</option>
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
                placeholder="e.g., France"
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
                placeholder="e.g., Bordeaux"
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
                value={formData.vintage}
                onChange={handleInputChange}
                className={`input-field ${errors.vintage ? 'border-red-500' : ''}`}
                min="1900"
                max={new Date().getFullYear() + 1}
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
                value={formData.peakYear}
                onChange={handleInputChange}
                className={`input-field ${errors.peakYear ? 'border-red-500' : ''}`}
                min={formData.vintage}
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
                placeholder="e.g., Cabernet Sauvignon, Merlot"
              />
              {errors.grapes && <p className="mt-1 text-sm text-red-600">{errors.grapes}</p>}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                placeholder="e.g., Wine Fridge A, Basement"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>

          {/* Food Pairing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="foodPairingNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Food Pairing Notes
              </label>
              <textarea
                id="foodPairingNotes"
                name="foodPairingNotes"
                value={formData.foodPairingNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Describe the wine's characteristics and food pairing suggestions..."
              />
            </div>

            <div>
              <label htmlFor="mealToHaveWithThisWine" className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Meal
              </label>
              <input
                type="text"
                id="mealToHaveWithThisWine"
                name="mealToHaveWithThisWine"
                value={formData.mealToHaveWithThisWine}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., Grilled steak, Roast lamb"
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
                placeholder="0.00"
                step="0.01"
                min="0"
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
                placeholder="e.g., 2025-2035"
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
              rows={3}
              className="input-field"
              placeholder="Any additional notes about this wine..."
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
              value={formData.technical_sheet}
              onChange={handleInputChange}
              className="input-field"
              placeholder="https://example.com/technical-sheet.pdf"
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
              value={formData.bottle_image}
              onChange={handleInputChange}
              className="input-field"
              placeholder="https://example.com/bottle-image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Link to the wine bottle's image
            </p>
          </div>

          {/* Form Actions */}
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
              Add Wine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
