'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';
import { suggestedMealTypeForDate } from '@/lib/models/meal-type';
import {
  editableFoodItemFromAnalysisResult,
  editableFoodItemToFoodItem,
  emptyManualEditableFoodItem,
  updateEditableItemWeight,
  type EditableFoodItem,
} from '@/lib/scanner/editable-food-item';
import {
  allItemsFlagged,
  hasAdjustedItems,
  overallConfidence,
  sumEditableItems,
} from '@/lib/scanner/meal-totals';
import { createAnalyzeGenerationGuard } from '@/lib/scanner/analyze-generation';
import type { PreparedMealImage } from '@/lib/services/meal-photo-processor';
import {
  MealPhotoProcessorError,
  prepareForAnalysisAndStorage,
} from '@/lib/services/meal-photo-processor';

export type MealScannerPhase = 'capture' | 'analyzing' | 'results' | 'error' | 'manual';

export type ScannerErrorKind = 'offline' | 'api' | 'parse' | 'unrecognizable' | 'photoPrep';

export interface UseMealScannerOptions {
  userId: string;
  onUnsavedWorkChange?: (hasUnsavedWork: boolean) => void;
}

export function useMealScanner({ userId, onUnsavedWorkChange }: UseMealScannerOptions) {
  const [phase, setPhase] = useState<MealScannerPhase>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparedPhoto, setPreparedPhoto] = useState<PreparedMealImage | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [editableItems, setEditableItems] = useState<EditableFoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(() => suggestedMealTypeForDate(new Date()));
  const [scannerError, setScannerError] = useState<ScannerErrorKind | null>(null);
  const [estimationNotes, setEstimationNotes] = useState<string | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const originalItemWeightsRef = useRef<Map<string, number>>(new Map());
  const previewUrlRef = useRef<string | null>(null);
  const analyzeGenerationRef = useRef(createAnalyzeGenerationGuard());

  const invalidateAnalyze = useCallback(() => {
    analyzeGenerationRef.current.invalidate();
  }, []);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const totals = useMemo(() => sumEditableItems(editableItems), [editableItems]);

  const computedOverallConfidence = useMemo(() => {
    if (isManualEntry) {
      return 0;
    }
    return overallConfidence(editableItems);
  }, [editableItems, isManualEntry]);

  const allFlagged = useMemo(() => allItemsFlagged(editableItems), [editableItems]);

  const canLog = useMemo(
    () =>
      editableItems.length > 0 &&
      editableItems.every(
        (item) => item.weightG > 0 && item.name.trim().length > 0,
      ),
    [editableItems],
  );

  const canFinishManual = useMemo(
    () =>
      editableItems.length > 0 &&
      editableItems.every((item) => item.name.trim().length > 0 && item.calories > 0),
    [editableItems],
  );

  const canAnalyze = Boolean(preparedPhoto) && phase !== 'analyzing';

  const hasUnsavedWork = useMemo(() => {
    switch (phase) {
      case 'analyzing':
        return true;
      case 'results':
        return editableItems.length > 0;
      case 'manual':
        return editableItems.some(
          (item) => item.name.trim().length > 0 || item.calories > 0,
        );
      case 'capture':
      case 'error':
        return (
          preparedPhoto !== null || textDescription.trim().length > 0
        );
      default:
        return false;
    }
  }, [phase, editableItems, preparedPhoto, textDescription]);

  useEffect(() => {
    onUnsavedWorkChange?.(hasUnsavedWork);
  }, [hasUnsavedWork, onUnsavedWorkChange]);

  const applyAnalysis = useCallback((response: MealAnalysisResponse) => {
    const flaggedNames = new Set(response.flaggedItems);
    const items = response.items.map((result) =>
      editableFoodItemFromAnalysisResult(result, flaggedNames),
    );
    const weights = new Map(items.map((item) => [item.id, item.weightG]));
    originalItemWeightsRef.current = weights;

    if (items.length === 0) {
      setScannerError('unrecognizable');
      setPhase('error');
      return;
    }

    setEditableItems(items);
    setEstimationNotes(response.estimationNotes);
    setScannerError(null);
    setPhase('results');
  }, []);

  const selectPhoto = useCallback(
    async (file: File) => {
      setScannerError(null);
      setLogError(null);
      try {
        const prepared = await prepareForAnalysisAndStorage(file);
        revokePreviewUrl();
        const url = URL.createObjectURL(prepared.blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setPreparedPhoto(prepared);
      } catch (error) {
        revokePreviewUrl();
        setPreviewUrl(null);
        setPreparedPhoto(null);
        if (error instanceof MealPhotoProcessorError) {
          setScannerError('photoPrep');
        } else {
          setScannerError('photoPrep');
        }
        setPhase('error');
      }
    },
    [revokePreviewUrl],
  );

  const analyze = useCallback(async () => {
    if (!preparedPhoto) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setScannerError('offline');
      setPhase('error');
      return;
    }

    setScannerError(null);
    setIsManualEntry(false);
    setPhase('analyzing');
    const generation = analyzeGenerationRef.current.start();

    const formData = new FormData();
    formData.append('image', preparedPhoto.blob, 'photo.jpg');
    const description = textDescription.trim();
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!analyzeGenerationRef.current.isCurrent(generation)) {
        return;
      }

      if (!response.ok) {
        let errorKind: ScannerErrorKind = 'api';
        if (response.status === 422) {
          errorKind = 'unrecognizable';
        } else if (response.status === 503) {
          errorKind = 'api';
        } else if (response.status === 502) {
          try {
            const body = (await response.json()) as { error?: string };
            if (body.error === 'Analysis parse failed') {
              errorKind = 'parse';
            }
          } catch {
            errorKind = 'api';
          }
        }
        setScannerError(errorKind);
        setPhase('error');
        return;
      }

      const data = (await response.json()) as MealAnalysisResponse;
      if (!analyzeGenerationRef.current.isCurrent(generation)) {
        return;
      }
      applyAnalysis(data);
    } catch {
      if (!analyzeGenerationRef.current.isCurrent(generation)) {
        return;
      }
      setScannerError('api');
      setPhase('error');
    }
  }, [preparedPhoto, textDescription, applyAnalysis]);

  const enterManualEntry = useCallback(() => {
    invalidateAnalyze();
    setScannerError(null);
    setEstimationNotes(null);
    setIsManualEntry(true);
    setEditableItems([emptyManualEditableFoodItem()]);
    originalItemWeightsRef.current = new Map();
    setPhase('manual');
  }, [invalidateAnalyze]);

  const addManualItem = useCallback(() => {
    setEditableItems((items) => [...items, emptyManualEditableFoodItem()]);
  }, []);

  const removeManualItem = useCallback((id: string) => {
    setEditableItems((items) => {
      if (items.length <= 1) {
        return items;
      }
      return items.filter((item) => item.id !== id);
    });
  }, []);

  const updateManualItem = useCallback(
    (id: string, patch: Partial<EditableFoodItem>) => {
      setEditableItems((items) =>
        items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const finishManualEntry = useCallback(() => {
    if (!canFinishManual) {
      return;
    }
    setEditableItems((items) =>
      items.map((item) => ({ ...item, confidence: 1.0, isFlagged: false })),
    );
    setIsManualEntry(true);
    setEstimationNotes(null);
    originalItemWeightsRef.current = new Map();
    setPhase('results');
  }, [canFinishManual]);

  const updateItemWeight = useCallback((id: string, grams: number) => {
    setEditableItems((items) =>
      items.map((item) =>
        item.id === id ? updateEditableItemWeight(item, grams) : item,
      ),
    );
  }, []);

  const editItem = useCallback((id: string, patch: Partial<EditableFoodItem>) => {
    setEditableItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const makeMealEntry = useCallback(
    (mealId: string): MealEntry => {
      const description = textDescription.trim();
      const adjusted = hasAdjustedItems(
        editableItems,
        originalItemWeightsRef.current,
        isManualEntry,
      );

      return {
        id: mealId,
        userId,
        timestamp: new Date(),
        mealType,
        textDescription: description || undefined,
        totalCalories: totals.totalCalories,
        totalProteinG: totals.totalProteinG,
        totalCarbsG: totals.totalCarbsG,
        totalFatG: totals.totalFatG,
        totalFiberG: totals.totalFiberG,
        geminiConfidence: isManualEntry ? 0 : computedOverallConfidence,
        isManuallyAdjusted: isManualEntry || adjusted,
        estimationNotes: isManualEntry ? undefined : estimationNotes ?? undefined,
        items: editableItems.map(editableFoodItemToFoodItem),
      };
    },
    [
      textDescription,
      editableItems,
      isManualEntry,
      userId,
      mealType,
      totals,
      computedOverallConfidence,
      estimationNotes,
    ],
  );

  const discard = useCallback(() => {
    invalidateAnalyze();
    revokePreviewUrl();
    setPreviewUrl(null);
    setPreparedPhoto(null);
    setTextDescription('');
    setEditableItems([]);
    setEstimationNotes(null);
    setScannerError(null);
    setIsManualEntry(false);
    setEditingItemId(null);
    setLogError(null);
    originalItemWeightsRef.current = new Map();
    setMealType(suggestedMealTypeForDate(new Date()));
    setPhase('capture');
  }, [invalidateAnalyze, revokePreviewUrl]);

  const reAnalyze = useCallback(() => {
    invalidateAnalyze();
    setEditableItems([]);
    setEstimationNotes(null);
    setScannerError(null);
    setIsManualEntry(false);
    originalItemWeightsRef.current = new Map();
    setPhase('capture');
  }, [invalidateAnalyze]);

  const retryAnalyze = useCallback(() => {
    setScannerError(null);
    setPhase('capture');
    void analyze();
  }, [analyze]);

  const cancelAnalysis = useCallback(() => {
    if (phase === 'analyzing') {
      invalidateAnalyze();
      setPhase('capture');
    }
  }, [phase, invalidateAnalyze]);

  return {
    phase,
    previewUrl,
    preparedPhoto,
    textDescription,
    setTextDescription,
    editableItems,
    mealType,
    setMealType,
    scannerError,
    estimationNotes,
    isManualEntry,
    editingItemId,
    setEditingItemId,
    logError,
    setLogError,
    totals,
    overallConfidence: computedOverallConfidence,
    allItemsFlagged: allFlagged,
    canLog,
    canFinishManual,
    canAnalyze,
    hasUnsavedWork,
    selectPhoto,
    analyze,
    applyAnalysis,
    enterManualEntry,
    addManualItem,
    removeManualItem,
    updateManualItem,
    finishManualEntry,
    updateItemWeight,
    editItem,
    makeMealEntry,
    discard,
    reAnalyze,
    retryAnalyze,
    cancelAnalysis,
  };
}

export type MealScannerState = ReturnType<typeof useMealScanner>;
