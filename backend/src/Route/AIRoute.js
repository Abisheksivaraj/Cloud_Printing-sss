const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticateToken } = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Compact system prompt (minimized tokens) ──────────────────────────────────
const SYSTEM_PROMPT = `You are a label design AI. Return ONLY valid JSON for label elements. No markdown, no explanation.

Pixel conversion: 1mm = 3.78px. All x,y,width,height in PIXELS.

Label type standards (use these sizes by default):
- shipper/shipping: 100x150mm, include FROM/TO address blocks, Code128 barcode, tracking number, service badge
- product: 80x60mm, product name, barcode, details
- address: 100x50mm, recipient + return address
- price/price-tag: 50x30mm, price (large), product name, barcode
- warehouse: 100x50mm, location code (large bold), barcode, zone
- pharma/pharmaceutical: 70x40mm, drug name, dosage, warning

JSON format:
{"widthMm":N,"heightMm":N,"labelType":"...","description":"...","elements":[{"id":"e1","type":"text|barcode|rectangle","x":N,"y":N,"width":N,"height":N,"content":"...","fontSize":N,"fontFamily":"Arial","fontWeight":"normal|bold","textAlign":"left|center|right","color":"#hex","backgroundColor":"transparent","borderColor":"transparent","borderWidth":0,"borderStyle":"solid","rotation":0,"opacity":1,"zIndex":N,"barcodeType":"CODE128|QR|EAN13"}]}

Rules:
- No overlapping elements, 10px margin from edges
- Barcode elements need barcodeType field
- Use realistic placeholder data
- Make it look professional`;

// ── Retry helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateWithRetry(model, prompt, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            const is429 = err.status === 429;
            if (is429 && attempt < retries) {
                // Extract retry delay from error, default to 20s
                const delayMatch = JSON.stringify(err).match(/"retryDelay":"(\d+)s"/);
                const delay = delayMatch ? parseInt(delayMatch[1]) * 1000 + 1000 : 20000;
                console.log(`Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retries})...`);
                await sleep(delay);
            } else {
                throw err;
            }
        }
    }
}

// ── POST /api/ai/generate-label ───────────────────────────────────────────────
router.post("/api/ai/generate-label", authenticateToken, async (req, res) => {
    try {
        const { prompt, labelSize } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
            return res.status(500).json({ success: false, message: "GEMINI_API_KEY not configured in backend/.env" });
        }

        // Use flash-lite for lower token cost & higher free quota
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const canvasW = labelSize?.width || 100;
        const canvasH = labelSize?.height || 150;

        const fullPrompt = `${SYSTEM_PROMPT}

Canvas: ${canvasW}x${canvasH}mm
Request: "${prompt}"

Generate the JSON now:`;

        let responseText;
        try {
            responseText = await generateWithRetry(model, fullPrompt);
        } catch (apiErr) {
            if (apiErr.status === 429) {
                return res.status(429).json({
                    success: false,
                    message: "AI quota exceeded. Please wait 15–30 seconds and try again, or upgrade your Gemini API plan at ai.google.dev."
                });
            }
            throw apiErr;
        }

        // Extract JSON from response
        let jsonStr = responseText;
        const jsonMatch =
            responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
            responseText.match(/```\s*([\s\S]*?)\s*```/) ||
            responseText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        let labelData;
        try {
            labelData = JSON.parse(jsonStr.trim());
        } catch {
            console.error("Parse fail:", responseText.slice(0, 300));
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON. Try a more specific prompt (e.g. 'create a shipper label 100x150mm')."
            });
        }

        if (!Array.isArray(labelData.elements)) {
            return res.status(500).json({ success: false, message: "AI response is missing elements array." });
        }

        // Normalize elements
        const ts = Date.now();
        labelData.elements = labelData.elements.map((el, i) => ({
            rotation: 0,
            opacity: 1,
            borderRadius: 0,
            lockAspectRatio: false,
            ...el,
            id: `ai_${ts}_${i}`,
            x: el.x ?? 10,
            y: el.y ?? 10,
            width: el.width ?? 100,
            height: el.height ?? 30,
            zIndex: el.zIndex ?? i,
        }));

        res.json({
            success: true,
            labelData: {
                widthMm: labelData.widthMm || canvasW,
                heightMm: labelData.heightMm || canvasH,
                labelType: labelData.labelType || "Custom Label",
                description: labelData.description || "AI-generated label",
                elements: labelData.elements,
            },
        });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "AI generation failed. Please try again.",
        });
    }
});

module.exports = router;
