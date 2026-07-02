import { describe, it, expect } from 'vitest';
import { SECTION_PROVENANCE, isValidProvenance, validateProvenance, inferProvenance } from '../src/provenance';

describe('provenance (enforceable, V0.2 §1)', () => {
  it('canonical value set is exactly the four', () => {
    expect([...SECTION_PROVENANCE].sort()).toEqual(
      ['compliance_corrected', 'framework_enhancement', 'later_editorial', 'migrated'].sort()
    );
  });

  it('rejects a MISSING provenance when inference is off (new/edited content)', () => {
    const errs = validateProvenance([{ type: 'hero', fields: {} }]);
    expect(errs).toHaveLength(1);
    expect(errs[0].reason).toMatch(/required/);
  });

  it('infers missing as migrated ONLY for legacy fixtures (inference on)', () => {
    const errs = validateProvenance([{ type: 'hero', fields: {} }], { inferMissingAsMigrated: true });
    expect(errs).toHaveLength(0);
    expect(inferProvenance({ type: 'hero' })).toBe('migrated');
  });

  it('rejects an unknown provenance value', () => {
    const errs = validateProvenance([{ type: 'cta', provenance: 'made_up', fields: {} }]);
    expect(errs[0].reason).toMatch(/unknown provenance/);
  });

  it('requires a correction_ref for compliance_corrected', () => {
    const bad = validateProvenance([{ type: 'prose', provenance: 'compliance_corrected', fields: {} }]);
    expect(bad[0].reason).toMatch(/correction_ref/);
    const ok = validateProvenance([{ type: 'prose', provenance: 'compliance_corrected', correction_ref: 'CARE-CC-001', fields: {} }]);
    expect(ok).toHaveLength(0);
  });

  it('accepts all valid values and keeps a present valid value on inference', () => {
    expect(isValidProvenance('framework_enhancement')).toBe(true);
    expect(validateProvenance([
      { type: 'hero', provenance: 'migrated', fields: {} },
      { type: 'trust_badge_row', provenance: 'framework_enhancement', fields: {} },
    ])).toHaveLength(0);
    expect(inferProvenance({ provenance: 'framework_enhancement' })).toBe('framework_enhancement');
  });
});
