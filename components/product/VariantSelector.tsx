'use client';

import React, { useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { ProductVariant } from '@/lib/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  baseImages: string[];
  onVariantChange?: (variant: ProductVariant | null) => void;
  onImagesChange?: (images: string[]) => void;
}

interface AttributeGroup {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  values: {
    valueId: string;
    value: string;
    colorCode: string | null;
    imageUrl: string | null;
  }[];
}

export default function VariantSelector({
  variants,
  basePrice,
  baseImages,
  onVariantChange,
  onImagesChange,
}: VariantSelectorProps) {
  const [selections, setSelections] = React.useState<Record<string, string>>({});

  const attributeGroups = useMemo(() => {
    const groups = new Map<string, AttributeGroup>();
    for (const v of variants) {
      for (const attr of v.attributes) {
        if (!attr.value) continue;
        const key = attr.attributeId;
        if (!groups.has(key)) {
          groups.set(key, {
            attributeId: attr.attributeId,
            attributeName: attr.attribute.name,
            attributeType: attr.attribute.attributeType,
            values: [],
          });
        }
        const group = groups.get(key)!;
        if (!group.values.find(v => v.valueId === attr.value!.id)) {
          group.values.push({
            valueId: attr.value.id,
            value: attr.value.value,
            colorCode: attr.value.colorCode,
            imageUrl: attr.value.imageUrl,
          });
        }
      }
    }
    return Array.from(groups.values());
  }, [variants]);

  const selectedVariant = useMemo((): ProductVariant | null => {
    const attrIds = attributeGroups.map(g => g.attributeId);
    if (attrIds.length === 0) return null;
    const allSelected = attrIds.every(id => selections[id]);
    if (!allSelected) return null;

    return variants.find(v =>
      attrIds.every(id =>
        v.attributes.some(a => a.attributeId === id && a.attributeValueId === selections[id])
      )
    ) || null;
  }, [attributeGroups, selections, variants]);

  const displayImages = useMemo(() => {
    if (selectedVariant && selectedVariant.images.length > 0) {
      return selectedVariant.images
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(i => i.imageUrl);
    }
    return baseImages;
  }, [selectedVariant, baseImages]);

  React.useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  React.useEffect(() => {
    onImagesChange?.(displayImages);
  }, [displayImages, onImagesChange]);

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : basePrice;

  const handleSelect = useCallback((attributeId: string, valueId: string) => {
    setSelections(prev => {
      if (prev[attributeId] === valueId) {
        const next = { ...prev };
        delete next[attributeId];
        return next;
      }
      return { ...prev, [attributeId]: valueId };
    });
  }, []);

  if (variants.length === 0) return null;

  return (
    <div className="space-y-5">
      {attributeGroups.map(group => (
        <div key={group.attributeId}>
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            {group.attributeName}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.values.map(val => {
              const selected = selections[group.attributeId] === val.valueId;
              const isColor = group.attributeType === 'COLOR';
              return (
                <button
                  key={val.valueId}
                  type="button"
                  onClick={() => handleSelect(group.attributeId, val.valueId)}
                  className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                      : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/50'
                  }`}
                >
                  {isColor && val.colorCode && (
                    <span
                      className="h-4 w-4 rounded-full border border-[var(--border)]"
                      style={{ backgroundColor: val.colorCode }}
                    />
                  )}
                  {val.value}
                  {selected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="rounded-xl bg-[var(--bg-outer)] p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">SKU</span>
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              {selectedVariant.sku}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Prix</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {displayPrice.toLocaleString()} CFA
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Stock</span>
            <span className={selectedVariant.stock > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
              {selectedVariant.stock > 0 ? `${selectedVariant.stock} disponible(s)` : 'Épuisé'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
