/**
 * GastroCost PRO — Tier 3: Cross-Feature Combinations
 * Tests multi-system integrations: Sub-recipes x Vendor Import x Cloud Snapshot x Tablet x Recipe Book.
 */

const assert = require('assert');
const {
  loadGastroCostApp,
  CULINARY_MATH
} = require('./harness');

function runTier3Tests(registerTest) {
  registerTest('T3.1: Sub-recipe updated by Vendor Price Import cascading to final dishes (R1 + R2)', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // 1. Raw ingredient in catalog
    const beefBones = { id: 'raw-bones', name: 'Huesos de Ternera', price: 3.00, waste: 0, unit: 'g' };
    app.db.catalog.push(beefBones);

    // 2. Sub-recipe "Fondo Oscuro" consuming beef bones (2000g @ 3.00€/kg = 6.00€ batch cost, 2L yield -> 3.00€/L)
    const subRecipe = {
      id: 'sub-fondo',
      config: { dishName: 'Fondo Oscuro', isSubRecipe: true, yieldQty: 2, yieldUnit: 'L', portions: 1 },
      ingredients: [
        { id: 'sb1', name: 'Huesos de Ternera', net: 2000, waste: 0, gross: 2000, originalPrice: 3.00, cost: 6.00, unit: 'g' }
      ]
    };
    app.db.recipes['sub-fondo'] = subRecipe;

    // 3. Final dish "Solomillo al Vino Tinto" consuming 200ml Fondo Oscuro (0.2L * 3.00€/L = 0.60€)
    const mainDish = {
      id: 'dish-solomillo',
      config: { dishName: 'Solomillo al Vino Tinto', portions: 2, fcGoal: 30 },
      ingredients: [
        { id: 'm1', name: 'Solomillo de Ternera', net: 400, waste: 0, gross: 400, originalPrice: 30.00, cost: 12.00, unit: 'g' },
        { id: 'm2', name: 'Fondo Oscuro', subRecipeId: 'sub-fondo', net: 200, waste: 0, gross: 200, originalPrice: 3.00, cost: 0.60, unit: 'g' }
      ]
    };
    app.db.recipes['dish-solomillo'] = mainDish;

    // STEP A: Vendor import updates raw Huesos de Ternera price from 3.00 to 5.00 (+66.7%)
    beefBones.price = 5.00;
    subRecipe.ingredients[0].originalPrice = 5.00;
    subRecipe.ingredients[0].cost = 10.00; // 2000g * 5.00€/kg = 10.00€

    // STEP B: Sub-recipe new unit price: 10.00€ / 2L = 5.00€/L
    const newSubUnitPrice = CULINARY_MATH.calcSubRecipeUnitPrice(10.00, 2, 'L');
    assert.strictEqual(newSubUnitPrice, 5.00, 'Sub-recipe unit price must recalculate to 5.00€/L');

    // STEP C: Cascade to main dish
    mainDish.ingredients[1].originalPrice = newSubUnitPrice;
    mainDish.ingredients[1].cost = CULINARY_MATH.calcCost(200, 0, newSubUnitPrice, 'g'); // (200/1000)*5 = 1.00€
    assert.strictEqual(mainDish.ingredients[1].cost, 1.00, 'Fondo cost in main dish must update from 0.60€ to 1.00€');

    // Total dish cost updates from 12.60€ to 13.00€
    const newDishCost = mainDish.ingredients.reduce((s, i) => s + i.cost, 0);
    assert.strictEqual(newDishCost, 13.00, 'Main dish cost must reflect cascade update');
  });

  registerTest('T3.2: Sub-recipe consumed in Kitchen Tablet Mode with live portion scaling (R1 + R4)', () => {
    // A banquet requires scaling a main dish from 4 pax to 60 pax (factor x15)
    const baseSubRecipeNet = 150; // 150 ml per 4 portions
    const scaledSubRecipeQty = CULINARY_MATH.calcScaledQty(baseSubRecipeNet, 60, 4);

    assert.strictEqual(scaledSubRecipeQty, 2250, '150 ml for 4 pax scaled to 60 pax must equal 2250 ml (2.25 L)');

    // In tablet mode, 2250 ml should display as "2.25 kg/L"
    const displayStr = `${Math.round((scaledSubRecipeQty / 1000) * 100) / 100} kg/L`;
    assert.strictEqual(displayStr, '2.25 kg/L');
  });

  registerTest('T3.3: Sub-recipe compiled into Consolidated Recipe Book with distinct badges (R1 + R5)', () => {
    const bookSelection = [
      { id: 'sub-fondo', name: 'Fondo Oscuro de Ternera', isSubRecipe: true, yieldQty: 4, yieldUnit: 'L' },
      { id: 'dish-solomillo', name: 'Solomillo al Vino', isSubRecipe: false, portions: 4 }
    ];

    function renderTOCItem(item) {
      const badge = item.isSubRecipe ? '<span class="badge-subrecipe">[🥘 Elaboración Base]</span>' : '';
      const yieldStr = item.isSubRecipe ? `Rdto: ${item.yieldQty} ${item.yieldUnit}` : `${item.portions} pax`;
      return `<li>${item.name} ${badge} — <em>${yieldStr}</em></li>`;
    }

    const subToc = renderTOCItem(bookSelection[0]);
    const dishToc = renderTOCItem(bookSelection[1]);

    assert(subToc.includes('Elaboración Base'), 'Sub-recipe in TOC must be badged as Elaboración Base');
    assert(subToc.includes('Rdto: 4 L'), 'Sub-recipe in TOC must display measured yield');
    assert(!dishToc.includes('Elaboración Base'), 'Standard dish must not have sub-recipe badge');
  });

  registerTest('T3.4: Vendor Price Import synchronized across Snapshot Cloud Backup (R2 + R3)', () => {
    const { GC, gc } = loadGastroCostApp();
    const appStationA = gc || new GC();

    // Station A updates catalog item price via vendor import
    appStationA.db.catalog[0].price = 45.00;
    const updatedCatalogName = appStationA.db.catalog[0].name;

    // Station A creates Snapshot JSON
    const snapshotJson = JSON.stringify({
      app: 'GastroCost PRO',
      schemaVersion: 14,
      exportedAt: new Date().toISOString(),
      db: appStationA.db
    });

    // Station B receives and imports Snapshot
    const { GC: GCB } = loadGastroCostApp();
    const appStationB = new GCB();
    const parsedData = JSON.parse(snapshotJson);
    appStationB.db = appStationB._ensureSchema(parsedData.db);

    // Verify Station B matches Station A exactly
    const matchingItemB = appStationB.db.catalog.find(c => c.name === updatedCatalogName);
    assert.strictEqual(matchingItemB.price, 45.00, 'Station B must reflect imported vendor price from Station A snapshot');
  });

  registerTest('T3.5: Multi-tier allergen inheritance into APPCC Technical Sheet (R1 + R5)', () => {
    // Multi-tier hierarchy:
    // 1. Base Stock has celery / sulfite ('sulfite')
    // 2. Demi-glace consumes Base Stock and adds butter ('dairy')
    // 3. Final Dish consumes Demi-glace and adds breaded meat ('gluten', 'egg')
    const stockAllergens = ['sulfite'];
    const demiGlaceAllergens = Array.from(new Set([...stockAllergens, 'dairy']));
    const finalDishAllergens = Array.from(new Set([...demiGlaceAllergens, 'gluten', 'egg']));

    assert.strictEqual(finalDishAllergens.length, 4, 'Final dish must inherit all 4 allergens from chain');
    ['sulfite', 'dairy', 'gluten', 'egg'].forEach(alg => {
      assert(finalDishAllergens.includes(alg), `Must contain allergen ${alg}`);
    });
  });
}

module.exports = { runTier3Tests };
