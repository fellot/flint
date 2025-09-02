'use client';

import { useState } from 'react';
import { WineFormData } from '@/types/wine';
import { X, Wine } from 'lucide-react';

interface AddExternalWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (wineData: WineFormData) => Promise<void>;
}

export default function AddExternalWineModal({ isOpen, onClose, onAddWine }: AddExternalWineModalProps) {
  const [formData, setFormData] = useState<WineFormData>({
    bottle: '',
    country: '',
    region: '',
    vintage: new Date().getFullYear(),
    drinkingWindow: '',
    peakYear: new Date().getFullYear(),
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
    fromCellar: false, // External wine, not from cellar
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bottle.trim()) newErrors.bottle = 'Bottle name is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.style.trim()) newErrors.style = 'Style is required';
    if (!formData.grapes.trim()) newErrors.grapes = 'Grapes are required';
    if (!formData.vintage || formData.vintage < 1900 || formData.vintage > new Date().getFullYear() + 5) {
      newErrors.vintage = 'Please enter a valid vintage year';
    }
    if (!formData.peakYear || formData.peakYear < 1900 || formData.peakYear > new Date().getFullYear() + 50) {
      newErrors.peakYear = 'Please enter a valid peak year';
    }
    if (!formData.notes.trim()) newErrors.notes = 'Tasting notes are required for external wines';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onAddWine(formData);
      setFormData({
        bottle: '',
        country: '',
        region: '',
        vintage: new Date().getFullYear(),
        drinkingWindow: '',
        peakYear: new Date().getFullYear(),
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
        fromCellar: false,
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error adding external wine:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Wine className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add External Wine</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-semibold">i</span>
              </div>
              <p className="text-sm text-blue-800">
                This wine was consumed from outside your cellar (restaurant, friend's house, etc.)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottle Name *
              </label>
              <input
                type="text"
                name="bottle"
                value={formData.bottle}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.bottle ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Château Margaux 2015"
              />
              {errors.bottle && <p className="text-red-500 text-xs mt-1">{errors.bottle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., France"
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Bordeaux"
              />
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style *
              </label>
              <input
                type="text"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.style ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Red, White, Sparkling"
              />
              {errors.style && <p className="text-red-500 text-xs mt-1">{errors.style}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grapes *
              </label>
              <input
                type="text"
                name="grapes"
                value={formData.grapes}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.grapes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Cabernet Sauvignon, Merlot"
              />
              {errors.grapes && <p className="text-red-500 text-xs mt-1">{errors.grapes}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vintage *
              </label>
              <input
                type="number"
                name="vintage"
                value={formData.vintage}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 5}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.vintage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.vintage && <p className="text-red-500 text-xs mt-1">{errors.vintage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peak Year *
              </label>
              <input
                type="number"
                name="peakYear"
                value={formData.peakYear}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 50}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.peakYear ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.peakYear && <p className="text-red-500 text-xs mt-1">{errors.peakYear}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (Optional)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasting Notes *
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your tasting experience, food pairing, and any memorable moments..."
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where Consumed
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Restaurant XYZ, Friend's house"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottle Image URL (Optional)
              </label>
              <input
                type="url"
                name="bottle_image"
                value={formData.bottle_image || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add External Wine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

