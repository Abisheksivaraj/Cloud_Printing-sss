/**
 * labelEngine.js — Offline AI Label Generator
 * Generates professional label layouts from natural language prompts.
 * No API key or internet connection required.
 */

const MM = 3.7795275591; // mm → pixels
const mm = (v) => Math.round(v * MM);

// ─── NLP: Detect label type ───────────────────────────────────────────────────
const LABEL_KEYWORDS = {
    shipper: ['ship', 'shipper', 'shipping', 'fedex', 'ups', 'dhl', 'usps', 'courier', 'delivery', 'dispatch', 'parcel', 'package', 'freight', 'logistics', 'express', 'sscc', 'logistic'],
    product: ['product', 'item', 'goods', 'retail', 'merchandise', 'sku', 'part', 'component', 'catalog', 'gtin'],
    pharma: ['pharma', 'pharmaceutical', 'medicine', 'drug', 'medication', 'rx', 'tablet', 'capsule', 'dose', 'dosage', 'prescription', 'amoxicillin', 'paracetamol', 'injection'],
    price: ['price', 'price tag', 'price-tag', 'cost', 'sale', 'shop', 'store', 'tag', 'rate', 'currency'],
    warehouse: ['warehouse', 'storage', 'rack', 'bin', 'location', 'zone', 'shelf', 'bay', 'aisle', 'pallet'],
    address: ['address', 'mailing', 'mail', 'envelope', 'postal', 'letter'],
    asset: ['asset', 'equipment', 'property tag', 'serial', 'fixed asset', 'inventory tag'],
    food: ['food', 'nutrition', 'nutritional', 'ingredient', 'allergen', 'organic', 'snack', 'beverage', 'drink'],
    barcode: ['barcode only', 'just barcode', 'barcode label'],
    gs1_product: ['product id', 'gtin label', 'product identification'],
    gs1_trace: ['batch', 'lot', 'traceability', 'manufacturing'],
    gs1_expiry: ['expiry', 'shelf-life', 'best before', 'sell by'],
    gs1_weight: ['weight label', 'net weight', 'quantity label', 'count'],
    gs1_logistic: ['pallet label', 'sscc', 'logistics label', 'shipment tracking'],
    gs1_price: ['retail price', 'price per unit'],
    gs1_combo: ['gs1-128', 'composite label', 'full gs1'],
    shipper_4x6: ['shipper 4x6', 'shipper 4 x 6', '4x6 shipper', '4 x 6 shipper'],
    logistic_4x6: ['logistic 4x6', 'logistics 4x6', '4x6 logistic', '4 x 6 logistic'],
    ration_factory: ['ration factory', 'food packing', 'ration label'],
    abcd_expiry: ['abcd', 'item abcd', 'expiry abcd'],
    custom: []
};

function detectLabelType(prompt) {
    const lp = prompt.toLowerCase();

    if (lp.includes('shipper') && (lp.includes('4x6') || lp.includes('4 x 6') || lp.includes('4*6'))) return 'shipper_4x6';
    if (lp.includes('logistic') && (lp.includes('4x6') || lp.includes('4 x 6') || lp.includes('4*6'))) return 'logistic_4x6';
    if (lp.includes('ration factory')) return 'ration_factory';
    if (lp.includes('abcd')) return 'abcd_expiry';

    // Check for specific GS1 types first
    if (lp.includes('gtin') || lp.includes('product id')) return 'gs1_product';
    if (lp.includes('batch') || lp.includes('lot') || lp.includes('trace')) return 'gs1_trace';
    if (lp.includes('expiry') || lp.includes('best before') || lp.includes('shelf')) return 'gs1_expiry';
    if (lp.includes('weight') || lp.includes('quantity') || lp.includes('count')) return 'gs1_weight';
    if (lp.includes('sscc') || lp.includes('logistic') || lp.includes('pallet')) return 'gs1_logistic';
    if (lp.includes('retail price') || (lp.includes('price') && lp.includes('unit'))) return 'gs1_price';
    if (lp.includes('gs1-128') || lp.includes('full label')) return 'gs1_combo';

    for (const [type, kws] of Object.entries(LABEL_KEYWORDS)) {
        if (kws.some(k => lp.includes(k))) return type;
    }
    return 'custom';
}

// ─── NLP: Extract dimensions ──────────────────────────────────────────────────
function extractSize(prompt, defaults) {
    // Matches: 100x150, 100 x 150, 100×150, 4x6, etc.
    const m = prompt.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (m) {
        const w = parseFloat(m[1]);
        const h = parseFloat(m[2]);
        // If looks like inches (small numbers), convert
        if (w <= 12 && h <= 12) return { width: Math.round(w * 25.4), height: Math.round(h * 25.4) };
        return { width: w, height: h };
    }
    return defaults;
}

// ─── NLP: Extract company/product name ───────────────────────────────────────
function extractName(prompt, fallback) {
    // "for [Name]", "company name is [Name]", "brand [Name]", "called [Name]", "named [Name]"
    const lp = prompt.toLowerCase();
    const m = prompt.match(/(?:for|company|brand|called|named|of|from|is)\s+([A-Z][A-Za-z0-9\s&.'-]{1,30})/i);
    if (m) return m[1].trim().toUpperCase();
    return fallback;
}

// ─── NLP: Detect special elements ────────────────────────────────────────────
function detectOptions(prompt) {
    const lp = prompt.toLowerCase();
    return {
        hasQR: lp.includes('qr') || lp.includes('qr code'),
        hasBarcode: !lp.includes('no barcode') && !lp.includes('without barcode'),
        hasLogo: lp.includes('logo') || lp.includes('icon'),
        isAligned: lp.includes('center') || lp.includes('centred') || lp.includes('centered'),
        hasSeparator: lp.includes('line') || lp.includes('separator') || lp.includes('divider'),
        carrier: lp.includes('fedex') ? 'FedEx' : lp.includes('ups') ? 'UPS' : lp.includes('dhl') ? 'DHL' : lp.includes('usps') ? 'USPS' : 'ATPL Express',
        service: lp.includes('overnight') ? 'PRIORITY OVERNIGHT' : lp.includes('2 day') || lp.includes('2-day') ? '2ND DAY AIR' : lp.includes('ground') ? 'GROUND' : 'STANDARD',
        drugName: (() => { const m = prompt.match(/(?:for|drug|medicine|medication)\s+([A-Za-z]+(?:\s+\d+\s*mg)?)/i); return m ? m[1].trim() : 'AMOXICILLIN 500MG'; })(),
        dosage: (() => { const m = prompt.match(/(\d+\s*mg|\d+\s*ml|\d+\s*mcg)/i); return m ? m[1].toUpperCase() : '500MG'; })(),
        zone: (() => { const m = prompt.match(/(?:zone|section|area)\s*([A-Z0-9]+)/i); return m ? m[1].toUpperCase() : 'A'; })(),
        location: (() => { const m = prompt.match(/(?:row|rack|bay|bin|shelf|aisle)\s*([A-Z0-9-]+)/i); return m ? m[1].toUpperCase() : '12'; })(),
        fontSize: (() => { const m = prompt.match(/(\d+)(?:px|pt)/i); return m ? parseInt(m[1]) : null; })(),
        fontStyle: lp.includes('arial') ? 'Arial' : lp.includes('courier') ? 'Courier New' : lp.includes('georgia') ? 'Georgia' : lp.includes('times') ? 'Times New Roman' : 'Arial',
        barcodeMiddle: lp.includes('barcode in middle') || lp.includes('barcode at center'),
    };
}

// ─── ID generator ─────────────────────────────────────────────────────────────
let _idN = 0;
const eid = () => `le_${Date.now()}_${++_idN}`;

// ─── Color themes per carrier ────────────────────────────────────────────────
const CARRIER_COLORS = {
    FedEx: { header: '#4d148c', accent: '#ff6200' },
    UPS: { header: '#351c15', accent: '#ffb500' },
    DHL: { header: '#d40511', accent: '#ffcc00' },
    USPS: { header: '#004b87', accent: '#ed1c24' },
    'ATPL Express': { header: '#1a2e54', accent: '#e8712a' },
};

// ─── Design Helper: Outer Border ─────────────────────────────────────────────
function addOuterBorder(els, W, H, thickness = 1) {
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: 'transparent', borderWidth: thickness, borderColor: '#000000', zIndex: 0, pointerEvents: 'none' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LABEL TEMPLATE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. SHIPPER LABEL ─────────────────────────────────────────────────────────
function shipperLabel(W, H, opts, companyName) {
    const red = '#e11d48'; // vibrant red matching the image
    const black = '#000000';
    const els = [];
    let uid = 0;

    const pad = mm(4);
    const rowH = mm(25);

    // 1. Logo & Header Area
    // Company Logo Placeholder / Name
    els.push({ id: eid(), type: 'text', x: mm(35), y: mm(3), width: mm(60), height: mm(8), content: 'ARCHERY TECHNOCRATS®', fontSize: 16, fontWeight: 'black', fontFamily: 'Arial Black', color: black, textAlign: 'left', zIndex: ++uid });
    // Tagline in red box
    els.push({ id: eid(), type: 'rectangle', x: mm(35), y: mm(11), width: mm(35), height: mm(3), backgroundColor: red, borderWidth: 0, zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: mm(35), y: mm(11.2), width: mm(35), height: mm(2.5), content: 'TARGET PERFECTION', fontSize: 6, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: ++uid });

    // Dividers
    const divX = mm(2);
    const divW = W - mm(4);

    // Top Horizontal Divider
    els.push({ id: eid(), type: 'rectangle', x: divX, y: mm(18), width: divW, height: 1.5, backgroundColor: red, zIndex: ++uid });

    // 2. FROM Section
    els.push({ id: eid(), type: 'text', x: pad, y: mm(20), width: mm(60), height: mm(4), content: 'From:', fontSize: 10, fontWeight: 'bold', color: black, textAlign: 'left', zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: pad, y: mm(24), width: mm(55), height: mm(16), content: 'ARCHERY TECHNOCRATS PRIVATE LIMITED\n275/11, Ganshi Road, West Tambaram,\nChennai, Tamil Nadu - 600045', fontSize: 8, fontWeight: 'medium', color: black, textAlign: 'left', zIndex: ++uid });

    // Vertical divider for From
    els.push({ id: eid(), type: 'rectangle', x: mm(63), y: mm(20), width: 1.5, height: mm(20), backgroundColor: red, zIndex: ++uid });

    // Data Matrix at top right
    els.push({ id: eid(), type: 'barcode', x: mm(66), y: mm(20), width: mm(28), height: mm(24), content: 'FROM-DATAMATRIX-0044142', barcodeType: 'DATAMATRIX', backgroundColor: 'transparent', zIndex: ++uid });

    // Mid Horizontal Divider
    els.push({ id: eid(), type: 'rectangle', x: divX, y: mm(46), width: divW, height: 1.5, backgroundColor: red, zIndex: uid++ });

    // 3. SHIP TO Section
    els.push({ id: eid(), type: 'text', x: pad, y: mm(48), width: mm(50), height: mm(4), content: 'Ship To:', fontSize: 10, fontWeight: 'bold', color: black, textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: pad, y: mm(52), width: mm(50), height: mm(18), content: 'Honeywell Industrial Automation\n855 S, Mint St Charlotte, NC\n28202, 800-582-4263', fontSize: 9, fontWeight: 'bold', color: black, textAlign: 'left', zIndex: uid++ });

    // Vertical divider for Ship To
    els.push({ id: eid(), type: 'rectangle', x: mm(54), y: mm(48), width: 1.5, height: mm(22), backgroundColor: red, zIndex: uid++ });

    // Ship Details (Right of Ship To)
    els.push({ id: eid(), type: 'text', x: mm(57), y: mm(48), width: mm(40), height: mm(25), content: `Ship Date: Mar 04, 2025\n\nAct weight: 25 Kg\nCAD1319865X2NJX2`, fontSize: 8, fontWeight: 'bold', color: black, textAlign: 'left', zIndex: uid++ });

    // Bottom Horizontal Divider
    els.push({ id: eid(), type: 'rectangle', x: divX, y: mm(72), width: divW, height: 1.5, backgroundColor: red, zIndex: uid++ });

    // 4. ORDER / REF / WEIGHT Section
    const colW = divW / 3;
    els.push({ id: eid(), type: 'text', x: pad, y: mm(74), width: colW, height: mm(10), content: `Order No:\n44142`, fontSize: 8, fontWeight: 'bold', color: black, textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(35), y: mm(74), width: colW, height: mm(10), content: `Reference No:\nH9SINCIG7178`, fontSize: 8, fontWeight: 'bold', color: black, textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: W - colW - pad, y: mm(74), width: colW, height: mm(10), content: `Net weight: 25\nKg/Box`, fontSize: 8, fontWeight: 'bold', color: black, textAlign: 'right', zIndex: uid++ });

    // 5. MAIN BARCODE
    els.push({ id: eid(), type: 'barcode', x: pad, y: mm(88), width: divW, height: mm(22), content: '44142-H9SINCIG7178', barcodeType: 'CODE128', showBarcodeText: false, zIndex: uid++ });

    // 6. BOTTOM SECTION
    // QR Code bottom left
    els.push({ id: eid(), type: 'barcode', x: pad, y: mm(115), width: mm(22), height: mm(22), content: 'https://track.atpl.in/44142', barcodeType: 'QR', zIndex: uid++ });

    // Footer credit
    els.push({ id: eid(), type: 'text', x: mm(25), y: H - mm(18), width: mm(50), height: mm(5), content: 'All Observed rights by ATPL', fontSize: 7, fontWeight: 'bold', color: black, textAlign: 'center', zIndex: uid++ });

    // Quantity Vertical Barcode & Text
    els.push({ id: eid(), type: 'barcode', x: W - mm(14), y: mm(115), width: mm(28), height: mm(10), content: 'QTY-25', barcodeType: 'CODE128', rotation: 90, zIndex: uid++, showBarcodeText: false });
    els.push({ id: eid(), type: 'text', x: W - mm(22), y: mm(122), width: mm(20), height: mm(10), content: 'Quantity', fontSize: 7, fontWeight: 'bold', color: black, textAlign: 'center', rotation: -90, zIndex: uid++ });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Shipper Label', description: 'Advanced Shipper Label with multiple barcodes (Data Matrix, QR, CODE128), red dividers, and specific field mappings.', elements: els };
}

// ── 2. PRODUCT LABEL ─────────────────────────────────────────────────────────
function productLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(10), backgroundColor: '#1a2e54', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(7), content: name, fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Logo placeholder rectangle
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(12), width: mm(22), height: mm(20), backgroundColor: '#e8f4fd', borderWidth: 1, borderColor: '#2196F3', borderStyle: 'dashed', borderRadius: 4, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(12), width: mm(22), height: mm(20), content: 'LOGO', fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', color: '#2196F3', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Product details
    els.push({ id: eid(), type: 'text', x: mm(26), y: mm(12), width: W - mm(28), height: mm(7), content: 'Premium Quality Product', fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(26), y: mm(20), width: W - mm(28), height: mm(12), content: `SKU: PRD-${Math.floor(Math.random() * 9000 + 1000)}\nBatch: B${Math.floor(Math.random() * 900 + 100)}\nMfg: ${new Date().toLocaleDateString()}`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#555555', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(34), width: W - mm(4), height: 1, backgroundColor: '#dddddd', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        const bcW = opts.hasQR ? W - mm(30) : W - mm(8);
        els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(36), width: bcW, height: mm(16), content: `PRD${Math.floor(Math.random() * 900000000 + 100000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
        if (opts.hasQR) {
            els.push({ id: eid(), type: 'barcode', x: W - mm(24), y: mm(35), width: mm(22), height: mm(18), content: `https://atpl.in/product/${Math.floor(Math.random() * 9000 + 1000)}`, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
        }
    }

    // Footer
    els.push({ id: eid(), type: 'rectangle', x: 0, y: H - mm(7), width: W, height: mm(7), backgroundColor: '#f0f0f0', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: mm(2), y: H - mm(6), width: W - mm(4), height: mm(5), content: `Made in India  |  ISO 9001:2015 Certified`, fontSize: 6, fontFamily: 'Arial', fontWeight: 'normal', color: '#888888', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Product Label', description: `Product label for ${name} with logo area, product details, and barcode.`, elements: els };
}

// ── 3. PHARMACEUTICAL LABEL ───────────────────────────────────────────────────
function pharmaLabel(W, H, opts, companyName) {
    const els = [];
    let uid = 0;

    // Outer border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#cc0000', borderStyle: 'solid', zIndex: uid++ });
    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#003080', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: companyName, fontSize: 11, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Drug name
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(11), width: W - mm(6), height: mm(8), content: opts.drugName.toUpperCase(), fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Dosage & form
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(20), width: W - mm(6), height: mm(5), content: `Dosage: ${opts.dosage}  ·  Oral Tablet  ·  10 Tablets/Strip`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(26), width: W - mm(6), height: 1, backgroundColor: '#999999', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Lot & Expiry
    const expDate = new Date(); expDate.setFullYear(expDate.getFullYear() + 2);
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(28), width: W - mm(6), height: mm(5), content: `Lot: L${Math.floor(Math.random() * 900000 + 100000)}   Mfg: ${new Date().toLocaleDateString('en-GB')}   Exp: ${expDate.toLocaleDateString('en-GB')}`, fontSize: 7, fontFamily: 'Courier New', fontWeight: 'normal', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Warning box
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(35), width: W - mm(6), height: mm(8), backgroundColor: '#fff3f3', borderWidth: 1, borderColor: '#cc0000', borderStyle: 'solid', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(36.5), width: W - mm(8), height: mm(5), content: '⚠ KEEP OUT OF REACH OF CHILDREN  ·  RX ONLY  ·  STORE BELOW 25°C', fontSize: 6, fontWeight: 'bold', fontFamily: 'Arial', color: '#cc0000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        const bcH = H - mm(55);
        if (bcH > mm(10)) {
            els.push({ id: eid(), type: 'barcode', x: mm(5), y: mm(45), width: W - mm(10), height: mm(12), content: `RX${Math.floor(Math.random() * 90000000 + 10000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
        }
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Pharmaceutical Label', description: `Rx pharmaceutical label for ${opts.drugName} with dosage, lot number, expiry, warning, and barcode.`, elements: els };
}

// ── 4. PRICE TAG ──────────────────────────────────────────────────────────────
function priceTag(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Background
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid', borderRadius: 4, zIndex: uid++ });
    // Top color stripe
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(7), backgroundColor: '#e53935', borderWidth: 0, borderColor: 'transparent', borderRadius: 4, zIndex: uid++ });
    // Brand/store name
    els.push({ id: eid(), type: 'text', x: mm(1), y: mm(0.5), width: W - mm(2), height: mm(6), content: name, fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Product name
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(9), width: W - mm(4), height: mm(6), content: 'Premium Product Item', fontSize: 8, fontFamily: 'Arial', fontWeight: 'normal', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Price (large)
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(16), width: W - mm(4), height: mm(10), content: '₹ 499.00', fontSize: 20, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // MRP line
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(27), width: W - mm(4), height: mm(4), content: 'MRP (INCL. OF ALL TAXES)', fontSize: 6, fontFamily: 'Arial', fontWeight: 'normal', color: '#999999', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(32), width: W - mm(4), height: 1, backgroundColor: '#eeeeee', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(3), y: H - mm(18), width: W - mm(6), height: mm(12), content: `${Math.floor(Math.random() * 900000000000 + 100000000000)}`, barcodeType: 'EAN13', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Price Tag', description: `Retail price tag for ${name} with product name, price, and barcode.`, elements: els };
}

// ── 5. WAREHOUSE LABEL ────────────────────────────────────────────────────────
function warehouseLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#f59e0b', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: `${name} — WAREHOUSE LOCATION`, fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Zone — huge letter
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(11), width: mm(22), height: H - mm(23), content: opts.zone, fontSize: 64, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(3), y: H - mm(11), width: mm(22), height: mm(6), content: 'ZONE', fontSize: 7, fontWeight: 'bold', fontFamily: 'Arial', color: '#666666', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Vertical divider
    els.push({ id: eid(), type: 'rectangle', x: mm(27), y: mm(11), width: 1.5, height: H - mm(15), backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Location data
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 8));
    const bay = Math.floor(Math.random() * 20 + 1);
    const level = Math.floor(Math.random() * 5 + 1);
    els.push({ id: eid(), type: 'text', x: mm(30), y: mm(12), width: W - mm(33), height: mm(8), content: `ROW  ${row}  —  BAY  ${bay}`, fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(30), y: mm(22), width: W - mm(33), height: mm(6), content: `LEVEL: ${level}  ·  MAX 500 KG`, fontSize: 10, fontFamily: 'Arial', fontWeight: 'normal', color: '#444444', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(30), y: H - mm(25), width: W - mm(34), height: mm(18), content: `WH-${opts.zone}-${row}${bay}-L${level}`, barcodeType: 'CODE39', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    }
    if (opts.hasQR) {
        els.push({ id: eid(), type: 'barcode', x: mm(30), y: H - mm(25), width: mm(18), height: mm(18), content: `WH-${opts.zone}-${row}${bay}-L${level}`, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Warehouse Location Label', description: `Warehouse bin location label: Zone ${opts.zone}, Row ${row}, Bay ${bay}, Level ${level}.`, elements: els };
}

// ── 6. ADDRESS LABEL ──────────────────────────────────────────────────────────
function addressLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Outer border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderStyle: 'solid', zIndex: uid++ });

    // Return address (top-left, small)
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(3), width: mm(45), height: mm(16), content: `FROM:\n${name}\n12 Sender Street\nChennai - 600001`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#555555', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(21), width: W - mm(6), height: 1, backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // TO label
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(23), width: mm(10), height: mm(5), content: 'TO:', fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    // TO address (big)
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(29), width: W - mm(6), height: mm(18), content: `MR. JOHN DOE\n45 Recipient Nagar, Sector 7\nBengaluru - 560001\nKARNATAKA`, fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(3), y: H - mm(16), width: W - mm(6), height: mm(14), content: `POST${Math.floor(Math.random() * 900000000 + 100000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Address Label', description: `Mailing address label with return address and large TO address block.`, elements: els };
}

// ── 7. ASSET TAG ──────────────────────────────────────────────────────────────
function assetTag(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const assetNum = `AT-${Math.floor(Math.random() * 90000 + 10000)}`;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#263238', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: `${name} — ASSET MANAGEMENT`, fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Asset ID
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(12), width: W - mm(6), height: mm(8), content: assetNum, fontSize: 20, fontWeight: 'bold', fontFamily: 'Courier New', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Details
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(22), width: W - mm(6), height: mm(14), content: `Department: Operations\nLocation: Head Office\nSerial: SN-${Math.floor(Math.random() * 900000 + 100000)}\nDate: ${new Date().toLocaleDateString()}`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#444444', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(38), width: W - mm(6), height: 1, backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    const bcH = opts.hasQR ? mm(15) : H - mm(48);
    els.push({ id: eid(), type: 'barcode', x: mm(3), y: mm(40), width: opts.hasQR ? W - mm(30) : W - mm(6), height: bcH, content: assetNum, barcodeType: 'CODE39', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    if (opts.hasQR) {
        els.push({ id: eid(), type: 'barcode', x: W - mm(24), y: mm(40), width: mm(21), height: mm(21), content: assetNum, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: ++uid });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Asset Tag', description: `Fixed asset management tag: ${assetNum} with serial number and barcode.`, elements: els };
}

// ── 8. CUSTOM LABEL ───────────────────────────────────────────────────────────
function customLabel(W, H, opts, name, prompt) {
    const els = [];
    let uid = 0;
    const fsize = opts.fontSize || 12;
    const fstyle = opts.fontStyle || 'Arial';

    // 1. Header (follows prompt exactly)
    els.push({ id: eid(), type: 'text', x: mm(5), y: mm(5), width: W - mm(10), height: mm(10), content: name, fontSize: fsize, fontWeight: 'bold', fontFamily: fstyle, color: '#000000', textAlign: 'center', zIndex: uid++ });

    // 2. Barcode
    if (opts.hasBarcode) {
        let bcW = W * 0.7;
        let bcH = mm(18);
        let bcX = (W - bcW) / 2;
        let bcY = opts.barcodeMiddle ? (H - bcH) / 2 : mm(20);

        els.push({ id: eid(), type: 'barcode', x: bcX, y: bcY, width: bcW, height: bcH, content: `LBL-${Date.now().toString().slice(-6)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid });
    }

    addOuterBorder(els, W, H);
    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Request Based Label', description: `Design created exactly from prompt: ${prompt.slice(0, 50)}...`, elements: els };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GS1 SPECIFIC GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. GS1 PRODUCT IDENTIFICATION ──────────────────────────────────────────
function gs1ProductLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const gtin = '09506000134352';

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(8), backgroundColor: '#1e293b', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(5), content: 'GS1 PRODUCT IDENTIFICATION', fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(12), width: W - mm(8), height: mm(10), content: name, fontSize: 14, fontWeight: 'black', color: '#000000', textAlign: 'left', zIndex: uid++ });

    // AI Blocks
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(24), width: mm(40), height: mm(5), content: 'GTIN (01)', fontSize: 7, fontWeight: 'bold', color: '#64748b', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(29), width: W - mm(8), height: mm(8), content: gtin, fontSize: 13, fontWeight: 'bold', color: '#0f172a', textAlign: 'left', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(42), width: W - mm(8), height: mm(25), content: gtin, barcodeType: 'EAN13', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Product Label', description: `Standard GS1 Product Identification with GTIN (01).`, elements: els };
}

// ── 2. GS1 BATCH / LOT TRACEABILITY ──────────────────────────────────────────
function gs1TraceLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const batch = 'BATCH12345';
    const serial = 'SN-2025-001';

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(8), backgroundColor: '#0369a1', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(5), content: 'TRACEABILITY & BATCH INFO', fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(12), width: (W / 2) - mm(4), height: mm(12), content: `Batch (10):\n${batch}`, fontSize: 9, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: (W / 2), y: mm(12), width: (W / 2) - mm(4), height: mm(12), content: `Serial (21):\n${serial}`, fontSize: 9, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });

    els.push({ id: eid(), type: 'rectangle', x: mm(4), y: mm(28), width: W - mm(8), height: 1, backgroundColor: '#cbd5e1', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(32), width: W - mm(8), height: mm(5), content: `Mfg Date (11): ${new Date().toLocaleDateString()}`, fontSize: 8, color: '#475569', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(40), width: W - mm(8), height: mm(15), content: `(10)${batch}(21)${serial}`, barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Traceability Label', description: 'Traceability label with Batch (10), Serial (21) and Mfg Date (11).', elements: els };
}

// ── 3. GS1 EXPIRY & SHELF-LIFE ────────────────────────────────────────────────
function gs1ExpiryLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(8), backgroundColor: '#be123c', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(5), content: 'EXPIRY & SHELF-LIFE', fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(12), width: W - mm(8), height: mm(5), content: 'EXPIRY DATE (17)', fontSize: 8, fontWeight: 'bold', color: '#e11d48', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(18), width: W - mm(8), height: mm(15), content: '30-JUN-2026', fontSize: 24, fontWeight: 'black', color: '#000000', textAlign: 'left', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(36), width: W - mm(8), height: mm(5), content: 'BEST BEFORE (15): 01-JUN-2026', fontSize: 9, color: '#475569', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(45), width: W - mm(8), height: mm(20), content: '(17)260630(15)260601', barcodeType: 'DATAMATRIX', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Expiry Label', description: 'Expiry and Shelf-life label with specialized (17) and (15) identifiers.', elements: els };
}

// ── 4. GS1 QUANTITY & WEIGHT ──────────────────────────────────────────────────
function gs1WeightLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(8), backgroundColor: '#0d9488', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(5), content: 'QUANTITY & WEIGHT DATA', fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(12), width: W - mm(8), height: mm(5), content: 'NET WEIGHT (3103)', fontSize: 8, fontWeight: 'bold', color: '#0f766e', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(18), width: W - mm(8), height: mm(15), content: '1.250 kg', fontSize: 24, fontWeight: 'black', color: '#000000', textAlign: 'left', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(36), width: W - mm(8), height: mm(5), content: 'COUNT (30): 25 UNITS', fontSize: 9, color: '#444444', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(45), width: W - mm(8), height: mm(15), content: '(3103)001250(30)25', barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Weight Label', description: 'Logistics quantity and weight label using AI (310x) and (30).', elements: els };
}

// ── 5. GS1 LOGISTICS (SSCC) ──────────────────────────────────────────────────
function gs1LogisticLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const sscc = '123456789012345678';

    // Header
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(4), width: W - mm(8), height: mm(8), content: name, fontSize: 16, fontWeight: 'black', color: '#000000', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: mm(4), y: mm(15), width: W - mm(8), height: 1.5, backgroundColor: '#000000', zIndex: uid++ });

    // Middle Sections
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(18), width: mm(40), height: mm(15), content: `FROM:\nChennai DC\nTN, India`, fontSize: 8, color: '#334155', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: W / 2, y: mm(18), width: mm(40), height: mm(15), content: `TO:\nBengaluru Hub\nKA, India`, fontSize: 8, fontWeight: 'bold', color: '#000000', zIndex: uid++ });

    els.push({ id: eid(), type: 'rectangle', x: mm(4), y: mm(35), width: W - mm(8), height: 1, backgroundColor: '#e2e8f0', zIndex: uid++ });

    // SSCC Area
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(38), width: W - mm(8), height: mm(5), content: 'SSCC (00)', fontSize: 9, fontWeight: 'bold', color: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(44), width: W - mm(8), height: mm(10), content: `(00) ${sscc}`, fontSize: 13, fontWeight: 'bold', fontFamily: 'Courier New', zIndex: uid++ });

    // Bottom Barcode (GS1-128 standard for logistics)
    els.push({ id: eid(), type: 'barcode', x: mm(4), y: H - mm(45), width: W - mm(8), height: mm(35), content: `(00)${sscc}`, barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid, showBarcodeText: false });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Logistics Label', description: 'GS1 SSCC Pallet Label with shipping information and high-density barcode.', elements: els };
}

// ── 6. GS1 PRICE & CURRENCY ──────────────────────────────────────────────────
function gs1PriceLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(40), backgroundColor: '#ffffff', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(4), width: W - mm(8), height: mm(6), content: name, fontSize: 10, fontWeight: 'bold', color: '#475569', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(12), width: W - mm(8), height: mm(18), content: '₹ 1,500.00', fontSize: 32, fontWeight: 'black', color: '#000000', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(32), width: W - mm(8), height: mm(5), content: 'AI (3922) - INCL. ALL TAXES', fontSize: 7, color: '#94a3b8', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(8), y: mm(40), width: W - mm(16), height: mm(20), content: '39221500', barcodeType: 'EAN13', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Price Label', description: 'Retail price tag with GS1 AI (392x) currency encoding.', elements: els };
}

// ── 7. GS1 COMBO (FULL GS1-128) ──────────────────────────────────────────────
function gs1ComboLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const data = '(01)09506000134352(10)LOT12345(17)260630(21)000001';

    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(10), backgroundColor: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(2), width: W - mm(8), height: mm(6), content: 'GS1-128 COMPOSITE LABEL', fontSize: 11, fontWeight: 'black', color: '#ffffff', textAlign: 'center', zIndex: uid++ });

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(14), width: W - mm(8), height: mm(12), content: `PRODUCT: ${name}\nSTATUS: APPROVED`, fontSize: 9, fontWeight: 'bold', color: '#000000', zIndex: uid++ });

    // Table view of AIs
    els.push({ id: eid(), type: 'rectangle', x: mm(4), y: mm(30), width: W - mm(8), height: mm(25), backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(6), y: mm(32), width: W - mm(12), height: mm(20), content: `(01) GTIN: 09506000134352\n(10) BATCH: LOT12345\n(17) EXPIRY: 30-JUN-2026\n(21) SERIAL: 000001`, fontSize: 7, fontFamily: 'monospace', color: '#334155', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(60), width: W - mm(8), height: mm(30), content: data, barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'GS1 Composite Label', description: 'Industry-standard GS1-128 label with GTIN, Batch, Expiry and Serial combined.', elements: els };
}

// ── 8. SHIPPER 4x6 (IMAGE 1) ──────────────────────────────────────────────────
function shipper4x6Label(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const border = '#000000';

    // Outer Border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: 'transparent', borderWidth: 1, borderColor: border, zIndex: uid++ });

    // Dividers
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(35), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(75), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(105), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(135), width: W, height: 1, backgroundColor: border, zIndex: uid++ });

    // Row 1: From/To
    els.push({ id: eid(), type: 'rectangle', x: mm(50.8), y: 0, width: 1, height: mm(35), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(2), width: mm(45), height: mm(31), content: `FROM:\nABC Company\n1234 Distribution\n9876 Lucky Star Ave.\nSan Francisco, CA 94111`, fontSize: 7, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(52.8), y: mm(2), width: mm(45), height: mm(31), content: `TO:\nZappos Merchandising, Inc.\nc/o Amazon.com KYDC LLC.\n376 Zappos.com Blvd. FTZ#029, Site 6\nShepherdsville, KY 40165 USA`, fontSize: 7, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });

    // Row 2: Zip Code / Carrier
    els.push({ id: eid(), type: 'rectangle', x: mm(65), y: mm(35), width: 1, height: mm(40), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(37), width: mm(61), height: mm(4), content: `To Zip Code:`, fontSize: 7, fontWeight: 'bold', color: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(41), width: mm(61), height: mm(5), content: `(420) 40165`, fontSize: 7, fontWeight: 'bold', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'barcode', x: mm(10), y: mm(47), width: mm(45), height: mm(25), content: '42040165', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });

    els.push({ id: eid(), type: 'text', x: mm(67), y: mm(37), width: mm(32), height: mm(36), content: `Carrier:\nSEE CUSTOMER NOTES\n\nShip Date: 07/07/2017\nCarton Qty: 12\nBOX: 1 of 1`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });

    // Row 3: PO Barcode
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(77), width: W - mm(4), height: mm(4), content: `PO: (400) ZQTVBD8043793`, fontSize: 8, fontWeight: 'bold', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'barcode', x: mm(10), y: mm(82), width: W - mm(20), height: mm(20), content: 'ZQTVBD8043793', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });

    // Row 4: Description
    els.push({ id: eid(), type: 'rectangle', x: mm(60), y: mm(105), width: 1, height: mm(30), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(107), width: mm(56), height: mm(26), content: `Description:\nMIXED BOX\nAI50\nSize: 8.5\nColor: BLKIT`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(62), y: mm(107), width: mm(37), height: mm(26), content: `Product Type:\nFootwear`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });

    // Row 5: SSCC
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(137), width: W - mm(4), height: mm(4), content: `SSCC-18`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(141), width: W - mm(4), height: mm(4), content: `(00) 0 0655024 000197917 8`, fontSize: 8, fontWeight: 'bold', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'barcode', x: mm(15), y: mm(144), width: W - mm(30), height: mm(20), content: '0006550240001979178', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });

    addOuterBorder(els, W, H);
    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Shipper 4x6 Label', description: '4x6 inch industrial shipper label with multi-section grid, routing barcodes and PO tracking.', elements: els };
}

// ── 9. LOGISTIC 4x6 (IMAGE 2) ─────────────────────────────────────────────────
function logistic4x6Label(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const border = '#000000';
    const accent = '#ef4444'; // Red

    // Outer Border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: 'transparent', borderWidth: 1, borderColor: border, zIndex: uid++ });

    // Dividers
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(35), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(75), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(105), width: W, height: 1, backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(135), width: W, height: 1, backgroundColor: border, zIndex: uid++ });

    // Ship From/To
    els.push({ id: eid(), type: 'rectangle', x: mm(50.8), y: 0, width: 1, height: mm(35), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(2), width: mm(45), height: mm(31), content: `Ship From:\n${name}\nAddress 1\nAddress 2\nCity, State Postal Code`, fontSize: 7, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(52.8), y: mm(2), width: mm(45), height: mm(31), content: `Ship To:\nShip To Name\nShip to Alternate Name\nAddress 1\nAddress 2\nCity, State Postal Code`, fontSize: 7, fontWeight: 'bold', color: '#000000', textAlign: 'left', zIndex: uid++ });

    // Zip / Carrier
    els.push({ id: eid(), type: 'rectangle', x: mm(60), y: mm(35), width: 1, height: mm(40), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(37), width: mm(56), height: mm(4), content: `To Zip Code:`, fontSize: 7, fontWeight: 'bold', color: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'barcode', x: mm(5), y: mm(43), width: mm(50), height: mm(25), content: '40165', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });

    // Right side with red accents
    els.push({ id: eid(), type: 'text', x: mm(62), y: mm(37), width: mm(37), height: mm(4), content: `Carrier:`, fontSize: 7, fontWeight: 'bold', color: accent, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(62), y: mm(41), width: mm(37), height: mm(32), content: `Ship Date: 03/04/2026\nTracking #: T123456\nCarton Qty: 01\nBox: 1 of XXXX`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });

    // Row 3: PO Barcode
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(77), width: W - mm(4), height: mm(4), content: `PO: (400) XYZQLAO1234567`, fontSize: 8, fontWeight: 'bold', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'barcode', x: mm(10), y: mm(82), width: W - mm(20), height: mm(20), content: 'XYZQLAO1234567', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });

    // Row 4: Description/UPC
    els.push({ id: eid(), type: 'rectangle', x: mm(60), y: mm(105), width: 1, height: mm(30), backgroundColor: border, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(107), width: mm(56), height: mm(26), content: `Description:\nVendor Item #: V-99\nSize: XL\nColor: RED`, fontSize: 7, fontWeight: 'bold', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(62), y: mm(107), width: mm(37), height: mm(26), content: `UPC:\nProduct Type: Footwear\nApparel: Active`, fontSize: 7, fontWeight: 'bold', color: accent, zIndex: uid++ });

    // Row 5: SSCC
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(137), width: W - mm(4), height: mm(4), content: `Serialized Shipping Container Number`, fontSize: 7, fontWeight: 'bold', textAlign: 'center', zIndex: ++uid });
    els.push({ id: eid(), type: 'barcode', x: mm(10), y: mm(142), width: W - mm(20), height: mm(26), content: '00123456789012345678', barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid, showBarcodeText: false });

    addOuterBorder(els, W, H);
    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Logistic 4x6 Label', description: '4x6 inch GS1 Logistic label with prioritized tracking information and SSCC barcode.', elements: els };
}

// ── 11. RATION FACTORY (IMAGE 3) ──────────────────────────────────────────────
function rationFactoryLabel(W, H, opts, name) {
    const els = [];
    let uid = 1;
    const blue = '#2196F3';
    const pink = '#ef4444';
    const dark = '#1f2937';

    // 1. Logo area: Archery Logo
    els.push({ id: eid(), type: 'rectangle', x: mm(4), y: mm(6), width: mm(12), height: mm(12), backgroundColor: blue, rotation: 45, zIndex: ++uid });
    els.push({ id: eid(), type: 'rectangle', x: mm(18), y: mm(3), width: mm(1.5), height: mm(18), backgroundColor: pink, borderRadius: 10, zIndex: ++uid });
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(12), width: mm(22), height: mm(1.2), backgroundColor: dark, rotation: -25, zIndex: ++uid });
    // 2. Branding (Archery Technocrats)
    els.push({ id: eid(), type: 'text', x: mm(24), y: mm(4), width: mm(30), height: mm(6), content: 'Archery Technocrats', fontSize: 13, fontWeight: 'bold', color: '#000000', textAlign: 'center', zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: mm(24), y: mm(10), width: mm(30), height: mm(4), content: 'Targeting Perfection', fontSize: 7, fontWeight: 'bold', color: dark, textAlign: 'center', zIndex: ++uid });

    // 3. Info Grid (Right area)
    const gridX = mm(56);
    const labelW = mm(16);
    const valueX = gridX + labelW;

    els.push({ id: eid(), type: 'text', x: gridX, y: mm(3), width: mm(40), height: mm(7), content: 'Test Product', fontSize: 13, fontWeight: 'black', color: '#000000', textAlign: 'left', zIndex: ++uid });

    // 3. Product Info Grid (Top Right area)
    const rowH = mm(5.5);
    const fields = [['Weight', '500 gm'], ['MRP', '100'], ['Price', '90'], ['MFG', '10-2021'], ['EXPIRY', '10-2025']];

    fields.forEach((f, i) => {
        const yPos = mm(10.5) + (i * rowH);
        els.push({ id: eid(), type: 'text', x: gridX, y: yPos, width: labelW, height: mm(5), content: f[0], fontSize: 10, fontWeight: 'bold', color: '#000000', zIndex: ++uid });
        els.push({ id: eid(), type: 'text', x: valueX, y: yPos, width: mm(3), height: mm(5), content: ':', fontSize: 10, fontWeight: 'bold', color: '#000000', zIndex: ++uid });
        els.push({ id: eid(), type: 'text', x: valueX + mm(3), y: yPos, width: mm(24), height: mm(5), content: f[1], fontSize: 10, fontWeight: 'bold', color: '#000000', zIndex: ++uid });
    });

    // 4. Barcode
    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(24), width: mm(45), height: mm(14), content: '10006', barcodeType: 'CODE128', backgroundColor: 'transparent', zIndex: ++uid, showBarcodeText: false });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(38), width: mm(45), height: mm(5), content: '10006', fontSize: 12, fontWeight: 'black', color: '#000000', textAlign: 'center', zIndex: ++uid });

    // 5. Footer Line
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(44), width: W, height: 1, backgroundColor: '#000000', zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(45), width: mm(48), height: mm(4), content: 'care@archerytechnocrats.com', fontSize: 7, fontWeight: 'bold', zIndex: ++uid });
    els.push({ id: eid(), type: 'text', x: W - mm(50), y: mm(45), width: mm(48), height: mm(4), content: 'fssai No. 1234567890123', fontSize: 7, fontWeight: 'bold', textAlign: 'right', zIndex: ++uid });

    addOuterBorder(els, W, H);
    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Archery Technocrats Label', description: 'Matched industrial Archery design with optimized visibility.', elements: els };
}

// ── 12. ABCD EXPIRY (IMAGE 4) ─────────────────────────────────────────────────
function abcdExpiryLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(5), width: W - mm(8), height: mm(6), content: 'Item Name: ABCD', fontSize: 11, fontWeight: 'black', color: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(11), width: W - mm(8), height: mm(6), content: 'Manufacturing Date: 2018.03.01', fontSize: 10, fontWeight: 'black', color: '#000000', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(17), width: W - mm(8), height: mm(6), content: 'Expired Date: 2020.03.01', fontSize: 10, fontWeight: 'black', color: '#000000', zIndex: uid++ });

    els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(26), width: W - mm(8), height: mm(14), content: '(01)04512345678906(17)201231(10)A123', barcodeType: 'CODE128', zIndex: uid++, showBarcodeText: false });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(41), width: W - mm(8), height: mm(4), content: '(01) 04512345678906 (17) 201231 (10) A123', fontSize: 7, fontWeight: 'bold', textAlign: 'center', zIndex: uid++ });

    addOuterBorder(els, W, H);
    return { widthMm: W / MM, heightMm: H / MM, labelType: 'ABCD Expiry Label', description: 'Compact square GS1 expiry label with item name and detailed AI identifiers.', elements: els };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

// Default sizes per label type (mm)
const DEFAULT_SIZES = {
    shipper: { width: 100, height: 150 },
    product: { width: 80, height: 60 },
    pharma: { width: 70, height: 50 },
    price: { width: 50, height: 40 },
    warehouse: { width: 100, height: 60 },
    address: { width: 100, height: 55 },
    asset: { width: 90, height: 60 },
    food: { width: 80, height: 100 },
    barcode: { width: 80, height: 35 },
    gs1_product: { width: 100, height: 80 },
    gs1_trace: { width: 100, height: 70 },
    gs1_expiry: { width: 80, height: 80 },
    gs1_weight: { width: 100, height: 70 },
    gs1_logistic: { width: 100, height: 150 },
    gs1_price: { width: 60, height: 80 },
    gs1_combo: { width: 100, height: 100 },
    shipper_4x6: { width: 101.6, height: 152.4 },
    logistic_4x6: { width: 101.6, height: 152.4 },
    ration_factory: { width: 100, height: 50 },
    abcd_expiry: { width: 50, height: 50 },
    custom: { width: 100, height: 80 },
};

/**
 * Main function — call this from the chatbot.
 * @param {string} prompt - Natural language prompt from user
 * @param {object} currentSize - Current canvas size {width, height} in mm
 * @returns {object} { widthMm, heightMm, labelType, description, elements }
 */
export function generateLabel(prompt, currentSize = { width: 100, height: 150 }) {
    const labelType = detectLabelType(prompt);
    const defaultSize = DEFAULT_SIZES[labelType] || DEFAULT_SIZES.custom;
    const size = extractSize(prompt, defaultSize);
    const opts = detectOptions(prompt);
    const companyName = extractName(prompt, 'ATPL');

    const W = mm(size.width);
    const H = mm(size.height);

    switch (labelType) {
        case 'shipper': return shipperLabel(W, H, opts, companyName);
        case 'product': return productLabel(W, H, opts, companyName);
        case 'pharma': return pharmaLabel(W, H, opts, companyName);
        case 'price': return priceTag(W, H, opts, companyName);
        case 'warehouse': return warehouseLabel(W, H, opts, companyName);
        case 'address': return addressLabel(W, H, opts, companyName);
        case 'asset': return assetTag(W, H, opts, companyName);
        case 'gs1_product': return gs1ProductLabel(W, H, opts, companyName);
        case 'gs1_trace': return gs1TraceLabel(W, H, opts, companyName);
        case 'gs1_expiry': return gs1ExpiryLabel(W, H, opts, companyName);
        case 'gs1_weight': return gs1WeightLabel(W, H, opts, companyName);
        case 'gs1_logistic': return gs1LogisticLabel(W, H, opts, companyName);
        case 'gs1_price': return gs1PriceLabel(W, H, opts, companyName);
        case 'gs1_combo': return gs1ComboLabel(W, H, opts, companyName);
        case 'shipper_4x6': return shipper4x6Label(W, H, opts, companyName);
        case 'logistic_4x6': return logistic4x6Label(W, H, opts, companyName);
        case 'ration_factory': return rationFactoryLabel(W, H, opts, companyName);
        case 'abcd_expiry': return abcdExpiryLabel(W, H, opts, companyName);
        default: return customLabel(W, H, opts, companyName, prompt);
    }
}

/**
 * Generate a human-readable description of what was understood.
 */
export function explainPrompt(prompt) {
    const type = detectLabelType(prompt);
    const size = extractSize(prompt, DEFAULT_SIZES[type] || DEFAULT_SIZES.custom);
    const opts = detectOptions(prompt);
    const name = extractName(prompt, 'ATPL');

    const extras = [];
    if (opts.hasQR) extras.push('QR code');
    if (!opts.hasBarcode) extras.push('no barcode');
    if (opts.hasLogo) extras.push('logo area');
    if (opts.isAligned) extras.push('centered layout');

    return `Detected: **${type.charAt(0).toUpperCase() + type.slice(1)} Label** · ${size.width}×${size.height}mm · Company: ${name}${extras.length ? ' · ' + extras.join(', ') : ''}`;
}
