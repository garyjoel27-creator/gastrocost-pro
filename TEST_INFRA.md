# GastroCost PRO — Test Infrastructure & Architecture Guide

## 1. Overview & Philosophy
GastroCost PRO is an enterprise-grade Single-File Progressive Web App (`index.html` + `sw.js`) designed for Executive Chefs and F&B Directors. To maintain strict adherence to project integrity and zero external dependencies (no npm installs, no heavy frameworks like Jest, Cypress, or Playwright), the E2E test suite is implemented using **pure Node.js standard libraries** (`fs`, `path`, `vm`, `assert`).

The testing infrastructure implements an **opaque-box E2E testing model** that executes the application's actual JavaScript runtime within an emulated headless browser sandbox.

---

## 2. Directory Layout
```
radiant-shannon/
├── index.html                   # Monolithic Single-File PWA application
├── sw.js                        # Service Worker caching & PWA lifecycle
├── scratch/
│   └── test_syntax.js           # AST Syntax verification script (Rule 3)
├── tests/
│   ├── harness.js               # Virtual DOM emulator & sandbox loader
│   ├── run_tests.js             # Master CLI Test Runner & Reporter
│   ├── tier1_features.js        # Tier 1: Feature Coverage (R1 to R6)
│   ├── tier2_boundaries.js      # Tier 2: Boundary & Corner Cases
│   ├── tier3_cross_features.js  # Tier 3: Cross-Feature Combinations
│   └── tier4_real_world.js      # Tier 4: Real-World Scenarios
├── TEST_INFRA.md                # Test architecture documentation (this document)
└── TEST_READY.md                # Test execution & readiness summary
```

---

## 3. Emulation Engine (`tests/harness.js`)
The test harness provides a lightweight, robust DOM and Web API emulation layer tailored specifically to GastroCost PRO:

1. **Virtual DOM (`VirtualElement`)**:
   - Implements full element lifecycle: attributes, properties (`value`, `type`, `checked`, `innerText`, `innerHTML`), `classList` (`add`, `remove`, `toggle`, `contains`), inline `style`, and `dataset`.
   - Event handling: `addEventListener`, `removeEventListener`, `dispatchEvent`, `closest`, `querySelector`, `querySelectorAll`, `focus`, and `scrollIntoView`.
   - Automatic registration of all standard element IDs and CSS selectors present in `index.html`.

2. **Browser APIs**:
   - `window` & `document`: Full hierarchy with body, head, and element dispatchers.
   - `localStorage`: In-memory dictionary mock with `getItem`, `setItem`, `removeItem`, and `clear`.
   - `navigator`: `onLine` state and `serviceWorker` mock.
   - `Intl`: Standard currency and number formatting proxying native Node.js Intl.
   - `FileReader`: Async file reader mock for testing JSON backup/snapshot imports.
   - Timers & Animation: `requestAnimationFrame`, `cancelAnimationFrame`, `setTimeout`, `clearTimeout`.

3. **Runtime Sandbox (`loadGastroCostApp`)**:
   - Extracts the `<script>` payload from `index.html`.
   - Compiles and evaluates it inside a `vm.createContext` sandbox.
   - Returns initialized instances of `GC`, `ALLERGENS`, `INGREDIENTS_MASTER`, and active DOM elements.

4. **Authoritative Culinary Math Engine (`CULINARY_MATH`)**:
   - Provides verified reference implementations derived strictly from `PROJECT.md` and `ORIGINAL_REQUEST.md`:
     - Gross weight calculation: $\text{Gross} = \frac{\text{Net}}{1 - \frac{\text{Waste}}{100}}$
     - Ingredient cost: $\text{Cost} = (\text{unit} === \text{'ud'}) ? \text{Gross} \times \text{Price} : \frac{\text{Gross}}{1000} \times \text{Price}$
     - Sub-recipe normalized unit price: $\text{UnitPrice} = \frac{\text{BatchCost}}{\text{YieldQty}} \times ( \text{if g/ml then 1000 else 1} )$
     - Dynamic scaled quantity: $\text{ScaledNet} = \text{BaseNet} \times \frac{\text{TargetPortions}}{\text{BasePortions}}$
     - Food Cost percentage: $\text{FC\%} = \frac{\text{CostPerPortion}}{\text{NetPVP}} \times 100$

---

## 4. Test Suite Architecture: The 4 Systematic Tiers

### Tier 1: Feature Coverage (31 Test Cases)
Comprehensive coverage verifying all core requirements (R1 through R6) with >= 5 tests per requirement:
- **R1: Hierarchical Sub-recipes (6 tests)**:
  - `T1.R1.1`: Sub-recipe flag and yield configuration schema (`isSubRecipe`, `yieldQty`, `yieldUnit`).
  - `T1.R1.2`: Normalized Unit Cost calculation across all culinary units (`g`, `kg`, `ml`, `L`, `ud`).
  - `T1.R1.3`: Dynamic Master Catalog injection with `[🥘 Elaboración Base]` badges.
  - `T1.R1.4`: Cascade Food Cost recalculation across dependent recipes.
  - `T1.R1.5`: Algorithmic cycle detection (`_isDescendantOf`) preventing infinite loops.
  - `T1.R1.6`: Automatic allergen inheritance from sub-recipe to parent dishes.
- **R2: Bulk Vendor Price Import (5 tests)**:
  - `T1.R2.1`: CSV parsing supporting comma (`,`), semicolon (`;`), and tab (`\t`) delimiters.
  - `T1.R2.2`: Intelligent exact and accent-normalized name matching.
  - `T1.R2.3`: Fuzzy token-set similarity scoring (>= 50–70%).
  - `T1.R2.4`: Price variance calculation (€ diff, % variance, increase/decrease alerts).
  - `T1.R2.5`: Global batch catalog update and recipe price synchronization.
- **R3: Snapshot Backup & Cloud Sync (5 tests)**:
  - `T1.R3.1`: Enriched snapshot schema with audit metadata (`app`, `schemaVersion: 14`, `exportedAt`, `meta`).
  - `T1.R3.2`: Backward compatibility: Transparent support for legacy un-nested backups and new snapshots.
  - `T1.R3.3`: Dual-mode import: Full database overwrite with default template protection.
  - `T1.R3.4`: Dual-mode import: Selective merge preserving local dishes and updating catalog items.
  - `T1.R3.5`: Cloud sync webhook payload formatting and offline resilience detection.
- **R4: Interactive Kitchen Tablet Mode (5 tests)**:
  - `T1.R4.1`: Responsive `.tabs-nav` navigation preserved on tablet viewports (<= 900px).
  - `T1.R4.2`: High-contrast kitchen view with tactile touch targets (>= 48px row height, >= 32px checkboxes).
  - `T1.R4.3`: Tactile dual checklists for ingredients and step-by-step preparation notes.
  - `T1.R4.4`: Real-time non-mutating portion scaler (`Base`, `×2`, `×5`, `25 pax`, `50 pax`).
  - `T1.R4.5`: Unit fidelity in kitchen view (`g/ml`, `ud`, `kg/L`).
- **R5: Consolidated Recipe Book Generator (5 tests)**:
  - `T1.R5.1`: Multi-recipe selection schema for selective or complete catalog compilation.
  - `T1.R5.2`: Executive culinary cover page generation with title, date, and recipe count.
  - `T1.R5.3`: Dynamic Table of Contents (TOC) with internal anchor links (`#doc-{id}`).
  - `T1.R5.4`: Standardized APPCC/HACCP technical sheets with temperature thresholds and sign-offs.
  - `T1.R5.5`: Multi-format compilation engine ready for `window.print`, HTML download, and PDF.
- **R6: Code Quality, SW Caching & PWA Rules (5 tests)**:
  - `T1.R6.1`: Mandatory AST syntax verification via Node `vm.Script` (Rule 3).
  - `T1.R6.2`: Service Worker `controllerchange` event listener preservation with reload guard (Rule 4).
  - `T1.R6.3`: Service Worker lifecycle hooks (`self.skipWaiting()` and `self.clients.claim()`).
  - `T1.R6.4`: Service Worker precache bundle integrity (`xlsx.full.min.js`, `html2pdf.bundle.min.js`).
  - `T1.R6.5`: Single-file architecture: Zero unbundled external local scripts.

### Tier 2: Boundary & Corner Cases (10 Test Cases)
Edge condition and robustness testing:
- `T2.1`: Empty ingredients list calculates 0 cost without `NaN` or `Infinity`.
- `T2.2`: Zero or negative portions clamped to minimum 1 in math formulas.
- `T2.3`: Zero or negative `yieldQty` in sub-recipes handled safely without division by zero.
- `T2.4`: Multi-tier circular reference detection ($A \to B \to C \to A$).
- `T2.5`: CSV parsing with complex quotes, embedded commas, and irregular empty lines.
- `T2.6`: Extreme scaling factors (0.001 micro-batch to 10,000 banquet pax).
- `T2.7`: Waste percentage boundaries (0% vs 99% vs rejection at 100%).
- `T2.8`: Special characters, accented names, and HTML/XSS sanitization.
- `T2.9`: Corrupted or incomplete snapshot recovery via `_ensureSchema`.
- `T2.10`: Discrete unit scaling (`unit: 'ud'`) with fractional portion multipliers.

### Tier 3: Cross-Feature Combinations (5 Test Cases)
Inter-module contract verifications:
- `T3.1`: Sub-recipe updated by Vendor Price Import cascading into dependent dishes (R1 + R2).
- `T3.2`: Sub-recipe consumed in Kitchen Tablet Mode with live portion scaling (R1 + R4).
- `T3.3`: Sub-recipe compiled into Consolidated Recipe Book with distinct badges (R1 + R5).
- `T3.4`: Vendor Price Import synchronized across Snapshot Cloud Backup (R2 + R3).
- `T3.5`: Multi-tier allergen inheritance into APPCC Technical Sheet (R1 + R5).

### Tier 4: Real-World Scenarios (2 Comprehensive Workflows)
End-to-end production pipelines:
- `T4.1`: **Michelin-Star Restaurant Workflow**:
  1. Base Sauce ("Fondo Oscuro Reducido") defined and unit priced (5.20 €/L).
  2. 3 Main Courses configured consuming the sauce ("Solomillo Rossini", "Carrillera Glaseada", "Arroz Meloso de Pichón").
  3. Butcher price increases imported via CSV (+28.6% bones, +12.5% beef).
  4. Global cascade recalculation updates sauce to 6.20 €/L and recalculates all 3 dishes.
  5. Executive chef scales banquet dinner batch to 120 pax without mutating base recipes.
  6. Complete technical recipe book compiled with Cover, TOC, and APPCC sheets.
- `T4.2`: **Multi-Unit Luxury Hotel Sync & APPCC Audit Protocol**:
  1. Central kitchen exports Master Snapshot with corporate recipes and metadata.
  2. Satellite resort kitchen receives snapshot and performs Selective Merge to keep local dishes.
  3. Health inspection audit protocol generates consolidated APPCC sheets with temperature thresholds and allergen declarations.

---

## 5. Running the Tests
To run the full test suite from the terminal:

```bash
node tests/run_tests.js
```

### Exit Codes:
- `0`: All tests passed (100% success rate).
- `1`: One or more tests failed (failure breakdown printed to stdout).
