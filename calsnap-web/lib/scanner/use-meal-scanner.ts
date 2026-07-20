'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { getFirebaseAuth } from '@/lib/firebase/client';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';
import { suggestedMealTypeForDate } from '@/lib/models/meal-type';
import {
  editableFoodItemFromAnalysisResult,
  editableFoodItemFromFoodItem,
  editableFoodItemToFoodItem,
  updateEditableItemWeight,
  type EditableFoodItem,
} from '@/lib/scanner/editable-food-item';
import {
  assertScannerEditMode,
  editBaselineFromState,
  editBaselinesEqual,
  type EditBaseline,
} from '@/lib/scanner/edit-baseline';
import {
  allItemsFlagged,
  hasAdjustedItems,
  overallConfidence,
  sumEditableItems,
} from '@/lib/scanner/meal-totals';
import { createAnalyzeGenerationGuard } from '@/lib/scanner/analyze-generation';
import type { PreparedMealImage } from '@/lib/services/meal-photo-processor';
import { prepareForAnalysisAndStorage } from '@/lib/services/meal-photo-processor';

export type MealScannerPhase = 'capture' | 'analyzing' | 'results' | 'error';

export type ScannerErrorKind = 'offline' | 'api' | 'parse' | 'unrecognizable' | 'photoPrep';

export interface UseMealScannerOptions {
  userId: string;
  initialMealType?: MealType;
  onUnsavedWorkChange?: (hasUnsavedWork: boolean) => void;
}

export function useMealScanner({
  userId,
  initialMealType,
  onUnsavedWorkChange,
}: UseMealScannerOptions) {
  const [phase, setPhase] = useState<MealScannerPhase>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparedPhoto, setPreparedPhoto] = useState<PreparedMealImage | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [editableItems, setEditableItems] = useState<EditableFoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(
    initialMealType ?? suggestedMealTypeForDate(new Date()),
  );
  const [scannerError, setScannerError] = useState<ScannerErrorKind | null>(null);
  const [estimationNotes, setEstimationNotes] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingTimestamp, setEditingTimestamp] = useState<Date | null>(null);
  const [existingPhotoStoragePath, setExistingPhotoStoragePath] = useState<string | undefined>();
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null);
  const [externalPreviewUrl, setExternalPreviewUrl] = useState(false);
  const originalItemWeightsRef = useRef<Map<string, number>>(new Map());
  const previewUrlRef = useRef<string | null>(null);
  const analyzeGenerationRef = useRef(createAnalyzeGenerationGuard());
  const abortControllerRef = useRef<AbortController | null>(null);

  const invalidateAnalyze = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    analyzeGenerationRef.current.invalidate();
  }, []);

  useEffect(() => {
    const generationGuard = analyzeGenerationRef.current;
    return () => {
      abortControllerRef.current?.abort();
      generationGuard.invalidate();
    };
  }, []);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current && !externalPreviewUrl) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = null;
    setExternalPreviewUrl(false);
  }, [externalPreviewUrl]);

  const totals = useMemo(() => sumEditableItems(editableItems), [editableItems]);

  const isEditing = editingMealId !== null;

  const computedOverallConfidence = useMemo(
    () => overallConfidence(editableItems),
    [editableItems],
  );

  const allFlagged = useMemo(() => allItemsFlagged(editableItems), [editableItems]);

  const canLog = useMemo(
    () =>
      editableItems.length > 0 &&
      editableItems.every(
        (item) => item.weightG > 0 && item.name.trim().length > 0,
      ),
    [editableItems],
  );

  const canAnalyze =
    (preparedPhoto !== null || textDescription.trim().length > 0) && phase !== 'analyzing';

  const hasUnsavedWork = useMemo(() => {
    if (isEditing) {
      if (!editBaseline) {
        return false;
      }
      const current = editBaselineFromState(
        mealType,
        textDescription,
        totals,
        editableItems,
      );
      return !editBaselinesEqual(current, editBaseline);
    }
    switch (phase) {
      case 'analyzing':
        return true;
      case 'results':
        return editableItems.length > 0;
      case 'capture':
      case 'error':
        return (
          preparedPhoto !== null || textDescription.trim().length > 0
        );
      default:
        return false;
    }
  }, [
    isEditing,
    editBaseline,
    mealType,
    textDescription,
    totals,
    editableItems,
    phase,
    preparedPhoto,
  ]);

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
      } catch {
        revokePreviewUrl();
        setPreviewUrl(null);
        setPreparedPhoto(null);
        setScannerError('photoPrep');
        setPhase('error');
      }
    },
    [revokePreviewUrl],
  );

  const analyze = useCallback(async () => {
    const description = textDescription.trim();
    if (!preparedPhoto && !description) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setScannerError('offline');
      setPhase('error');
      return;
    }

    setScannerError(null);
    setPhase('analyzing');
    const generation = analyzeGenerationRef.current.start();

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    if (preparedPhoto) {
      formData.append('image', preparedPhoto.blob, 'photo.jpg');
    }
    if (description) {
      formData.append('description', description);
    }

    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) {
        setScannerError('api');
        setPhase('error');
        return;
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
        signal: controller.signal,
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
            const body = (await response.json()) as { code?: string };
            if (body.code === ApiErrorCode.AnalysisParseFailed) {
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
    } catch (error) {
      // Aborted or superseded requests are handled by whichever action
      // triggered them (cancelAnalysis / reAnalyze / retryAnalyze / unmount),
      // so ignore them here to avoid stomping a freshly-set phase.
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        !analyzeGenerationRef.current.isCurrent(generation)
      ) {
        return;
      }
      setScannerError('api');
      setPhase('error');
    }
  }, [preparedPhoto, textDescription, applyAnalysis]);

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
    (mealId?: string): MealEntry => {
      const description = textDescription.trim();
      const adjusted = hasAdjustedItems(
        editableItems,
        originalItemWeightsRef.current,
      );

      return {
        id: editingMealId ?? mealId ?? crypto.randomUUID(),
        userId,
        timestamp: editingTimestamp ?? new Date(),
        mealType,
        photoStoragePath: existingPhotoStoragePath,
        textDescription: description || undefined,
        totalCalories: totals.totalCalories,
        totalProteinG: totals.totalProteinG,
        totalCarbsG: totals.totalCarbsG,
        totalFatG: totals.totalFatG,
        totalFiberG: totals.totalFiberG,
        geminiConfidence: computedOverallConfidence,
        isManuallyAdjusted: adjusted,
        estimationNotes: estimationNotes ?? undefined,
        items: editableItems.map(editableFoodItemToFoodItem),
      };
    },
    [
      textDescription,
      editableItems,
      editingMealId,
      editingTimestamp,
      existingPhotoStoragePath,
      userId,
      mealType,
      totals,
      computedOverallConfidence,
      estimationNotes,
    ],
  );

  const makeEditMealEntry = useCallback((): MealEntry => {
    assertScannerEditMode(isEditing);
    return makeMealEntry();
  }, [isEditing, makeMealEntry]);

  const loadForEditing = useCallback(
    (meal: MealEntry, photoPreviewUrl?: string | null) => {
      invalidateAnalyze();
      setEditingMealId(meal.id);
      setEditingTimestamp(meal.timestamp);
      setExistingPhotoStoragePath(meal.photoStoragePath);
      setMealType(meal.mealType);
      setTextDescription(meal.textDescription ?? '');
      setEstimationNotes(meal.estimationNotes ?? null);
      setScannerError(null);
      setPreparedPhoto(null);

      revokePreviewUrl();
      if (photoPreviewUrl) {
        previewUrlRef.current = photoPreviewUrl;
        setExternalPreviewUrl(true);
        setPreviewUrl(photoPreviewUrl);
      } else {
        setPreviewUrl(null);
      }

      const items = meal.items.map(editableFoodItemFromFoodItem);
      const weights = new Map(items.map((item) => [item.id, item.weightG]));
      originalItemWeightsRef.current = weights;
      setEditableItems(items);

      const itemTotals = sumEditableItems(items);
      const baseline = editBaselineFromState(
        meal.mealType,
        meal.textDescription ?? '',
        itemTotals,
        items,
      );
      setEditBaseline(baseline);
      setPhase('results');
    },
    [invalidateAnalyze, revokePreviewUrl],
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
    setEditingItemId(null);
    setLogError(null);
    setEditingMealId(null);
    setEditingTimestamp(null);
    setExistingPhotoStoragePath(undefined);
    setEditBaseline(null);
    originalItemWeightsRef.current = new Map();
    setMealType(suggestedMealTypeForDate(new Date()));
    setPhase('capture');
  }, [invalidateAnalyze, revokePreviewUrl]);

  const cancelEdit = useCallback(() => {
    discard();
  }, [discard]);

  const reAnalyze = useCallback(() => {
    invalidateAnalyze();
    setEditableItems([]);
    setEstimationNotes(null);
    setScannerError(null);
    originalItemWeightsRef.current = new Map();
    setPhase('capture');
  }, [invalidateAnalyze]);

  const retryAnalyze = useCallback(() => {
    invalidateAnalyze();
    setScannerError(null);
    setPhase('capture');
    void analyze();
  }, [invalidateAnalyze, analyze]);

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
    isEditing,
    editingMealId,
    editingItemId,
    setEditingItemId,
    logError,
    setLogError,
    totals,
    overallConfidence: computedOverallConfidence,
    allItemsFlagged: allFlagged,
    canLog,
    canAnalyze,
    hasUnsavedWork,
    selectPhoto,
    analyze,
    applyAnalysis,
    updateItemWeight,
    editItem,
    makeMealEntry,
    makeEditMealEntry,
    loadForEditing,
    cancelEdit,
    discard,
    reAnalyze,
    retryAnalyze,
    cancelAnalysis,
  };
}

export type MealScannerState = ReturnType<typeof useMealScanner>;
