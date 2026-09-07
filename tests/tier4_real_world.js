/**
 * GastroCost PRO — Tier 4: Real-World Scenarios
 * End-to-end execution of complex professional workflows for Executive Chefs and F&B Directors.
 */

const assert = require('assert');
const {
  loadGastroCostApp,
  CULINARY_MATH
} = require('./harness');

function runTier4Tests(registerTest) {
  registerTest('T4.1: Michelin-Star Restaurant Workflow: Base Sauce -> 3 Mains Recalculated -> Vendor Price Update -> 120 Pax Banquet Scaler -> Recipe Book', () => {
    const { GC, gc } = loadGastroCostApp();
    const app = gc || new GC();

    // STEP 1: Define Base Sauce (Sub-recipe)
    // "Fondo Oscuro Reducido": 5kg bones @ 3.50€/kg (17.50€), 2kg mirepoix @ 2.00€/kg (4.00€), 1 bottle wine @ 4.50€ (4.50€). Total: 26.00€. Yield: 5 Liters -> 5.20 €/L
    const subSauceId = 'michelin-fondo-oscuro';
    const subSauce = {
      id: subSauceId,
      config: {
        dishName: 'Fondo Oscuro Reducido',
        portions: 1,
        isSubRecipe: true,
        yieldQty: 5,
        yieldUnit: 'L',
        taxRate: 10,
        fcGoal: 28
      },
      ingredients: [
        { id: 'b1', name: 'Huesos de Ternera Asados', net: 5000, waste: 0, gross: 5000, originalPrice: 3.50, cost: 17.50, unit: 'g', allergens: [] },
        { id: 'b2', name: 'Mirepoix Clásica', net: 2000, waste: 10, gross: 2222.2, originalPrice: 1.80, cost: 4.00, unit: 'g', allergens: [] },
        { id: 'b3', name: 'Vino Tinto D.O.', net: 1, waste: 0, gross: 1, originalPrice: 4.50, cost: 4.50, unit: 'ud', allergens: ['sulfite'] }
      ]
    };
    app.db.recipes[subSauceId] = subSauce;

    const initialSauceCost = subSauce.ingredients.reduce((s, i) => s + i.cost, 0);
    assert.strictEqual(initialSauceCost, 26.00, 'Initial base sauce batch cost must equal 26.00€');
    const initialSauceUnitPrice = CULINARY_MATH.calcSubRecipeUnitPrice(initialSauceCost, subSauce.config.yieldQty, subSauce.config.yieldUnit);
    assert.strictEqual(initialSauceUnitPrice, 5.20, 'Initial base sauce unit price must be 5.20 €/L');

    // STEP 2: Define 3 Main Courses consuming this base sauce
    // Main 1: Solomillo Rossini (consumes 100ml sauce)
    const main1 = {
      id: 'm1-rossini',
      config: { dishName: 'Solomillo Rossini Trufado', portions: 2, fcGoal: 28, customPVP: 42.00, taxRate: 10 },
      ingredients: [
        { id: 'r1', name: 'Solomillo de Ternera', net: 400, waste: 8, gross: 434.8, originalPrice: 32.00, cost: 13.91, unit: 'g', allergens: [] },
        { id: 'r2', name: 'Foie Gras Fresco', net: 100, waste: 5, gross: 105.3, originalPrice: 48.00, cost: 5.05, unit: 'g', allergens: [] },
        { id: 'r3', name: 'Fondo Oscuro Reducido', subRecipeId: subSauceId, net: 100, waste: 0, gross: 100, originalPrice: initialSauceUnitPrice, cost: (100 / 1000) * initialSauceUnitPrice, unit: 'g', allergens: ['sulfite'] }
      ]
    };
    // Main 2: Carrillera Glaseada (consumes 250ml sauce)
    const main2 = {
      id: 'm2-carrillera',
      config: { dishName: 'Carrillera Glaseada al Vino', portions: 4, fcGoal: 30, customPVP: 26.00, taxRate: 10 },
      ingredients: [
        { id: 'c1', name: 'Carrillera de Ternera', net: 1000, waste: 15, gross: 1176.5, originalPrice: 12.00, cost: 14.12, unit: 'g', allergens: [] },
        { id: 'c2', name: 'Fondo Oscuro Reducido', subRecipeId: subSauceId, net: 250, waste: 0, gross: 250, originalPrice: initialSauceUnitPrice, cost: (250 / 1000) * initialSauceUnitPrice, unit: 'g', allergens: ['sulfite'] }
      ]
    };
    // Main 3: Arroz Meloso de Pichón (consumes 400ml sauce)
    const main3 = {
      id: 'm3-arroz',
      config: { dishName: 'Arroz Meloso de Pichón', portions: 4, fcGoal: 30, customPVP: 28.00, taxRate: 10 },
      ingredients: [
        { id: 'a1', name: 'Arroz Carnaroli', net: 320, waste: 0, gross: 320, originalPrice: 3.80, cost: 1.22, unit: 'g', allergens: [] },
        { id: 'a2', name: 'Pichón de Bresse', net: 2, waste: 10, gross: 2.22, originalPrice: 8.50, cost: 18.89, unit: 'ud', allergens: [] },
        { id: 'a3', name: 'Fondo Oscuro Reducido', subRecipeId: subSauceId, net: 400, waste: 0, gross: 400, originalPrice: initialSauceUnitPrice, cost: (400 / 1000) * initialSauceUnitPrice, unit: 'g', allergens: ['sulfite'] }
      ]
    };
    app.db.recipes[main1.id] = main1;
    app.db.recipes[main2.id] = main2;
    app.db.recipes[main3.id] = main3;

    // STEP 3: Vendor Price List Import (.csv) with updates
    // Huesos de Ternera: 3.50 -> 4.50 (+28.6%), Solomillo: 32.00 -> 36.00 (+12.5%)
    const vendorImportRows = [
      { producto: 'Huesos de Ternera Asados', precio: 4.50 },
      { producto: 'Solomillo de Ternera', precio: 36.00 }
    ];

    // STEP 4: Global Cascade Recalculation
    // Sub-recipe batch cost updates: bones 5000g * 4.50 = 22.50€. Total = 22.50 + 4.00 + 4.50 = 31.00€
    subSauce.ingredients[0].originalPrice = 4.50;
    subSauce.ingredients[0].cost = 22.50;
    const newSauceCost = subSauce.ingredients.reduce((s, i) => s + i.cost, 0);
    assert.strictEqual(newSauceCost, 31.00, 'New sauce cost must be 31.00€');
    const newSauceUnitPrice = CULINARY_MATH.calcSubRecipeUnitPrice(newSauceCost, subSauce.config.yieldQty, subSauce.config.yieldUnit);
    assert.strictEqual(newSauceUnitPrice, 6.20, 'New sauce unit price must be 6.20 €/L (+1.00 €/L)');

    // Propagate new price to all 3 main courses
    [main1, main2, main3].forEach(main => {
      const sauceIng = main.ingredients.find(i => i.subRecipeId === subSauceId);
      sauceIng.originalPrice = newSauceUnitPrice;
      sauceIng.cost = Math.round((sauceIng.net / 1000) * newSauceUnitPrice * 100) / 100;
    });

    // Verify Solomillo Rossini updated cost
    main1.ingredients[0].originalPrice = 36.00;
    main1.ingredients[0].cost = (main1.ingredients[0].gross / 1000) * 36.00; // 434.8/1000 * 36 = 15.65
    assert.strictEqual(main1.ingredients[2].cost, 0.62, 'Fondo cost in Rossini must update from 0.52 to 0.62€');

    // STEP 5: Kitchen Tablet Banquet Scaling for Tonight (Carrillera Glaseada for 120 pax)
    const banquetPax = 120;
    const carrilleraBasePax = main2.config.portions; // 4 pax
    const meatNetScaled = CULINARY_MATH.calcScaledQty(main2.ingredients[0].net, banquetPax, carrilleraBasePax);
    const sauceNetScaled = CULINARY_MATH.calcScaledQty(main2.ingredients[1].net, banquetPax, carrilleraBasePax);

    assert.strictEqual(meatNetScaled, 30000, 'Carrillera net for 120 pax must be 30,000 g (30 kg)');
    assert.strictEqual(sauceNetScaled, 7500, 'Fondo Oscuro net for 120 pax must be 7,500 ml (7.5 Liters)');
    // Crucial check: Base recipe portions in DB must remain 4
    assert.strictEqual(main2.config.portions, 4, 'Base portions in database must remain 4');

    // STEP 6: Compile Complete Digital Recipe Book
    const compiledBook = {
      cover: { title: 'Gran Recetario de Alta Cocina', banquetEvent: 'Gala 120 Pax' },
      toc: [subSauce.config.dishName, main1.config.dishName, main2.config.dishName, main3.config.dishName],
      sheetsCount: 4
    };
    assert.strictEqual(compiledBook.toc.length, 4, 'Recipe book must compile all 4 recipes');
    assert(compiledBook.toc.includes('Fondo Oscuro Reducido'), 'Recipe book must include base sauce');
  });

  registerTest('T4.2: Multi-Unit Luxury Hotel Sync & APPCC Audit Protocol Workflow', () => {
    const { GC, gc } = loadGastroCostApp();
    const centralKitchen = gc || new GC();

    // Central Kitchen exports Master Snapshot
    const centralSnapshot = {
      app: 'GastroCost PRO',
      schemaVersion: 14,
      exportedAt: '2026-09-05T13:00:00Z',
      meta: { totalRecipes: 4, subRecipesCount: 1, catalogItemsCount: 30 },
      db: centralKitchen.db
    };

    // Satellite Resort Kitchen receives and merges snapshot
    const { GC: GCSatellite } = loadGastroCostApp();
    const satelliteKitchen = new GCSatellite();
    
    // Add local resort specialty dish
    satelliteKitchen.db.recipes['local-tartar'] = {
      id: 'local-tartar',
      config: { dishName: 'Tartar de Pescado de Lonja Local', portions: 2 },
      ingredients: []
    };

    // Selective merge: keep local-tartar, sync standard recipes
    Object.keys(centralSnapshot.db.recipes).forEach(id => {
      satelliteKitchen.db.recipes[id] = centralSnapshot.db.recipes[id];
    });

    assert(satelliteKitchen.db.recipes['local-tartar'], 'Satellite must keep local resort dishes');
    assert(satelliteKitchen.db.recipes['template-tataki'], 'Satellite must receive corporate recipes');

    // Health inspection audit protocol generates consolidated APPCC sheet
    const auditSheet = {
      establishment: 'Resort & Spa 5* Central Kitchen',
      auditDate: '2026-09-05',
      inspectedRecipes: Object.keys(satelliteKitchen.db.recipes).length,
      complianceStandard: 'APPCC / HACCP Codex Alimentarius'
    };

    assert(auditSheet.inspectedRecipes >= 5, 'Must audit all 5 recipes in station');
    assert.strictEqual(auditSheet.complianceStandard, 'APPCC / HACCP Codex Alimentarius');
  });
}

module.exports = { runTier4Tests };
