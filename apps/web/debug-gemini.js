const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Unfortunately the SDK doesn't have a direct listModels method on the client instance in some versions,
        // but let's try a direct fetch if needed or use the model content to test.
        // Actually, let's just test the generation with different model names.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-pro",
            "gemini-1.5-pro"
        ];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            console.log(`\nTesting: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test.");
                console.log(`✅ ${modelName}: SUCCESS`);
            } catch (e) {
                console.log(`❌ ${modelName}: FAILED - ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

listModels();
