'use client';

import { useState, useEffect } from 'react';
import { WineFormData } from '@/types/wine';
import { useWineScan } from '@/hooks/useWineScan';
import WineScanReview from './WineScanReview';
import { X, Upload, Camera, Loader2, CheckCircle, AlertCircle, Wine as WineIcon, Sparkles, RefreshCw } from 'lucide-react';

import type { CellarStorage } from '@/types/database';
import StorageLocationPicker from './StorageLocationPicker';

interface AIWineModalProps {
  storage: CellarStorage;
  onManageStorage?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (wineData: WineFormData) => void | Promise<void>;
  locale?: 'en' | 'pt';
}


export default function AIWineModal({ storage, onManageStorage, isOpen, onClose, onAddWine, locale = 'en' }: AIWineModalProps) {
  const t = {
    title: locale === 'pt' ? 'Adicionar Vinho' : 'Add Wine',
    stepUpload: locale === 'pt' ? 'Enviar' : 'Upload',
    stepProcess: locale === 'pt' ? 'Processar' : 'Process',
    stepReview: locale === 'pt' ? 'Revisar' : 'Review',
    errorCouldNotProcess: locale === 'pt' ? 'Não foi possível processar a imagem. Tente outra foto.' : 'Could not process image. Please try a different photo.',
    errorProcessFail: locale === 'pt' ? 'Falha ao processar a imagem. Tente novamente.' : 'Failed to process image. Please try again.',
    errorSaveFail: locale === 'pt' ? 'Falha ao salvar o vinho. Tente novamente.' : 'Failed to save wine. Please try again.',
    errorEnrichFail: locale === 'pt' ? 'Falha ao enriquecer as notas de harmonização.' : 'Failed to enrich pairing notes.',
    errorMealFail: locale === 'pt' ? 'Falha ao sugerir um prato.' : 'Failed to suggest a meal.',
    uploadHeader: locale === 'pt' ? 'Enviar foto da garrafa de vinho' : 'Upload Wine Bottle Photo',
    uploadSub: locale === 'pt'
      ? 'Tire uma foto nítida do rótulo da garrafa. Nossa IA extrairá automaticamente as informações do vinho.'
      : 'Take a clear photo of the wine bottle label. Our AI will extract all the wine information automatically.',
    uploadCta: locale === 'pt' ? 'Clique para enviar uma foto' : 'Click to upload a photo',
    uploadTypes: locale === 'pt' ? 'PNG, JPG, WebP até 10MB' : 'PNG, JPG, WebP up to 10MB',
    altUploadedBottle: locale === 'pt' ? 'Garrafa enviada' : 'Uploaded wine bottle',
    processingHeader: locale === 'pt' ? 'Processando imagem...' : 'Processing Image...',
    processingSub: locale === 'pt' ? 'Lendo o rótulo e pesquisando uma imagem da garrafa e informações do vinho. Isso pode levar um minuto.' : 'Reading the label and searching for a bottle image and reliable wine information. This can take a minute.',
    reviewHeader: locale === 'pt' ? 'Informações do vinho extraídas' : 'Wine Information Extracted',
    reviewSub: locale === 'pt' ? 'Revise e edite as informações abaixo antes de salvar.' : 'Please review and edit the information below before saving.',
    labelWineName: locale === 'pt' ? 'Nome do vinho' : 'Wine Name',
    labelVintage: locale === 'pt' ? 'Safra' : 'Vintage',
    labelCountry: locale === 'pt' ? 'País' : 'Country',
    labelRegion: locale === 'pt' ? 'Região' : 'Region',
    labelStyle: locale === 'pt' ? 'Estilo' : 'Style',
    labelGrapes: locale === 'pt' ? 'Uvas' : 'Grapes',
    labelDrinkingWindow: locale === 'pt' ? 'Janela de consumo' : 'Drinking Window',
    labelPeakYear: locale === 'pt' ? 'Ano de apogeu' : 'Peak Year',
    labelPrice: locale === 'pt' ? 'Preço' : 'Price',
    labelLocation: locale === 'pt' ? 'Localização' : 'Location',
    labelFoodPairing: locale === 'pt' ? 'Notas de harmonização' : 'Food Pairing Notes',
    labelSuggestedMeal: locale === 'pt' ? 'Prato sugerido' : 'Suggested Meal',
    labelNotes: locale === 'pt' ? 'Notas' : 'Notes',
    labelBottleImageUrl: locale === 'pt' ? 'URL da imagem da garrafa' : 'Bottle Image URL',
    labelTechSheetUrl: locale === 'pt' ? 'URL da ficha técnica' : 'Technical Sheet URL',
    enrichTooltip: locale === 'pt' ? 'Enriquecer harmonização com IA' : 'Enrich pairing with AI',
    enriching: locale === 'pt' ? 'Enriquecendo' : 'Enriching',
    enrich: locale === 'pt' ? 'Enriquecer com IA' : 'Enrich with AI',
    mealTooltipNew: locale === 'pt' ? 'Sugerir um prato com IA' : 'Suggest a meal with AI',
    mealTooltipAnother: locale === 'pt' ? 'Sugerir outro prato' : 'Suggest another meal',
    thinking: locale === 'pt' ? 'Pensando' : 'Thinking',
    suggestAnother: locale === 'pt' ? 'Sugerir outro' : 'Suggest another',
    aiSuggest: locale === 'pt' ? 'Sugerir com IA' : 'AI Suggest',
    backToUpload: locale === 'pt' ? 'Voltar para Envio' : 'Back to Upload',
    saveWine: locale === 'pt' ? 'Salvar vinho' : 'Save Wine',
    saving: locale === 'pt' ? 'Salvando...' : 'Saving...'
  } as const;
  const { currentStep, uploadedImage, processingError, setProcessingError, scanResult, formData, setFormData,
    fileInputRef, handleImageUpload, handleSave, handleClose, handleInputChange, backToUpload, sessionVersion } = useWineScan({
      isOpen, onClose, onAddWine, locale, external: false,
    });
  const [isEnrichingPairing, setIsEnrichingPairing] = useState(false);
  const [isSuggestingMeal, setIsSuggestingMeal] = useState(false);
  useEffect(() => {
    if (currentStep === 'upload') { setIsEnrichingPairing(false); setIsSuggestingMeal(false); }
  }, [currentStep]);

  const callEnrichAPI = async (mode: 'pairing' | 'meal' | 'both') => {
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
      mode,
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
    const version = sessionVersion.current;
    try {
      setProcessingError(null);
      setIsEnrichingPairing(true);
      const out = await callEnrichAPI('pairing');
      if (version !== sessionVersion.current) return;
      setFormData(prev => ({ ...prev, foodPairingNotes: out.foodPairingNotes || prev.foodPairingNotes }));
    } catch (e) {
      if (version !== sessionVersion.current) return;
      setProcessingError(t.errorEnrichFail);
    } finally {
      if (version === sessionVersion.current) setIsEnrichingPairing(false);
    }
  };

  const handleSuggestMeal = async () => {
    const version = sessionVersion.current;
    try {
      setProcessingError(null);
      setIsSuggestingMeal(true);
      const out = await callEnrichAPI('meal');
      if (version !== sessionVersion.current) return;
      setFormData(prev => ({ ...prev, mealToHaveWithThisWine: out.mealToHaveWithThisWine || prev.mealToHaveWithThisWine }));
    } catch (e) {
      if (version !== sessionVersion.current) return;
      setProcessingError(t.errorMealFail);
    } finally {
      if (version === sessionVersion.current) setIsSuggestingMeal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="legacy-modal fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            {t.title}
          </h3>
          <button
            onClick={handleClose}
            disabled={currentStep === 'saving'}
            aria-label={locale === 'pt' ? 'Fechar' : 'Close'}
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
              <span className="ml-2 text-sm font-medium">{t.stepUpload}</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'processing' || currentStep === 'review' || currentStep === 'saving' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'processing' ? 'text-red-600' : currentStep === 'review' || currentStep === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-red-100' : currentStep === 'review' || currentStep === 'saving' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStep === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : currentStep === 'review' || currentStep === 'saving' ? <CheckCircle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">{t.stepProcess}</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'review' || currentStep === 'saving' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'review' ? 'text-red-600' : currentStep === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'review' ? 'bg-red-100' : currentStep === 'saving' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentStep === 'review' ? <CheckCircle className="h-4 w-4" /> : currentStep === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">{t.stepReview}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {processingError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">{t.uploadHeader}</h4>
              <p className="text-gray-600 text-sm mb-6">
                {t.uploadSub}
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-8"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900 mb-2">{t.uploadCta}</span>
                <span className="text-sm text-gray-500">{t.uploadTypes}</span>
              </button>
            </div>

            {uploadedImage && (
              <div className="mb-4">
                <img
                  src={uploadedImage}
                  alt={t.altUploadedBottle}
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
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t.processingHeader}</h4>
            <p className="text-gray-600 text-sm">
              {t.processingSub}
            </p>
          </div>
        )}

        {/* Review Step */}
        {(currentStep === 'review' || currentStep === 'saving') && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">{t.reviewHeader}</h4>
              <p className="text-gray-600 text-sm">
                {t.reviewSub}
              </p>
            </div>

            <WineScanReview result={scanResult} imageUrl={formData.bottle_image} locale={locale} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelWineName}</label>
                <input aria-label={t.labelWineName}
                  type="text"
                  value={formData.bottle}
                  onChange={(e) => handleInputChange('bottle', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelVintage}</label>
                <input aria-label={t.labelVintage} placeholder={locale === 'pt' ? 'Sem safra / desconhecida' : 'Non-vintage / unknown'}
                  type="number"
                  value={formData.vintage || ''}
                  onChange={(e) => handleInputChange('vintage', Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelCountry}</label>
                <input aria-label={t.labelCountry}
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelRegion}</label>
                <input aria-label={t.labelRegion}
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelStyle}</label>
                <input aria-label={t.labelStyle}
                  type="text"
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelGrapes}</label>
                <input aria-label={t.labelGrapes}
                  type="text"
                  value={formData.grapes}
                  onChange={(e) => handleInputChange('grapes', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelDrinkingWindow}</label>
                <input aria-label={t.labelDrinkingWindow}
                  type="text"
                  value={formData.drinkingWindow}
                  onChange={(e) => handleInputChange('drinkingWindow', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelPeakYear}</label>
                <input aria-label={t.labelPeakYear}
                  type="number"
                  value={formData.peakYear || ''}
                  onChange={(e) => handleInputChange('peakYear', e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelPrice}</label>
                <input aria-label={t.labelPrice}
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelLocation}</label>
                <StorageLocationPicker storage={storage} value={formData.location} onChange={location => handleInputChange('location', location)} onManage={onManageStorage} locale={locale} disabled={currentStep === 'saving'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>{t.labelFoodPairing}</span>
                  <button
                    type="button"
                    onClick={handleEnrichPairing}
                    disabled={isEnrichingPairing || currentStep === 'saving'}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-md border transition-colors ${
                      isEnrichingPairing ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                    title={t.enrichTooltip}
                  >
                    {isEnrichingPairing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        {t.enriching}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {t.enrich}
                      </>
                    )}
                  </button>
                </label>
                <textarea aria-label={t.labelFoodPairing}
                  value={formData.foodPairingNotes}
                  onChange={(e) => handleInputChange('foodPairingNotes', e.target.value)}
                  className="input-field"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>{t.labelSuggestedMeal}</span>
                  <button
                    type="button"
                    onClick={handleSuggestMeal}
                    disabled={isSuggestingMeal || currentStep === 'saving'}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-md border transition-colors ${
                      isSuggestingMeal ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                    title={formData.mealToHaveWithThisWine ? t.mealTooltipAnother : t.mealTooltipNew}
                  >
                    {isSuggestingMeal ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        {t.thinking}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        {formData.mealToHaveWithThisWine ? t.suggestAnother : t.aiSuggest}
                      </>
                    )}
                  </button>
                </label>
                <input aria-label={t.labelSuggestedMeal}
                  type="text"
                  value={formData.mealToHaveWithThisWine}
                  onChange={(e) => handleInputChange('mealToHaveWithThisWine', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelNotes}</label>
                <textarea aria-label={t.labelNotes}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelBottleImageUrl}</label>
                <input aria-label={t.labelBottleImageUrl}
                  type="url"
                  value={formData.bottle_image || ''}
                  onChange={(e) => handleInputChange('bottle_image', e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelTechSheetUrl}</label>
                <input aria-label={t.labelTechSheetUrl}
                  type="url"
                  value={formData.technical_sheet || ''}
                  onChange={(e) => handleInputChange('technical_sheet', e.target.value)}
                  className="input-field"
                  placeholder="https://... (prefer PDF)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={backToUpload} disabled={currentStep === 'saving'}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t.backToUpload}
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                disabled={currentStep === 'saving'}
              >
                {currentStep === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.saving}
                  </>
                ) : t.saveWine}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
