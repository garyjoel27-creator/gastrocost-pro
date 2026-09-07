/**
 * GastroCost PRO — Test Harness & DOM Emulation Engine
 * Zero-dependency, pure Node.js test environment using vm context.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const SW_JS_PATH = path.join(ROOT_DIR, 'sw.js');

/**
 * Reads and caches source files
 */
function getIndexHtml() {
  return fs.readFileSync(INDEX_HTML_PATH, 'utf8');
}

function getServiceWorkerJs() {
  return fs.readFileSync(SW_JS_PATH, 'utf8');
}

function extractScriptFromHtml(html) {
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error('Could not find <script> tag in index.html');
  }
  return match[1];
}

/**
 * Lightweight Virtual DOM Node Mock
 */
class VirtualElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this._classList = new Set(className.split(/\s+/).filter(Boolean));
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.value = '';
    this.type = 'text';
    this.checked = false;
    this._innerText = '';
    this._innerHTML = '';
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this.disabled = false;
  }

  get classList() {
    return {
      add: (...classes) => classes.forEach(c => this._classList.add(c)),
      remove: (...classes) => classes.forEach(c => this._classList.delete(c)),
      toggle: (c, force) => {
        if (force === true) { this._classList.add(c); return true; }
        if (force === false) { this._classList.delete(c); return false; }
        if (this._classList.has(c)) { this._classList.delete(c); return false; }
        this._classList.add(c);
        return true;
      },
      contains: (c) => this._classList.has(c),
      toString: () => Array.from(this._classList).join(' ')
    };
  }

  get innerText() { return this._innerText; }
  set innerText(val) { this._innerText = String(val); }

  get textContent() { return this._innerText; }
  set textContent(val) { this._innerText = String(val); }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = String(val); }

  setAttribute(k, v) { this.attributes[k] = String(v); if (k.startsWith('data-')) this.dataset[k.slice(5)] = String(v); }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  hasAttribute(k) { return k in this.attributes; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const ev = typeof event === 'object' ? event : { type, target: this, preventDefault: () => {} };
    if (!ev.target) ev.target = this;
    if (!ev.closest) ev.closest = (sel) => this.closest(sel);
    if (this.listeners[type]) {
      this.listeners[type].forEach(h => h.call(this, ev));
    }
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector.startsWith('.')) {
        if (curr.classList && curr.classList.contains(selector.slice(1))) return curr;
      } else if (selector.startsWith('#')) {
        if (curr.id === selector.slice(1)) return curr;
      } else if (curr.tagName && curr.tagName.toLowerCase() === selector.toLowerCase()) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(sel) {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    const traverse = (node) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        let match = false;
        if (sel.startsWith('#') && child.id === sel.slice(1)) match = true;
        else if (sel.startsWith('.') && child.classList && child.classList.contains(sel.slice(1))) match = true;
        else if (child.tagName && child.tagName.toLowerCase() === sel.toLowerCase()) match = true;
        if (match) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  focus() {}
  scrollIntoView() {}
  click() { this.dispatchEvent('click'); }
  reset() {
    this.value = '';
    this.checked = false;
  }
}

/**
 * Creates a sandbox environment with mocked DOM and browser APIs
 */
function createSandbox(initialStorage = {}) {
  const elementsById = new Map();
  const allElements = [];

  function getOrCreateElement(id, tag = 'div', className = '') {
    if (elementsById.has(id)) return elementsById.get(id);
    const el = new VirtualElement(tag, id, className);
    elementsById.set(id, el);
    allElements.push(el);
    return el;
  }

  // Prepopulate standard UI elements from index.html
  const standardIds = [
    'form-ing', 'ing-name', 'ing-net', 'ing-waste', 'ing-price', 'ing-cat', 'ing-unit',
    'ing-allergens-grid', 'cfg-scale', 'notes-toggle', 'notes-section', 'tbl-body',
    'lib-list', 'lib-search', 'kview-title', 'kview-meta', 'kview-ing-list',
    'kview-photo-box', 'kview-notes', 'kview-allergens', 'save-ind', 'cfg-theme',
    'form-cat-add', 'cat-name', 'cat-price', 'cat-waste', 'cat-cat', 'cat-unit',
    'cat-search', 'cat-tbl-body', 'export-modal', 'tab-escandallo', 'tab-cocina',
    'tab-finanzas', 'tab-catalogo', 'bottom-nav', 'vendor-dropzone', 'vendor-file-input',
    'vendor-preview-modal', 'recipe-book-modal'
  ];
  standardIds.forEach(id => getOrCreateElement(id));

  const storage = Object.assign({}, initialStorage);
  const localStorageMock = {
    getItem: (k) => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  const documentBody = new VirtualElement('body', 'body');
  const documentHead = new VirtualElement('head', 'head');

  const documentMock = {
    body: documentBody,
    head: documentHead,
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => {
      const el = new VirtualElement(tag);
      allElements.push(el);
      return el;
    },
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      if (sel === 'body') return documentBody;
      if (sel === 'head') return documentHead;
      return allElements.find(el => {
        if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
        return el.tagName.toLowerCase() === sel.toLowerCase();
      }) || getOrCreateElement('mock-' + Math.random().toString(36).slice(2, 6));
    },
    querySelectorAll: (sel) => {
      if (sel === '.cfg') {
        const fields = ['portions', 'taxRate', 'fcGoal', 'customPVP', 'dishName', 'currency', 'notes'];
        return fields.map(k => {
          const el = getOrCreateElement('cfg-' + k, 'input');
          el.dataset.k = k;
          el.classList.add('cfg');
          return el;
        });
      }
      if (sel === '.tab-btn') {
        return ['tab-escandallo', 'tab-cocina', 'tab-finanzas', 'tab-catalogo'].map(t => {
          const btn = getOrCreateElement('btn-' + t, 'button', 'tab-btn');
          btn.dataset.tab = t;
          return btn;
        });
      }
      if (sel === '.tab-content') {
        return ['tab-escandallo', 'tab-cocina', 'tab-finanzas', 'tab-catalogo'].map(t => getOrCreateElement(t, 'div', 'tab-content'));
      }
      if (sel.includes('checkbox')) {
        return [];
      }
      return allElements.filter(el => {
        if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
        if (sel.startsWith('#')) return el.id === sel.slice(1);
        return el.tagName.toLowerCase() === sel.toLowerCase();
      });
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    createDocumentFragment: () => {
      const frag = new VirtualElement('fragment');
      allElements.push(frag);
      return frag;
    },
    createRange: () => ({
      selectNodeContents: () => {},
      collapse: () => {}
    })
  };

  const windowMock = {
    location: { protocol: 'http:', origin: 'http://localhost', reload: () => {} },
    navigator: {
      onLine: true,
      serviceWorker: {
        register: () => Promise.resolve({ scope: '/' }),
        addEventListener: () => {}
      }
    },
    localStorage: localStorageMock,
    document: documentMock,
    getSelection: () => ({ removeAllRanges: () => {}, addRange: () => {} }),
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    Intl: global.Intl,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    Date: Date,
    Math: Math,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    Promise: Promise,
    JSON: JSON,
    addEventListener: () => {},
    removeEventListener: () => {},
    Set: Set,
    Map: Map
  };
  windowMock.window = windowMock;

  const sandbox = {
    window: windowMock,
    document: documentMock,
    localStorage: localStorageMock,
    navigator: windowMock.navigator,
    location: windowMock.location,
    Intl: global.Intl,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    Date: Date,
    Math: Math,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    Promise: Promise,
    JSON: JSON,
    Set: Set,
    Map: Map,
    Event: function(type) { this.type = type; },
    CustomEvent: function(type, opts) { this.type = type; this.detail = opts ? opts.detail : null; },
    FileReader: function() {
      this.readAsText = function(file) {
        setTimeout(() => {
          if (this.onload) this.onload({ target: { result: file.content || file } });
        }, 0);
      };
    },
    debounce: function(fn, ms) { return fn; },
    toast: function(msg, type) {}
  };

  return sandbox;
}

/**
 * Compiles and loads GastroCost code into a sandbox
 */
function loadGastroCostApp(options = {}) {
  const html = getIndexHtml();
  const jsCode = extractScriptFromHtml(html);
  const sandbox = createSandbox(options.initialStorage);
  const context = vm.createContext(sandbox);

  // Parse and run script in VM
  const script = new vm.Script(jsCode, { filename: 'index.html.js' });
  script.runInContext(context);

  return {
    context,
    sandbox,
    window: sandbox.window,
    document: sandbox.document,
    localStorage: sandbox.localStorage,
    GC: sandbox.window.GC || sandbox.GC,
    gc: sandbox.window.gc || sandbox.gc,
    ALLERGENS: sandbox.ALLERGENS,
    INGREDIENTS_MASTER: sandbox.INGREDIENTS_MASTER
  };
}

/**
 * Standard Mathematical Specifications for GastroCost PRO
 * Authoritative reference calculations derived from PROJECT.md & ORIGINAL_REQUEST.md
 */
const CULINARY_MATH = {
  // Gross quantity from net and waste %
  calcGross(net, waste) {
    if (waste >= 100) throw new Error('Waste cannot be >= 100%');
    return net / (1 - (waste || 0) / 100);
  },

  // Ingredient cost
  calcCost(net, waste, price, unit = 'g') {
    const gross = this.calcGross(net, waste);
    if (unit === 'ud') {
      return gross * price;
    }
    // For 'g' or 'ml', price is per kg/L (divide by 1000)
    return (gross / 1000) * price;
  },

  // Sub-recipe normalized unit price (€/kg, €/L, or €/ud)
  calcSubRecipeUnitPrice(batchCost, yieldQty, yieldUnit = 'g') {
    if (!yieldQty || yieldQty <= 0) return 0;
    if (yieldUnit === 'kg' || yieldUnit === 'L') {
      // batchCost / yieldQty gives €/kg or €/L
      return batchCost / yieldQty;
    }
    if (yieldUnit === 'g' || yieldUnit === 'ml') {
      // batchCost / yieldQty * 1000 gives €/kg or €/L
      return (batchCost / yieldQty) * 1000;
    }
    if (yieldUnit === 'ud') {
      // batchCost / yieldQty gives €/ud
      return batchCost / yieldQty;
    }
    return batchCost / yieldQty;
  },

  // Dynamic scaled quantity for production mode
  calcScaledQty(baseNet, targetPortions, basePortions) {
    const baseP = Math.max(1, basePortions || 1);
    return baseNet * (targetPortions / baseP);
  },

  // Food cost percentage
  calcFoodCostPercent(costPerPortion, netSellingPrice) {
    if (!netSellingPrice || netSellingPrice <= 0) return 0;
    return (costPerPortion / netSellingPrice) * 100;
  }
};

module.exports = {
  ROOT_DIR,
  INDEX_HTML_PATH,
  SW_JS_PATH,
  getIndexHtml,
  getServiceWorkerJs,
  extractScriptFromHtml,
  createSandbox,
  loadGastroCostApp,
  CULINARY_MATH
};
