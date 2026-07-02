// @vigil/web-framework — CONTENT PROVENANCE (v0.2, enforceable).
// Canonical values + validation, single-sourced here and mirrored by the CRM
// SectionSchema (netyvee/app). CONTENT-PROVENANCE-POLICY.md is the doctrine.
//
// NOTE the value spelling reconciliation: the F1A type used `migrated_source` /
// `later_editorial`-absent. W-FRAMEWORK-V0.2 §1 fixes the canonical set as
// migrated · compliance_corrected · framework_enhancement · later_editorial.
// This module is the single source; `SectionProvenance` in types.ts re-exports it.

export const SECTION_PROVENANCE = [
  'migrated',
  'compliance_corrected',
  'framework_enhancement',
  'later_editorial',
] as const;

export type SectionProvenance = (typeof SECTION_PROVENANCE)[number];

export function isValidProvenance(v: unknown): v is SectionProvenance {
  return typeof v === 'string' && (SECTION_PROVENANCE as readonly string[]).includes(v);
}

export type ProvenanceError = { index: number; type: string; reason: string };

type SectionLike = {
  type?: string;
  provenance?: unknown;
  // compliance_corrected must cite the correction record it derives from
  correction_ref?: unknown;
  fields?: Record<string, any>;
};

export type ProvenanceValidateOptions = {
  // When true (an initial import of pre-provenance fixtures), a MISSING provenance
  // is inferred as 'migrated' rather than rejected. Any PRESENT value is still
  // validated. New/edited content always runs with inference off (required).
  inferMissingAsMigrated?: boolean;
};

// Deterministic, no-AI. Returns [] when every section is valid.
export function validateProvenance(
  sections: SectionLike[],
  opts: ProvenanceValidateOptions = {},
): ProvenanceError[] {
  const errors: ProvenanceError[] = [];
  sections.forEach((s, index) => {
    const type = String(s?.type ?? 'unknown');
    const p = s?.provenance;

    if (p === undefined || p === null || p === '') {
      if (!opts.inferMissingAsMigrated) {
        errors.push({ index, type, reason: 'provenance is required' });
      }
      return; // inferred as migrated; nothing more to check
    }
    if (!isValidProvenance(p)) {
      errors.push({ index, type, reason: `unknown provenance value "${String(p)}"` });
      return;
    }
    if (p === 'compliance_corrected' && !s?.correction_ref) {
      errors.push({
        index,
        type,
        reason: 'compliance_corrected requires a correction_ref citing the correction record',
      });
    }
  });
  return errors;
}

// Infer provenance for an UNCHANGED legacy section (backward-compat only — never
// for new/edited content). Absent ⇒ migrated; a present valid value is kept.
export function inferProvenance(s: SectionLike): SectionProvenance {
  return isValidProvenance(s?.provenance) ? s.provenance : 'migrated';
}
