"use client";

import {useRef, useState} from "react";
import {crmApi} from "@/shared/api/client";
import {getCrmErrorMessage} from "@/shared/api/errors";
import type {Feature, References, ReferenceCreateType} from "@/shared/api/types";
import {useI18n} from "@/shared/i18n/useI18n";
import {useNotifications} from "@/shared/feedback/NotificationProvider";
import {ConfirmDialog} from "@/shared/ui/ConfirmDialog";

export type ReferenceDeleteType = ReferenceCreateType | "collections";
export type ReferenceDeletionActions = {
  canDelete: (option: Feature) => boolean;
  requestDelete: (option: Feature) => void;
};
const definitions: Record<ReferenceDeleteType, {key: keyof References; fields: string[]}> = {
  collections: {key: "collections", fields: ["collectionId"]},
  "watch-mechanisms": {key: "mechanisms", fields: ["mechanismId"]},
  genders: {key: "genders", fields: ["genderId"]},
  "case-materials": {key: "materials", fields: ["caseMaterialId", "strapMaterialId", "interiorCaseMaterialId", "accessoryCaseMaterialId", "accessoryInsertMaterialId"]},
  "strap-materials": {key: "materials", fields: ["caseMaterialId", "strapMaterialId", "interiorCaseMaterialId", "accessoryCaseMaterialId", "accessoryInsertMaterialId"]},
  "glass-types": {key: "glassTypes", fields: ["glassTypeId"]},
  "stone-inlays": {key: "stoneInlays", fields: ["stoneInlayId"]},
  colors: {key: "interiorColors", fields: ["strapColorId", "dialColorId", "interiorColorId", "accessoryColorId"]},
  "interior-styles": {key: "interiorStyles", fields: ["interiorStyleId"]},
  "interior-mechanisms": {key: "interiorMechanisms", fields: ["interiorMechanismTypeId"]},
  "interior-power-types": {key: "interiorPowerTypes", fields: ["powerTypeId"]},
  "watch-dial-types": {key: "watchDialTypes", fields: ["dialTypeId"]},
  "watch-dial-markings": {key: "watchDialMarkings", fields: ["dialMarkingId"]},
  "watch-power-sources": {key: "watchPowerSources", fields: ["powerSourceId"]},
  "watch-water-resistances": {key: "watchWaterResistances", fields: ["waterResistanceId"]},
  "watch-features": {key: "watchFeatures", fields: ["featureIds"]},
};

export function removeReferenceFromCache(references: References | null, type: ReferenceDeleteType, id: number) {
  if (!references) return references;
  const {key} = definitions[type];
  return {...references, [key]: references[key].filter((option) => option.id !== id)};
}

// Shared dictionaries can be selected in several unsaved fields at once.
export function clearDeletedReference<T extends object>(form: T, type: ReferenceDeleteType, id: number): T {
  let next = form;
  for (const field of definitions[type].fields) {
    const value: unknown = Reflect.get(form, field);
    if (value === String(id) || (Array.isArray(value) && value.includes(String(id)))) {
      if (next === form) next = {...form};
      Reflect.set(next, field, Array.isArray(value) ? value.filter((item) => item !== String(id)) : "");
    }
  }
  return next;
}

export function useReferenceDeletion(onDeleted: (type: ReferenceDeleteType, id: number) => void) {
  const {t} = useI18n();
  const notifications = useNotifications();
  const [pending, setPending] = useState<{type: ReferenceDeleteType; option: Feature} | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    if (!pending || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (pending.type === "collections") await crmApi.deleteCollection(pending.option.id);
      else await crmApi.deleteReference(pending.type, pending.option.id);
      onDeleted(pending.type, pending.option.id);
      setPending(null);
      notifications.success(t("catalogTools.deleted"));
    } catch (caught) {
      setError(getCrmErrorMessage(caught, t("catalogTools.deleteError"), undefined, {
        COLLECTION_IN_USE: t("catalogTools.collectionInUse"),
        REFERENCE_IN_USE: t("catalogTools.referenceInUse"),
        REFERENCE_PROTECTED: t("catalogTools.referenceProtected"),
      }));
    } finally { busyRef.current = false; setBusy(false); }
  };
  return {
    actionsFor(type: ReferenceDeleteType): ReferenceDeletionActions {
      const canDelete = (option: Feature) => type === "collections" || option.deletable === true;
      return {canDelete, requestDelete(option) {
        if (!busyRef.current && canDelete(option)) { setError(null); setPending({type, option}); }
      }};
    },
    dialog: <ConfirmDialog open={pending !== null} title={t(pending?.type === "collections" ? "catalogTools.collectionDeleteTitle" : "catalogTools.referenceDeleteTitle")}
      description={t("catalogTools.referenceDeleteDescription").replace("{value}", () => pending?.option.name ?? "")}
      error={error} confirmLabel={t(busy ? "catalogTools.deleting" : "catalogTools.referenceDeleteConfirm")} cancelLabel={t("common.cancel")} isLoading={busy}
      onConfirm={remove} onOpenChange={(open) => { if (!open && !busyRef.current) setPending(null); }}/>,
  };
}
