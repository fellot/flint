'use client';

import { WineFormData } from '@/types/wine';
import { useWineScan } from '@/hooks/useWineScan';
import WineScanReview from './WineScanReview';
import { X, Upload, Camera, Loader2, CheckCircle, Wine as WineIcon } from 'lucide-react';

interface AIExternalWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (wineData: WineFormData) => Promise<void>;
  locale?: 'en' | 'pt';
}


export default function AIExternalWineModal({ isOpen, onClose, onAddWine, locale = 'en' }: AIExternalWineModalProps) {
  const t = {
    title: locale === 'pt' ? 'Adicionar Vinho Externo' : 'Add External Wine',
    stepUpload: locale === 'pt' ? 'Enviar' : 'Upload',
    stepProcess: locale === 'pt' ? 'Processar' : 'Process',
    stepReview: locale === 'pt' ? 'Revisar' : 'Review',
    uploadHeader: locale === 'pt' ? 'Enviar foto da garrafa de vinho' : 'Upload Wine Bottle Photo',
    uploadSub: locale === 'pt'
      ? 'Tire uma foto nítida do rótulo. A IA preencherá os campos do vinho.'
      : 'Take a clear photo of the label. AI will fill wine fields.',
    uploadCta: locale === 'pt' ? 'Clique para enviar uma foto' : 'Click to upload a photo',
    uploadTypes: locale === 'pt' ? 'PNG, JPG, WebP até 10MB' : 'PNG, JPG, WebP up to 10MB',
    altBottle: locale === 'pt' ? 'Garrafa enviada' : 'Uploaded wine bottle',
    processingHeader: locale === 'pt' ? 'Processando imagem...' : 'Processing Image...',
    processingSub: locale === 'pt' ? 'Lendo o rótulo e pesquisando a garrafa na web. Isso pode levar um minuto.' : 'Reading the label and searching the web for this bottle. This can take a minute.',
    reviewHeader: locale === 'pt' ? 'Revise e conclua' : 'Review and finalize',
    reviewSub: locale === 'pt'
      ? 'Campos focados para o diário: Nome completo, País, Região, Estilo, Uvas, Safra, Imagem; preencha a data de consumo e notas.'
      : 'Focused fields for journal: Full name, Country, Region, Style, Grapes, Vintage, Image; fill consumed date and notes.',
    labelWineName: locale === 'pt' ? 'Nome completo do vinho' : 'Full wine name',
    labelVintage: locale === 'pt' ? 'Safra' : 'Vintage',
    labelCountry: locale === 'pt' ? 'País' : 'Country',
    labelRegion: locale === 'pt' ? 'Região' : 'Region',
    labelStyle: locale === 'pt' ? 'Estilo' : 'Style',
    labelGrapes: locale === 'pt' ? 'Uvas' : 'Grapes',
    labelBottleImageUrl: locale === 'pt' ? 'URL da imagem da garrafa' : 'Bottle Image URL',
    labelTechSheetUrl: locale === 'pt' ? 'URL da ficha técnica' : 'Technical Sheet URL',
    labelConsumedDate: locale === 'pt' ? 'Data de consumo' : 'Consumed date',
    labelNotes: locale === 'pt' ? 'Notas' : 'Notes',
    backToUpload: locale === 'pt' ? 'Voltar para Envio' : 'Back to Upload',
    save: locale === 'pt' ? 'Adicionar Vinho Externo' : 'Add External Wine',
    saving: locale === 'pt' ? 'Salvando...' : 'Saving...',
    errorRead: locale === 'pt' ? 'Falha ao processar a imagem.' : 'Could not process image.',
    errorExtract: locale === 'pt' ? 'Falha ao extrair informações.' : 'Failed to extract information.',
    errorSave: locale === 'pt' ? 'Falha ao salvar o vinho.' : 'Failed to save wine.',
  } as const;

  const { currentStep, uploadedImage, processingError, scanResult, formData,
    fileInputRef, handleImageUpload, handleSave, handleClose, handleInputChange, backToUpload } = useWineScan({
      isOpen, onClose, onAddWine, locale, external: true,
    });
  const today = formData.consumedDate || "";
  if (!isOpen) return null;

  return (
    <div className="legacy-modal fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            {t.title}
          </h3>
          <button onClick={handleClose} disabled={currentStep === 'saving'} aria-label={locale === 'pt' ? 'Fechar' : 'Close'} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {currentStep === 'upload' ? <Upload className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">{t.stepUpload}</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep !== 'upload' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center text-gray-700">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-red-100 text-red-600' : currentStep === 'review' || currentStep === 'saving' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">{t.stepProcess}</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'review' || currentStep === 'saving' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center text-gray-700">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'review' ? 'bg-red-100 text-red-600' : currentStep === 'saving' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">{t.stepReview}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {processingError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {processingError}
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
              <p className="text-gray-600 text-sm mb-6">{t.uploadSub}</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900 mb-2">{t.uploadCta}</span>
                <span className="text-sm text-gray-500">{t.uploadTypes}</span>
              </button>
            </div>
            {uploadedImage && (
              <div className="mb-4">
                <img src={uploadedImage} alt={t.altBottle} className="mx-auto max-h-48 rounded-lg shadow-md" />
              </div>
            )}
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 text-red-600 animate-spin mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t.processingHeader}</h4>
            <p className="text-gray-600 text-sm">{t.processingSub}</p>
          </div>
        )}

        {/* Review Step */}
        {(currentStep === 'review' || currentStep === 'saving') && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h4 className="text-lg font-medium text-gray-900 mb-1">{t.reviewHeader}</h4>
              <p className="text-gray-600 text-sm">{t.reviewSub}</p>
            </div>

            <WineScanReview result={scanResult} imageUrl={formData.bottle_image} locale={locale} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelWineName}</label>
                <input aria-label={t.labelWineName} type="text" value={formData.bottle} onChange={(e) => handleInputChange('bottle', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelVintage}</label>
                <input aria-label={t.labelVintage} placeholder={locale === 'pt' ? 'Sem safra / desconhecida' : 'Non-vintage / unknown'} type="number" value={formData.vintage || ''} onChange={(e) => handleInputChange('vintage', Number(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelCountry}</label>
                <input aria-label={t.labelCountry} type="text" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelRegion}</label>
                <input aria-label={t.labelRegion} type="text" value={formData.region} onChange={(e) => handleInputChange('region', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelStyle}</label>
                <input aria-label={t.labelStyle} type="text" value={formData.style} onChange={(e) => handleInputChange('style', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelGrapes}</label>
                <input aria-label={t.labelGrapes} type="text" value={formData.grapes} onChange={(e) => handleInputChange('grapes', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelBottleImageUrl}</label>
                <input aria-label={t.labelBottleImageUrl} type="url" value={formData.bottle_image || ''} onChange={(e) => handleInputChange('bottle_image', e.target.value)} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelTechSheetUrl}</label>
                <input aria-label={t.labelTechSheetUrl} type="url" value={formData.technical_sheet || ''} onChange={(e) => handleInputChange('technical_sheet', e.target.value)} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelConsumedDate}</label>
                <input aria-label={t.labelConsumedDate} type="date" value={formData.consumedDate || today} onChange={(e) => handleInputChange('consumedDate', e.target.value)} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelNotes}</label>
                <textarea aria-label={t.labelNotes} value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} className="input-field" rows={3} />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button onClick={backToUpload} disabled={currentStep === 'saving'} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                {t.backToUpload}
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center" disabled={currentStep === 'saving'}>
                {currentStep === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.saving}
                  </>
                ) : t.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

