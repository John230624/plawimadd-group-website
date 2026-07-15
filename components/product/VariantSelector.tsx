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
    for (const variant of variants) {
      for (const attr of variant.attributes) {
        if (!attr.value) continue;
        if (!groups.has(attr.attributeId)) {
          groups.set(attr.attributeId, {
            attributeId: attr.attributeId,
            attributeName: attr.attribute.name,
            attributeType: attr.attribute.attributeType,
            values: [],
          });
        }

        const group = groups.get(attr.attributeId)!;
        if (!group.values.find((value) => value.valueId === attr.value!.id)) {
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
    const attrIds = attributeGroups.map((group) => group.attributeId);
    if (attrIds.length === 0) return null;
    const allSelected = attrIds.every((id) => selections[id]);
    if (!allSelected) return null;

    return (
      variants.find((variant) =>
        attrIds.every((id) =>
          variant.attributes.some(
            (attr) => attr.attributeId === id && attr.attributeValueId === selections[id]
          )
        )
      ) || null
    );
  }, [attributeGroups, selections, variants]);

  const displayImages = useMemo(() => {
    if (selectedVariant && selectedVariant.images.length > 0) {
      return selectedVariant.images
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((image) => image.imageUrl);
    }

    return baseImages;
  }, [selectedVariant, baseImages]);

  React.useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  React.useEffect(() => {
    onImagesChange?.(displayImages);
  }, [displayImages, onImagesChange]);

  const displayPrice = selectedVariant ? selectedVariant.price : basePrice;

  const handleSelect = useCallback((attributeId: string, valueId: string) => {
    setSelections((current) => {
      if (current[attributeId] === valueId) {
        const next = { ...current };
        delete next[attributeId];
        return next;
      }

      return { ...current, [attributeId]: valueId };
    });
  }, []);

  if (variants.length === 0) return null;

  return (
    <div className="space-y-5">
      {attributeGroups.map((group) => (
        <div key={group.attributeId}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#222]">{group.attributeName}</p>
            <span className="text-xs text-[#777]">Selectionner</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const selected = selections[group.attributeId] === value.valueId;
              const isColor = group.attributeType === 'COLOR';

              return (
                <button
                  key={value.valueId}
                  type="button"
                  onClick={() => handleSelect(group.attributeId, value.valueId)}
                  className={`relative inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? 'border-[#ff6a00] bg-[#fff3e8] text-[#c25100] shadow-[0_0_0_1px_rgba(255,106,0,0.22)]'
                      : 'border-[#e5e5e5] bg-[#f7f7f7] text-[#333] hover:border-[#ff6a00]'
                  }`}
                >
                  {isColor && value.colorCode ? (
                    <span
                      className="h-4 w-4 rounded-full border border-[#d8d8d8]"
                      style={{ backgroundColor: value.colorCode }}
                    />
                  ) : null}
                  {value.value}
                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant ? (
        <div className="rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#777]">SKU</p>
              <p className="mt-1 truncate font-mono text-xs font-semibold text-[#333]">
                {selectedVariant.sku}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#777]">Prix</p>
              <p className="mt-1 font-semibold text-[#222]">
                {displayPrice.toLocaleString('fr-FR')} CFA
              </p>
            </div>
            <div>
              <p className="text-xs text-[#777]">Stock</p>
              <p className={`mt-1 font-semibold ${selectedVariant.stock > 0 ? 'text-[#238a43]' : 'text-[#c62828]'}`}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} disponible(s)` : 'Epuise'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
