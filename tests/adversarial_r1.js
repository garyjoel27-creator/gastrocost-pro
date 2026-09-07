/**
 * GastroCost PRO — Adversarial Stress Test Suite for Milestone 1 (R1)
 * Hierarchical Sub-recipes & Cascade Recalculation Engine
 *
 * This test suite stresses:
 *  1. Deep multi-tier sub-recipe chains (D -> C -> B -> A)
 *  2. Diamond and multi-path dependencies (D -> B, D -> C -> B -> A)
 *  3. Circular dependencies (direct A->A, 2-node A->B->A, 3-node A->B->C->A, 4-node A->B->C->D->A)
 *  4. Mixed unit conversions (g, kg, ml, L, ud) and unit mutations
 *  5. Edge cases: zero/negative yields, empty ingredients, missing IDs, allergen inheritance
 *  6. API signature contract compliance (_isDescendantOf parameter ordering)
 *
 * Usage:
 *   node tests/adversarial_r1.js
 */

const assert = require('assert');
const { loadGastroCostApp } = require('./harness');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  findings: []
};

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    results.failed++;
    results.findings.push({ name, error: err.message, stack: err.stack });
    console.log(`  ✗ FAIL: ${name}`);
    console.log(`    Error: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(' GASTROCOST PRO — ADVERSARIAL R1 STRESS TEST SUITE');
console.log('======================================================\n');

// -----------------------------------------------------------
// SUITE 1: Deep Multi-Tier Cascade Chains (D -> C -> B -> A)
// -----------------------------------------------------------
console.log('► SUITE 1: Deep Multi-Tier Cascade Chains');

test('1.1: 4-tier linear cascade propagation (D -> C -> B -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  // Tier 4: Base Broth (D)
  app.db.recipes['rec-d'] = {
    id: 'rec-d',
    config: { dishName: 'Base Broth D', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'id1', name: 'Raw Herb', net: 1000, waste: 0, gross: 1000, originalPrice: 10.00, cost: 10.00, unit: 'g', allergens: ['nuts'] }
    ]
  };

  // Tier 3: Reduced Demi-Glace (C) consumes D (500g)
  app.db.recipes['rec-c'] = {
    id: 'rec-c',
    config: { dishName: 'Demi-Glace C', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'ic1', name: 'Base Broth D', subRecipeId: 'rec-d', isSubRecipe: true, net: 500, waste: 0, gross: 500, originalPrice: 10.00, cost: 5.00, unit: 'g', allergens: ['nuts'] },
      { id: 'ic2', name: 'Water', net: 500, waste: 0, gross: 500, originalPrice: 0, cost: 0, unit: 'g', allergens: [] }
    ]
  };

  // Tier 2: Sauce Espagnole (B) consumes C (400g)
  app.db.recipes['rec-b'] = {
    id: 'rec-b',
    config: { dishName: 'Sauce Espagnole B', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'ib1', name: 'Demi-Glace C', subRecipeId: 'rec-c', isSubRecipe: true, net: 400, waste: 0, gross: 400, originalPrice: 5.00, cost: 2.00, unit: 'g', allergens: ['nuts'] }
    ]
  };

  // Tier 1: Final Dish Steak with Sauce (A) consumes B (250g)
  app.db.recipes['rec-a'] = {
    id: 'rec-a',
    config: { dishName: 'Steak Dish A', isSubRecipe: false, portions: 4 },
    ingredients: [
      { id: 'ia1', name: 'Beef Tenderloin', net: 800, waste: 0, gross: 800, originalPrice: 30.00, cost: 24.00, unit: 'g', allergens: [] },
      { id: 'ia2', name: 'Sauce Espagnole B', subRecipeId: 'rec-b', isSubRecipe: true, net: 250, waste: 0, gross: 250, originalPrice: 2.00, cost: 0.50, unit: 'g', allergens: ['nuts'] }
    ]
  };

  // Initial cost verification
  assert.strictEqual(app._getSubRecipeNormalizedPrice(app.db.recipes['rec-d']), 10.00, 'D price should be 10.00 €/kg');
  assert.strictEqual(app._getSubRecipeNormalizedPrice(app.db.recipes['rec-c']), 5.00, 'C price should be 5.00 €/kg');
  assert.strictEqual(app._getSubRecipeNormalizedPrice(app.db.recipes['rec-b']), 2.00, 'B price should be 2.00 €/kg');

  // Trigger price jump in Base D: Raw Herb from 10.00 to 40.00 €/kg
  app.db.recipes['rec-d'].ingredients[0].originalPrice = 40.00;
  app.db.recipes['rec-d'].ingredients[0].cost = 40.00;

  // Run cascade
  app._recalculateCascade('rec-d');

  // Verify D
  const priceD = app._getSubRecipeNormalizedPrice(app.db.recipes['rec-d']);
  assert.strictEqual(priceD, 40.00, `D price must be 40.00 €/kg, got ${priceD}`);

  // Verify C: 500g of D @ 40€/kg = 20.00€ batch cost. Yield 1000g -> 20.00 €/kg
  const ingC = app.db.recipes['rec-c'].ingredients.find(i => i.subRecipeId === 'rec-d');
  assert.strictEqual(ingC.originalPrice, 40.00, `C's ing D originalPrice must be 40.00, got ${ingC.originalPrice}`);
  assert.strictEqual(ingC.cost, 20.00, `C's ing D cost must be 20.00, got ${ingC.cost}`);
  const priceC = app._getSubRecipeNormalizedPrice(app.db.recipes['rec-c']);
  assert.strictEqual(priceC, 20.00, `C price must be 20.00 €/kg, got ${priceC}`);

  // Verify B: 400g of C @ 20€/kg = 8.00€ batch cost. Yield 1000g -> 8.00 €/kg
  const ingB = app.db.recipes['rec-b'].ingredients.find(i => i.subRecipeId === 'rec-c');
  assert.strictEqual(ingB.originalPrice, 20.00, `B's ing C originalPrice must be 20.00, got ${ingB.originalPrice}`);
  assert.strictEqual(ingB.cost, 8.00, `B's ing C cost must be 8.00, got ${ingB.cost}`);
  const priceB = app._getSubRecipeNormalizedPrice(app.db.recipes['rec-b']);
  assert.strictEqual(priceB, 8.00, `B price must be 8.00 €/kg, got ${priceB}`);

  // Verify A: 250g of B @ 8€/kg = 2.00€ cost
  const ingA = app.db.recipes['rec-a'].ingredients.find(i => i.subRecipeId === 'rec-b');
  assert.strictEqual(ingA.originalPrice, 8.00, `A's ing B originalPrice must be 8.00, got ${ingA.originalPrice}`);
  assert.strictEqual(ingA.cost, 2.00, `A's ing B cost must be 2.00, got ${ingA.cost}`);
});

test('1.2: Diamond cascade dependency (D -> B and D -> C -> B -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  // D: Base ingredient
  app.db.recipes['recipe-d'] = {
    id: 'recipe-d',
    config: { dishName: 'Base D', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'id1', name: 'Raw Stock', net: 1000, waste: 0, gross: 1000, originalPrice: 10.00, cost: 10.00, unit: 'g', allergens: [] }
    ]
  };

  // C: Consumes D (500g)
  app.db.recipes['recipe-c'] = {
    id: 'recipe-c',
    config: { dishName: 'Sauce C', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'ic1', name: 'Base D', subRecipeId: 'recipe-d', isSubRecipe: true, net: 500, waste: 0, gross: 500, originalPrice: 10.00, cost: 5.00, unit: 'g', allergens: [] }
    ]
  };

  // B: Consumes BOTH D (200g) and C (500g) -> Diamond!
  // Alphabetically 'recipe-b' comes before 'recipe-c' in Object.values(this.db.recipes)
  app.db.recipes['recipe-b'] = {
    id: 'recipe-b',
    config: { dishName: 'Composite B', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: 'ib1', name: 'Base D', subRecipeId: 'recipe-d', isSubRecipe: true, net: 200, waste: 0, gross: 200, originalPrice: 10.00, cost: 2.00, unit: 'g', allergens: [] },
      { id: 'ib2', name: 'Sauce C', subRecipeId: 'recipe-c', isSubRecipe: true, net: 500, waste: 0, gross: 500, originalPrice: 5.00, cost: 2.50, unit: 'g', allergens: [] }
    ]
  };

  // A: Consumes B (1000g)
  app.db.recipes['recipe-a'] = {
    id: 'recipe-a',
    config: { dishName: 'Final Dish A', isSubRecipe: false, portions: 1 },
    ingredients: [
      { id: 'ia1', name: 'Composite B', subRecipeId: 'recipe-b', isSubRecipe: true, net: 1000, waste: 0, gross: 1000, originalPrice: 4.50, cost: 4.50, unit: 'g', allergens: [] }
    ]
  };

  // Initial B batch cost = 2.00 + 2.50 = 4.50 €. Normalized = 4.50 €/kg.
  assert.strictEqual(app._getSubRecipeNormalizedPrice(app.db.recipes['recipe-b']), 4.50);

  // D price doubles: 10.00 -> 20.00 €/kg
  app.db.recipes['recipe-d'].ingredients[0].originalPrice = 20.00;
  app.db.recipes['recipe-d'].ingredients[0].cost = 20.00;

  // Run cascade from D
  app._recalculateCascade('recipe-d');

  // Expected new values:
  // D = 20.00 €/kg
  // C batch cost: (500/1000)*20 = 10.00 € -> C normalized = 10.00 €/kg
  // B batch cost:
  //   from D: (200/1000)*20 = 4.00 €
  //   from C: (500/1000)*10 = 5.00 €
  //   total B = 9.00 € -> B normalized = 9.00 €/kg
  // A's ingredient B:
  //   net: 1000g @ 9.00 €/kg -> cost = 9.00 €
  const finalPriceC = app._getSubRecipeNormalizedPrice(app.db.recipes['recipe-c']);
  const finalPriceB = app._getSubRecipeNormalizedPrice(app.db.recipes['recipe-b']);
  const ingA = app.db.recipes['recipe-a'].ingredients[0];

  assert.strictEqual(finalPriceC, 10.00, `C price should be 10.00, got ${finalPriceC}`);
  assert.strictEqual(finalPriceB, 9.00, `B price should be 9.00, got ${finalPriceB}`);
  assert.strictEqual(ingA.originalPrice, 9.00, `A's ing B price must be 9.00, got ${ingA.originalPrice}`);
  assert.strictEqual(ingA.cost, 9.00, `A's ing B cost must be 9.00, got ${ingA.cost}`);
});

// -----------------------------------------------------------
// SUITE 2: Circular Dependency Detection
// -----------------------------------------------------------
console.log('\n► SUITE 2: Circular Dependency Detection');

test('2.1: Direct self-reference cycle detection (A -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  app.db.recipes['rec-self'] = {
    id: 'rec-self',
    config: { dishName: 'Self Recipe', isSubRecipe: true },
    ingredients: []
  };

  const isSelfCycle1 = app._isDescendantOf('rec-self', 'rec-self');
  assert.strictEqual(isSelfCycle1, true, '_isDescendantOf with same ID must return true');
});

test('2.2: Two-node cycle detection (A -> B, attempting B -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  app.db.recipes['rec-a'] = {
    id: 'rec-a',
    config: { dishName: 'Receta A', isSubRecipe: true },
    ingredients: [{ id: 'i1', name: 'Receta B', subRecipeId: 'rec-b' }]
  };
  app.db.recipes['rec-b'] = {
    id: 'rec-b',
    config: { dishName: 'Receta B', isSubRecipe: true },
    ingredients: []
  };

  // Internal UI usage: _isDescendantOf(candidateSubRecipeId, currentDishId)
  // When editing rec-b, user attempts to add rec-a.
  // candidate is rec-a, current dish is rec-b. Does rec-a reach rec-b? YES!
  const uiCycleBlocked = app._isDescendantOf('rec-a', 'rec-b');
  assert.strictEqual(uiCycleBlocked, true, 'rec-a contains rec-b, so adding rec-a to rec-b must be detected as cycle');
});

test('2.3: Three-node cycle detection (A -> B -> C, attempting C -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  app.db.recipes['rec-a'] = {
    id: 'rec-a',
    config: { dishName: 'Receta A', isSubRecipe: true },
    ingredients: [{ id: 'i1', name: 'Receta B', subRecipeId: 'rec-b' }]
  };
  app.db.recipes['rec-b'] = {
    id: 'rec-b',
    config: { dishName: 'Receta B', isSubRecipe: true },
    ingredients: [{ id: 'i2', name: 'Receta C', subRecipeId: 'rec-c' }]
  };
  app.db.recipes['rec-c'] = {
    id: 'rec-c',
    config: { dishName: 'Receta C', isSubRecipe: true },
    ingredients: []
  };

  // In rec-c, attempting to add rec-a
  const cycle3 = app._isDescendantOf('rec-a', 'rec-c');
  assert.strictEqual(cycle3, true, 'Must detect 3-node cycle A -> B -> C -> A');
});

test('2.4: Four-node cycle detection (A -> B -> C -> D, attempting D -> A)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  app.db.recipes['rec-a'] = {
    id: 'rec-a',
    config: { dishName: 'Receta A', isSubRecipe: true },
    ingredients: [{ id: 'i1', name: 'Receta B', subRecipeId: 'rec-b' }]
  };
  app.db.recipes['rec-b'] = {
    id: 'rec-b',
    config: { dishName: 'Receta B', isSubRecipe: true },
    ingredients: [{ id: 'i2', name: 'Receta C', subRecipeId: 'rec-c' }]
  };
  app.db.recipes['rec-c'] = {
    id: 'rec-c',
    config: { dishName: 'Receta C', isSubRecipe: true },
    ingredients: [{ id: 'i3', name: 'Receta D', subRecipeId: 'rec-d' }]
  };
  app.db.recipes['rec-d'] = {
    id: 'rec-d',
    config: { dishName: 'Receta D', isSubRecipe: true },
    ingredients: []
  };

  // In rec-d, attempting to add rec-a
  const cycle4 = app._isDescendantOf('rec-a', 'rec-d');
  assert.strictEqual(cycle4, true, 'Must detect 4-node cycle A -> B -> C -> D -> A');

  // In rec-d, attempting to add rec-b
  const cycleMid = app._isDescendantOf('rec-b', 'rec-d');
  assert.strictEqual(cycleMid, true, 'Must detect cycle B -> C -> D -> B');
});

test('2.5: Specification & Interface Contract Check: _isDescendantOf parameter ordering', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  // CONTRACT from PROJECT.md line 66:
  // _isDescendantOf(targetRecipeId, candidateSubRecipeId): returns boolean to prevent circular references.
  // And Tier 1 Test T1.R1.5 line 174:
  // const isCycle = app._isDescendantOf('rec-b', 'rec-a');
  // assert.strictEqual(isCycle, true, 'Must detect circular reference B -> A when A already consumes B');

  app.db.recipes['rec-a'] = {
    id: 'rec-a',
    config: { dishName: 'Receta A', isSubRecipe: true },
    ingredients: [{ id: 'i1', name: 'Receta B', subRecipeId: 'rec-b' }]
  };
  app.db.recipes['rec-b'] = {
    id: 'rec-b',
    config: { dishName: 'Receta B', isSubRecipe: true },
    ingredients: []
  };

  const contractResult = app._isDescendantOf('rec-b', 'rec-a');
  assert.strictEqual(contractResult, true, 'PROJECT.md & Tier 1 contract expects _isDescendantOf(targetRecipeId, candidateSubRecipeId) to return true when candidate contains target');
});

// -----------------------------------------------------------
// SUITE 3: Mixed Unit Conversions & Unit Mutations
// -----------------------------------------------------------
console.log('\n► SUITE 3: Mixed Unit Conversions & Unit Mutations');

test('3.1: Sub-recipe yield in grams (g)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const r = {
    id: 'sub-g',
    config: { dishName: 'Base Grams', isSubRecipe: true, yieldQty: 500, yieldUnit: 'g' },
    ingredients: [{ id: '1', net: 500, waste: 0, gross: 500, originalPrice: 10.00, cost: 5.00, unit: 'g' }]
  };
  app.db.recipes['sub-g'] = r;
  // Batch cost: 5.00 €. Yield: 500 g. Normalized: (5 / 500) * 1000 = 10.00 €/kg
  assert.strictEqual(app._getSubRecipeNormalizedPrice(r), 10.00);
  assert.strictEqual(app._getSubRecipeCatalogUnit(r), 'g');
});

test('3.2: Sub-recipe yield in kilograms (kg)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const r = {
    id: 'sub-kg',
    config: { dishName: 'Base Kg', isSubRecipe: true, yieldQty: 2.5, yieldUnit: 'kg' },
    ingredients: [{ id: '1', net: 2500, waste: 0, gross: 2500, originalPrice: 6.00, cost: 15.00, unit: 'g' }]
  };
  app.db.recipes['sub-kg'] = r;
  // Batch cost: 15.00 €. Yield: 2.5 kg. Normalized: 15 / 2.5 = 6.00 €/kg
  assert.strictEqual(app._getSubRecipeNormalizedPrice(r), 6.00);
  assert.strictEqual(app._getSubRecipeCatalogUnit(r), 'g');
});

test('3.3: Sub-recipe yield in milliliters (ml)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const r = {
    id: 'sub-ml',
    config: { dishName: 'Base ml', isSubRecipe: true, yieldQty: 250, yieldUnit: 'ml' },
    ingredients: [{ id: '1', net: 250, waste: 0, gross: 250, originalPrice: 8.00, cost: 2.00, unit: 'g' }]
  };
  app.db.recipes['sub-ml'] = r;
  // Batch cost: 2.00 €. Yield: 250 ml. Normalized: (2 / 250) * 1000 = 8.00 €/L
  assert.strictEqual(app._getSubRecipeNormalizedPrice(r), 8.00);
  assert.strictEqual(app._getSubRecipeCatalogUnit(r), 'g');
});

test('3.4: Sub-recipe yield in liters (L)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const r = {
    id: 'sub-l',
    config: { dishName: 'Base Liters', isSubRecipe: true, yieldQty: 5, yieldUnit: 'L' },
    ingredients: [{ id: '1', net: 5000, waste: 0, gross: 5000, originalPrice: 4.00, cost: 20.00, unit: 'g' }]
  };
  app.db.recipes['sub-l'] = r;
  // Batch cost: 20.00 €. Yield: 5 L. Normalized: 20 / 5 = 4.00 €/L
  assert.strictEqual(app._getSubRecipeNormalizedPrice(r), 4.00);
  assert.strictEqual(app._getSubRecipeCatalogUnit(r), 'g');
});

test('3.5: Sub-recipe yield in discrete units (ud)', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const r = {
    id: 'sub-ud',
    config: { dishName: 'Base Croquetas', isSubRecipe: true, yieldQty: 20, yieldUnit: 'ud' },
    ingredients: [{ id: '1', net: 1000, waste: 0, gross: 1000, originalPrice: 10.00, cost: 10.00, unit: 'g' }]
  };
  app.db.recipes['sub-ud'] = r;
  // Batch cost: 10.00 €. Yield: 20 ud. Normalized: 10 / 20 = 0.50 €/ud
  assert.strictEqual(app._getSubRecipeNormalizedPrice(r), 0.50);
  assert.strictEqual(app._getSubRecipeCatalogUnit(r), 'ud');
});

test('3.6: Dynamic mutation of yieldUnit from ud to g updates dependent ingredient formulas', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  // Sub-recipe in units (ud)
  app.db.recipes['sub-patty'] = {
    id: 'sub-patty',
    config: { dishName: 'Burger Patty', isSubRecipe: true, yieldQty: 10, yieldUnit: 'ud' },
    ingredients: [{ id: '1', net: 1500, waste: 0, gross: 1500, originalPrice: 10.00, cost: 15.00, unit: 'g' }]
  };

  // Dish consuming 2 patties
  app.db.recipes['dish-burger'] = {
    id: 'dish-burger',
    config: { dishName: 'Double Burger', isSubRecipe: false },
    ingredients: [
      { id: 'ing-p', name: 'Burger Patty', subRecipeId: 'sub-patty', isSubRecipe: true, net: 2, waste: 0, gross: 2, originalPrice: 1.50, cost: 3.00, unit: 'ud' }
    ]
  };

  // Mutate sub-recipe to grams (1500g yield)
  app.db.recipes['sub-patty'].config.yieldQty = 1500;
  app.db.recipes['sub-patty'].config.yieldUnit = 'g';

  app._recalculateCascade('sub-patty');

  const updatedIng = app.db.recipes['dish-burger'].ingredients[0];
  // Unit should update to 'g'
  assert.strictEqual(updatedIng.unit, 'g', 'Ingredient unit must update from ud to g');
  // Normalized price: 15€ / 1500g * 1000 = 10.00 €/kg
  assert.strictEqual(updatedIng.originalPrice, 10.00, 'Normalized price must be 10.00 €/kg');
});

// -----------------------------------------------------------
// SUITE 4: Edge Cases & Robustness
// -----------------------------------------------------------
console.log('\n► SUITE 4: Edge Cases & Robustness');

test('4.1: Zero and negative yieldQty handled safely without NaN or Infinity', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const rZero = {
    id: 'sub-zero',
    config: { dishName: 'Zero Yield', isSubRecipe: true, yieldQty: 0, yieldUnit: 'g' },
    ingredients: [{ id: '1', net: 100, waste: 0, gross: 100, originalPrice: 10.00, cost: 1.00, unit: 'g' }]
  };
  const priceZero = app._getSubRecipeNormalizedPrice(rZero);
  assert(isFinite(priceZero), 'Zero yield must produce finite price');
  assert(!isNaN(priceZero), 'Zero yield must not be NaN');

  const rNeg = {
    id: 'sub-neg',
    config: { dishName: 'Neg Yield', isSubRecipe: true, yieldQty: -500, yieldUnit: 'kg' },
    ingredients: [{ id: '1', net: 100, waste: 0, gross: 100, originalPrice: 10.00, cost: 1.00, unit: 'g' }]
  };
  const priceNeg = app._getSubRecipeNormalizedPrice(rNeg);
  assert(isFinite(priceNeg), 'Negative yield must produce finite price');
  assert(!isNaN(priceNeg), 'Negative yield must not be NaN');
});

test('4.2: Empty ingredients list in sub-recipe calculates 0 cost without crashing', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  const rEmpty = {
    id: 'sub-empty',
    config: { dishName: 'Empty Base', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: []
  };
  const batchCost = app._calculateBatchCost(rEmpty);
  assert.strictEqual(batchCost, 0, 'Empty subrecipe batch cost must be 0');
  const normPrice = app._getSubRecipeNormalizedPrice(rEmpty);
  assert.strictEqual(normPrice, 0, 'Empty subrecipe normalized price must be 0');
});

test('4.3: Allergen inheritance across multi-tier sub-recipes and cascade updates', () => {
  const { GC, gc } = loadGastroCostApp();
  const app = gc || new GC();

  // Sub C with 'gluten' and 'egg'
  app.db.recipes['sub-c'] = {
    id: 'sub-c',
    config: { dishName: 'Sub C', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: '1', name: 'Flour', net: 500, waste: 0, gross: 500, originalPrice: 1, cost: 0.5, unit: 'g', allergens: ['gluten'] },
      { id: '2', name: 'Egg', net: 2, waste: 0, gross: 2, originalPrice: 0.3, cost: 0.6, unit: 'ud', allergens: ['egg'] }
    ]
  };

  // Sub B consumes Sub C
  app.db.recipes['sub-b'] = {
    id: 'sub-b',
    config: { dishName: 'Sub B', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
    ingredients: [
      { id: '3', name: 'Sub C', subRecipeId: 'sub-c', isSubRecipe: true, net: 500, waste: 0, gross: 500, originalPrice: 1.1, cost: 0.55, unit: 'g', allergens: ['gluten', 'egg'] },
      { id: '4', name: 'Shrimp', net: 200, waste: 0, gross: 200, originalPrice: 20, cost: 4, unit: 'g', allergens: ['crustacean'] }
    ]
  };

  const allergensB = app._getSubRecipeAllergens(app.db.recipes['sub-b']);
  assert(allergensB.includes('gluten'), 'B must inherit gluten from C');
  assert(allergensB.includes('egg'), 'B must inherit egg from C');
  assert(allergensB.includes('crustacean'), 'B must include crustacean from Shrimp');

  // Now add 'fish' to Sub C and trigger cascade
  app.db.recipes['sub-c'].ingredients.push({
    id: '5', name: 'Fish sauce', net: 50, waste: 0, gross: 50, originalPrice: 5, cost: 0.25, unit: 'g', allergens: ['fish']
  });

  app._recalculateCascade('sub-c');

  const updatedIngCInB = app.db.recipes['sub-b'].ingredients.find(i => i.subRecipeId === 'sub-c');
  assert(updatedIngCInB.allergens.includes('fish'), 'B ingredient row for C must now include fish');

  const newAllergensB = app._getSubRecipeAllergens(app.db.recipes['sub-b']);
  assert(newAllergensB.includes('fish'), 'B must now inherit fish from C');
});

// -----------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------
console.log('\n======================================================');
console.log(` SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
console.log('======================================================\n');

if (results.failed > 0) {
  console.log('FAILED TESTS:');
  results.findings.forEach(f => {
    console.log(` - ${f.name}: ${f.error}`);
  });
}
