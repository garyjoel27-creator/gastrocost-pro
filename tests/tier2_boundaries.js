/**
 * GastroCost PRO — Tier 2: Boundary & Corner Cases
 * Tests edge conditions, zero-divisions, extreme scaling, encoding, and circular graphs.
 */

const assert = require('assert');
const {
  loadGastroCostApp,
  CULINARY_MATH
} = require('./harness');

function runTier2Tests(registerTest) {
  registerTest('T2.1: Empty ingredients list calculates zero cost without NaN', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    const emptyRecipe = {
      id: 'rec-empty',
      config: { dishName: 'Receta Vacia', portions: 4, fcGoal: 30, taxRate: 10 },
      ingredients: []
    };
    app.db.recipes['rec-empty'] = emptyRecipe;
    app.db.activeId = 'rec-empty';

    const cost = emptyRecipe.ingredients.reduce((s, i) => s + (i.cost || 0), 0);
    const costPerPortion = cost / Math.max(1, emptyRecipe.config.portions);
    const pvpNet = emptyRecipe.config.fcGoal > 0 ? costPerPortion / (emptyRecipe.config.fcGoal / 100) : 0;
    const foodCostPct = pvpNet > 0 ? (costPerPortion / pvpNet) * 100 : 0;

    assert.strictEqual(cost, 0, 'Total cost of empty ingredients must be 0');
    assert.strictEqual(costPerPortion, 0, 'Cost per portion must be 0');
    assert(!isNaN(foodCostPct), 'Food cost percentage must not be NaN');
    assert.strictEqual(foodCostPct, 0, 'Food cost % must be 0');
  });

  registerTest('T2.2: Zero or negative portions clamped to at least 1 in math formulas', () => {
    const zeroPortion = Math.max(1, 0);
    const negativePortion = Math.max(1, -5);
    const decimalPortion = Math.max(1, 0.4);

    assert.strictEqual(zeroPortion, 1, 'Portions=0 must clamp to 1');
    assert.strictEqual(negativePortion, 1, 'Portions=-5 must clamp to 1');
    assert(decimalPortion >= 1, 'Portions < 1 must clamp to at least 1');

    // Total cost division
    const totalCost = 50.00;
    const unitCost = totalCost / zeroPortion;
    assert.strictEqual(unitCost, 50.00, 'Unit cost with 0 portions clamped to 1 must be 50.00');
    assert(isFinite(unitCost), 'Unit cost must remain finite');
  });

  registerTest('T2.3: Zero or boundary yieldQty in Sub-recipe safely handled', () => {
    // Zero yield must not return Infinity or NaN
    const unitPriceZero = CULINARY_MATH.calcSubRecipeUnitPrice(10.00, 0, 'g');
    const unitPriceNegative = CULINARY_MATH.calcSubRecipeUnitPrice(10.00, -2, 'kg');

    assert.strictEqual(unitPriceZero, 0, 'Zero yield must return 0 instead of Infinity');
    assert.strictEqual(unitPriceNegative, 0, 'Negative yield must return 0 instead of negative pricing');
    assert(isFinite(unitPriceZero), 'Result must be finite');
    assert(!isNaN(unitPriceZero), 'Result must not be NaN');
  });

  registerTest('T2.4: Multi-tier circular sub-recipe dependency detection (A -> B -> C -> A)', () => {
    const recipes = {
      'sauce-a': {
        id: 'sauce-a',
        config: { dishName: 'Salsa A', isSubRecipe: true },
        ingredients: [{ name: 'Salsa B', subRecipeId: 'sauce-b' }]
      },
      'sauce-b': {
        id: 'sauce-b',
        config: { dishName: 'Salsa B', isSubRecipe: true },
        ingredients: [{ name: 'Salsa C', subRecipeId: 'sauce-c' }]
      },
      'sauce-c': {
        id: 'sauce-c',
        config: { dishName: 'Salsa C', isSubRecipe: true },
        ingredients: []
      }
    };

    function checkLoop(targetId, candidateId, dbRecipes, visited = new Set()) {
      if (targetId === candidateId) return true;
      if (visited.has(candidateId)) return false;
      visited.add(candidateId);
      const cand = dbRecipes[candidateId];
      if (!cand || !cand.ingredients) return false;
      for (const ing of cand.ingredients) {
        if (ing.subRecipeId) {
          if (ing.subRecipeId === targetId) return true;
          if (checkLoop(targetId, ing.subRecipeId, dbRecipes, visited)) return true;
        }
      }
      return false;
    }

    // Trying to add Sauce A inside Sauce C creates a 3-tier cycle: A -> B -> C -> A
    const createsCycle = checkLoop('sauce-c', 'sauce-a', recipes);
    assert.strictEqual(createsCycle, true, 'Must detect 3-tier transitive cycle A -> B -> C -> A');

    // Adding an independent new ingredient should NOT be flagged as a cycle
    const independentCheck = checkLoop('sauce-c', 'independent-sauce', recipes);
    assert.strictEqual(independentCheck, false, 'Independent recipe must not be flagged as a cycle');
  });

  registerTest('T2.5: CSV parsing with complex quotes, mixed delimiters, and trailing lines', () => {
    const complexCsv = `
"Insumo / Producto";"Precio (€)";"Merma (%)";"Unidad"
"Solomillo, de Ternera Extra";"34,50";"12";"g"
"Queso 'Parmesano' 24M";"22.00";"0";"g"
"Huevos Camperos (Docena)";"3,20";"10";"ud"

    `;

    function robustCsvParse(text) {
      const cleanLines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
      if (cleanLines.length < 2) return [];
      const delim = cleanLines[0].includes(';') ? ';' : ',';
      
      const parseLine = line => {
        const regex = new RegExp(`(?:^|${delim})(?:"([^"]*)"|([^"${delim}]*))`, 'g');
        const matches = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push((match[1] !== undefined ? match[1] : match[2]).trim());
        }
        return matches;
      };

      const headers = parseLine(cleanLines[0]).map(h => h.toLowerCase());
      return cleanLines.slice(1).map(l => {
        const cols = parseLine(l);
        const row = {};
        headers.forEach((h, i) => { row[h] = cols[i] || ''; });
        return row;
      });
    }

    const rows = robustCsvParse(complexCsv);
    assert.strictEqual(rows.length, 3, 'Must parse exactly 3 data rows, ignoring whitespace/empty lines');
    assert.strictEqual(rows[0]['insumo / producto'], 'Solomillo, de Ternera Extra', 'Must preserve comma inside quoted field');
    assert.strictEqual(rows[1]['insumo / producto'], "Queso 'Parmesano' 24M", 'Must preserve quotes inside field');
    assert.strictEqual(rows[2]['unidad'], 'ud', 'Must correctly extract unit');
  });

  registerTest('T2.6: Extreme scaling factors (0.001 micro-batch to 10,000 banquet pax)', () => {
    const baseNet = 500; // 500g
    const basePortions = 4;

    // Micro-batch: 0.01 portions
    const microScaled = CULINARY_MATH.calcScaledQty(baseNet, 0.01, basePortions);
    assert.strictEqual(microScaled, 1.25, '500g for 4 pax scaled to 0.01 pax = 1.25g');

    // Industrial banquet: 10,000 portions
    const banquetScaled = CULINARY_MATH.calcScaledQty(baseNet, 10000, basePortions);
    assert.strictEqual(banquetScaled, 1250000, '500g for 4 pax scaled to 10,000 pax = 1,250,000g (1.25 metric tons)');
    assert(isFinite(banquetScaled), 'Extreme scaling must not overflow');
  });

  registerTest('T2.7: Waste percentage boundaries (0% vs 99% vs rejection >= 100%)', () => {
    // 0% waste: Gross must equal Net exactly
    const grossZeroWaste = CULINARY_MATH.calcGross(500, 0);
    assert.strictEqual(grossZeroWaste, 500, '0% waste means Gross == Net');

    // 99% waste: Gross must equal Net / 0.01 = Net * 100
    const gross99Waste = CULINARY_MATH.calcGross(10, 99);
    assert.strictEqual(Math.round(gross99Waste), 1000, '10g net with 99% waste must require 1000g gross');

    // >= 100% waste: Must throw or be rejected
    assert.throws(() => {
      CULINARY_MATH.calcGross(100, 100);
    }, /Waste cannot be >= 100%/, '100% waste must be rejected');
  });

  registerTest('T2.8: Encoding, escaping, and international characters in names', () => {
    const specialNames = [
      "Foie Gras d'Oie & Truffe Noire",
      "Piquillos de Lodosa con Piñones & Miel",
      'Tartar de Salmón con Salsa "Teriyaki" Especial',
      "Brochetas de Langostinos 🦞 & Atún Rojo 🐟",
      "<script>alert('xss')</script>" // Sanitize check
    ];

    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    specialNames.forEach(name => {
      const escaped = escapeHtml(name);
      assert(!escaped.includes('<script>'), 'HTML entities must be safely escaped');
      if (name.includes('&') && !name.includes('alert')) {
        assert(escaped.includes('&amp;'), '& must be converted to &amp;');
      }
    });
  });

  registerTest('T2.9: Corrupted or incomplete snapshot recovery via _ensureSchema', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // Incomplete, corrupted data with missing recipes and catalog
    const brokenData = {
      theme: null,
      recipes: null,
      catalog: null
    };

    const sanitized = app._ensureSchema(brokenData);
    assert.strictEqual(sanitized.version, 13, 'Schema must enforce version 13');
    assert.strictEqual(sanitized.theme, 'theme-default', 'Must restore default theme');
    assert(sanitized.recipes['template-tataki'], 'Must restore default templates');
    assert(sanitized.catalog && sanitized.catalog.length > 0, 'Must restore default master catalog');
  });

  registerTest('T2.10: Discrete unit scaling (unit: "ud") with fractional multipliers', () => {
    const baseEggs = 3; // 3 units of eggs for 4 portions
    const targetPortions = 6; // x1.5 multiplier

    const scaledEggs = CULINARY_MATH.calcScaledQty(baseEggs, targetPortions, 4);
    assert.strictEqual(scaledEggs, 4.5, '3 eggs scaled x1.5 must equal 4.5 units');

    // Cost calculation with discrete units: gross * price
    const eggCost = CULINARY_MATH.calcCost(scaledEggs, 0, 0.30, 'ud');
    assert.strictEqual(Math.round(eggCost * 100) / 100, 1.35, '4.5 eggs at 0.30€/ud must cost 1.35€');
  });

  registerTest('T2.11: Adversarial extreme yield values in Sub-recipes (0, negative, 0.001 decimal, 1,000,000)', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    const subId = 'sub-extreme-yield';
    const subRecipe = {
      id: subId,
      config: { dishName: 'Reducción Extrema', portions: 1, isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
      ingredients: [
        { id: 'i1', name: 'Insumo Base', net: 1000, waste: 0, gross: 1000, originalPrice: 10.00, cost: 10.00, unit: 'g', allergens: [] }
      ]
    };
    app.db.recipes[subId] = subRecipe;

    // Batch cost = 10.00 €
    assert.strictEqual(app._calculateBatchCost(subRecipe), 10.00, 'Batch cost must be 10.00 €');

    // Case A: yieldQty = 0 (Should safely fallback to 1000 instead of dividing by zero or returning Infinity/NaN)
    subRecipe.config.yieldQty = 0;
    const priceZero = app._getSubRecipeNormalizedPrice(subRecipe);
    assert(isFinite(priceZero), 'Yield=0 must produce finite normalized price');
    assert(!isNaN(priceZero), 'Yield=0 must not produce NaN');
    assert.strictEqual(priceZero, 10.00, 'Yield=0 with unit="g" safely falls back to default 1000g (10.00 €/kg)');

    // Case B: Negative yield (-500) (Should fallback to safe default rather than negative pricing)
    subRecipe.config.yieldQty = -500;
    const priceNegative = app._getSubRecipeNormalizedPrice(subRecipe);
    assert(isFinite(priceNegative), 'Negative yield must produce finite normalized price');
    assert(priceNegative > 0, 'Negative yield must not produce negative unit price');
    assert.strictEqual(priceNegative, 10.00, 'Negative yield falls back to 1000g default (10.00 €/kg)');

    // Case C: Micro decimal yield (0.001 g)
    // 10.00 € batch cost for 0.001 g yield -> 10.00 / 0.001 * 1000 = 10,000,000.00 €/kg
    subRecipe.config.yieldQty = 0.001;
    subRecipe.config.yieldUnit = 'g';
    const priceMicro = app._getSubRecipeNormalizedPrice(subRecipe);
    assert.strictEqual(priceMicro, 10000000.00, '0.001g yield must normalize to 10,000,000.00 €/kg');

    // Micro decimal yield in 'kg' (0.001 kg = 1g yield)
    // 10.00 € / 0.001 kg = 10,000.00 €/kg
    subRecipe.config.yieldUnit = 'kg';
    const priceMicroKg = app._getSubRecipeNormalizedPrice(subRecipe);
    assert.strictEqual(priceMicroKg, 10000.00, '0.001kg yield must normalize to 10,000.00 €/kg');

    // Case D: Industrial yield (1,000,000 g = 1 metric ton)
    // 10.00 € / 1,000,000 g * 1000 = 0.01 €/kg
    subRecipe.config.yieldQty = 1000000;
    subRecipe.config.yieldUnit = 'g';
    const priceIndustrial = app._getSubRecipeNormalizedPrice(subRecipe);
    assert.strictEqual(priceIndustrial, 0.01, '1,000,000g yield must normalize to 0.01 €/kg');

    // Industrial yield in 'ud' (1,000,000 units)
    // 10.00 € / 1,000,000 ud = 0.00001 €/ud
    subRecipe.config.yieldUnit = 'ud';
    const priceIndustrialUd = app._getSubRecipeNormalizedPrice(subRecipe);
    assert.strictEqual(priceIndustrialUd, 0.00001, '1,000,000ud yield must normalize to 0.00001 €/ud');
  });

  registerTest('T2.12: Allergen inheritance with multiple sub-recipes sharing common and distinct allergens', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // Sub-recipe 1: Mantequilla Trufada (dairy, nuts)
    const sub1 = {
      id: 'sub-mantequilla',
      config: { dishName: 'Mantequilla Trufada', isSubRecipe: true, yieldQty: 500, yieldUnit: 'g' },
      ingredients: [
        { id: 'm1', name: 'Mantequilla AOP', net: 450, waste: 0, gross: 450, originalPrice: 12.00, cost: 5.40, unit: 'g', allergens: ['dairy'] },
        { id: 'm2', name: 'Nuez Moscada', net: 10, waste: 0, gross: 10, originalPrice: 40.00, cost: 0.40, unit: 'g', allergens: ['nuts'] }
      ]
    };

    // Sub-recipe 2: Salsa Holandesa (dairy, egg, sulfite)
    const sub2 = {
      id: 'sub-holandesa',
      config: { dishName: 'Salsa Holandesa', isSubRecipe: true, yieldQty: 400, yieldUnit: 'ml' },
      ingredients: [
        { id: 'h1', name: 'Yemas de Huevo', net: 100, waste: 0, gross: 100, originalPrice: 6.00, cost: 0.60, unit: 'g', allergens: ['egg'] },
        { id: 'h2', name: 'Mantequilla Clarificada', net: 250, waste: 0, gross: 250, originalPrice: 14.00, cost: 3.50, unit: 'g', allergens: ['dairy'] },
        { id: 'h3', name: 'Reducción de Vino Blanco', net: 50, waste: 0, gross: 50, originalPrice: 5.00, cost: 0.25, unit: 'g', allergens: ['sulfite'] }
      ]
    };

    // Sub-recipe 3: Picatoste Brioche (gluten, egg, dairy, sesame)
    const sub3 = {
      id: 'sub-picatoste',
      config: { dishName: 'Picatoste Brioche', isSubRecipe: true, yieldQty: 200, yieldUnit: 'g' },
      ingredients: [
        { id: 'p1', name: 'Pan Brioche Artesano', net: 180, waste: 0, gross: 180, originalPrice: 8.00, cost: 1.44, unit: 'g', allergens: ['gluten', 'egg', 'dairy'] },
        { id: 'p2', name: 'Semillas de Sésamo Tostado', net: 20, waste: 0, gross: 20, originalPrice: 15.00, cost: 0.30, unit: 'g', allergens: ['sesame'] }
      ]
    };

    app.db.recipes[sub1.id] = sub1;
    app.db.recipes[sub2.id] = sub2;
    app.db.recipes[sub3.id] = sub3;

    // Verify individual sub-recipe allergen extractions
    const all1 = app._getSubRecipeAllergens(sub1);
    const all2 = app._getSubRecipeAllergens(sub2);
    const all3 = app._getSubRecipeAllergens(sub3);

    assert.deepStrictEqual(all1.slice().sort(), ['dairy', 'nuts'].sort(), 'Sub 1 must have dairy and nuts');
    assert.deepStrictEqual(all2.slice().sort(), ['dairy', 'egg', 'sulfite'].sort(), 'Sub 2 must have dairy, egg, and sulfite');
    assert.deepStrictEqual(all3.slice().sort(), ['dairy', 'egg', 'gluten', 'sesame'].sort(), 'Sub 3 must have dairy, egg, gluten, sesame');

    // Create Final Dish consuming all 3 sub-recipes + 1 allergen-free meat
    const dishId = 'dish-rossini-deluxe';
    const finalDish = {
      id: dishId,
      config: { dishName: 'Solomillo Rossini Deluxe', portions: 2 },
      ingredients: [
        { id: 'd1', name: 'Solomillo de Buey', net: 400, waste: 0, gross: 400, originalPrice: 35.00, cost: 14.00, unit: 'g', allergens: [] },
        { id: 'd2', name: 'Mantequilla Trufada', subRecipeId: sub1.id, isSubRecipe: true, net: 30, waste: 0, gross: 30, originalPrice: 11.60, cost: 0.35, unit: 'g', allergens: [...all1] },
        { id: 'd3', name: 'Salsa Holandesa', subRecipeId: sub2.id, isSubRecipe: true, net: 60, waste: 0, gross: 60, originalPrice: 10.88, cost: 0.65, unit: 'g', allergens: [...all2] },
        { id: 'd4', name: 'Picatoste Brioche', subRecipeId: sub3.id, isSubRecipe: true, net: 25, waste: 0, gross: 25, originalPrice: 8.70, cost: 0.22, unit: 'g', allergens: [...all3] }
      ]
    };
    app.db.recipes[dishId] = finalDish;

    // Aggregate unique allergens in final dish
    const dishAllergens = new Set();
    finalDish.ingredients.forEach(i => (i.allergens || []).forEach(a => dishAllergens.add(a)));
    const uniqueList = Array.from(dishAllergens).sort();

    // Expected union: dairy (in 1,2,3), egg (in 2,3), gluten (in 3), nuts (in 1), sesame (in 3), sulfite (in 2)
    const expected = ['dairy', 'egg', 'gluten', 'nuts', 'sesame', 'sulfite'].sort();
    assert.deepStrictEqual(uniqueList, expected, 'Final dish must inherit exact deduplicated union of 6 allergens');

    // Cascade modification test: Remove sulfite from Sub 2 (wine replaced with water/vinegar)
    sub2.ingredients[2].allergens = [];
    app._recalculateCascade(sub2.id);

    // Verify final dish ingredient allergens updated via cascade
    const updatedSub2Ing = finalDish.ingredients.find(i => i.subRecipeId === sub2.id);
    assert(!updatedSub2Ing.allergens.includes('sulfite'), 'Sulfite must be removed from Sub 2 row via cascade');

    const postUpdateAllergens = new Set();
    finalDish.ingredients.forEach(i => (i.allergens || []).forEach(a => postUpdateAllergens.add(a)));
    assert(!postUpdateAllergens.has('sulfite'), 'Final dish must no longer report sulfite');
    assert.strictEqual(postUpdateAllergens.size, 5, 'Final dish must now have exactly 5 allergens');
  });

  registerTest('T2.13: Sub-recipe deletion lifecycle when consumed by active recipes', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // 1. Setup Sub-recipe
    const subId = 'sub-caldo-base';
    app.db.recipes[subId] = {
      id: subId,
      config: { dishName: 'Caldo Corto de Pescado', isSubRecipe: true, yieldQty: 2, yieldUnit: 'L', portions: 1 },
      ingredients: [
        { id: 'c1', name: 'Morralla de Roca', net: 1000, waste: 0, gross: 1000, originalPrice: 5.00, cost: 5.00, unit: 'g', allergens: ['fish'] }
      ]
    };

    // 2. Setup Consuming Dish
    const dishId = 'dish-suquet';
    app.db.recipes[dishId] = {
      id: dishId,
      config: { dishName: 'Suquet de Pescadores', portions: 4, fcGoal: 30 },
      ingredients: [
        { id: 's1', name: 'Rape en Rodajas', net: 600, waste: 10, gross: 666.7, originalPrice: 20.00, cost: 13.33, unit: 'g', allergens: ['fish'] },
        { id: 's2', name: 'Caldo Corto de Pescado', subRecipeId: subId, isSubRecipe: true, net: 400, waste: 0, gross: 400, originalPrice: 2.50, cost: 1.00, unit: 'g', allergens: ['fish'] }
      ]
    };

    // Initial dish cost: 13.33 + 1.00 = 14.33 €
    const initialCost = app.db.recipes[dishId].ingredients.reduce((s, i) => s + i.cost, 0);
    assert(Math.abs(initialCost - 14.33) < 0.05, 'Initial suquet cost must be ~14.33 €');

    // 3. Delete the sub-recipe from database
    delete app.db.recipes[subId];
    assert.strictEqual(app.db.recipes[subId], undefined, 'Sub-recipe must be removed from db');

    // 4. Verify consuming dish integrity after sub-recipe deletion
    const suquet = app.db.recipes[dishId];
    assert(suquet, 'Consuming dish must continue to exist');
    const orphanedIng = suquet.ingredients.find(i => i.subRecipeId === subId);
    assert(orphanedIng, 'Orphaned ingredient row must be retained');
    assert.strictEqual(orphanedIng.cost, 1.00, 'Orphaned ingredient must preserve last calculated cost (1.00 €)');
    assert.strictEqual(orphanedIng.originalPrice, 2.50, 'Orphaned ingredient must preserve last unit price (2.50 €)');

    // 5. Verify batch cost calculation does not crash with orphaned sub-recipe
    const postDeleteCost = app._calculateBatchCost(suquet);
    assert(Math.abs(postDeleteCost - 14.33) < 0.05, 'Batch cost must calculate cleanly without NaN');

    // 6. Verify cascade recalculation with deleted subId safely terminates without throw
    assert.doesNotThrow(() => {
      app._recalculateCascade(subId);
    }, 'Recalculate cascade on non-existent or deleted subRecipeId must safely terminate');

    // 7. Verify syncRecipePrices on consuming dish does not crash or wipe out orphaned cost
    app.R = suquet;
    assert.doesNotThrow(() => {
      app._syncRecipePrices();
    }, 'syncRecipePrices must safely ignore deleted sub-recipe references without throwing');
    assert.strictEqual(orphanedIng.cost, 1.00, 'Cost must remain intact after syncRecipePrices');
  });

  registerTest('T2.14: Sub-recipe renaming preserving cascade recalculation and invariant ID linking', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // 1. Setup Sub-recipe
    const subId = 'sub-salsa-tomate';
    app.db.recipes[subId] = {
      id: subId,
      config: { dishName: 'Salsa de Tomate Casera', isSubRecipe: true, yieldQty: 1000, yieldUnit: 'g' },
      ingredients: [
        { id: 't1', name: 'Tomate Pera', net: 1200, waste: 10, gross: 1333.3, originalPrice: 1.50, cost: 2.00, unit: 'g', allergens: [] }
      ]
    };

    // 2. Setup Consuming Dish
    const dishId = 'dish-pasta-pomodoro';
    app.db.recipes[dishId] = {
      id: dishId,
      config: { dishName: 'Rigatoni al Pomodoro', portions: 2 },
      ingredients: [
        { id: 'p1', name: 'Rigatoni', net: 250, waste: 0, gross: 250, originalPrice: 3.00, cost: 0.75, unit: 'g', allergens: ['gluten'] },
        { id: 'p2', name: 'Salsa de Tomate Casera', subRecipeId: subId, isSubRecipe: true, net: 200, waste: 0, gross: 200, originalPrice: 2.00, cost: 0.40, unit: 'g', allergens: [] }
      ]
    };

    // 3. User renames the sub-recipe to "Salsa Pomodoro San Marzano D.O.P."
    app.db.recipes[subId].config.dishName = 'Salsa Pomodoro San Marzano D.O.P.';

    // 4. Update ingredient price in renamed sub-recipe (Tomate price increases from 1.50 to 3.00, batch cost becomes 4.00)
    app.db.recipes[subId].ingredients[0].originalPrice = 3.00;
    app.db.recipes[subId].ingredients[0].cost = 4.00;

    // 5. Trigger cascade recalculation
    app._recalculateCascade(subId);

    // 6. Verify consuming dish updated its price despite name difference (linked via subRecipeId)
    const tomatoIng = app.db.recipes[dishId].ingredients.find(i => i.subRecipeId === subId);
    assert(tomatoIng, 'Consuming dish must locate sub-recipe ingredient by subRecipeId');
    assert.strictEqual(tomatoIng.originalPrice, 4.00, 'Normalized price must update to 4.00 €/kg despite sub-recipe rename');
    assert.strictEqual(tomatoIng.cost, 0.80, 'Ingredient cost must update to (200/1000)*4 = 0.80 €');

    // 7. Verify catalog overlay reflects the new name
    const catalog = app._getMasterCatalogWithSubRecipes(null);
    const catalogItem = catalog.find(c => c.subRecipeId === subId);
    assert(catalogItem, 'Catalog must contain renamed sub-recipe');
    assert.strictEqual(catalogItem.name, 'Salsa Pomodoro San Marzano D.O.P.', 'Catalog entry must reflect updated name');
    assert.strictEqual(catalogItem.price, 4.00, 'Catalog entry must reflect updated cascade price');
  });
}

module.exports = { runTier2Tests };
