import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
    try {
        const { mode, text, context, style } = await req.json();
        console.log("API received:", { mode, text, context, style });

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ result: ["Please enter some text"] }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Map mode to prompt - more natural language
        let prompt;
        if (mode === "fix") {
            prompt = `Correct this text's grammar and spelling. Return ONLY the corrected text, no explanations, no quotes, no emojis, no introductory text: "${text}"`;
        } else if (mode === "rephrase") {
            prompt = `Rephrase this text in 3-5 different ways. Return ONLY a numbered list of rephrased versions (1. 2. 3. etc.), no explanations, no quotes, no emojis, no introductory text: "${text}"`;
        } else if (mode === "flirt") {
            const stylePrompts = {
                playful: "playful, fun, and teasing - like a natural flirtatious conversation",
                romantic: "romantic, sweet, and heartfelt - genuine and sincere",
                confident: "confident, bold, and charismatic - self-assured but not arrogant",
                mysterious: "mysterious, intriguing, and enigmatic - leaves them wanting more",
                cheesy: "cheesy, funny, and lighthearted - playful and humorous"
            };

            const styleDesc = stylePrompts[style] || "flirtatious and charming";
            const contextText = context ? `Context: ${context}. ` : "";

            prompt = `Generate 3-5 flirtatious replies to this message. Style: ${styleDesc}. ${contextText}

IMPORTANT INSTRUCTIONS:
- Return ONLY a numbered list of replies (1. 2. 3. etc.)
- No explanations, no introductory text
- Remove ALL double quotes from the responses
- Remove ALL emojis
- Sound like a real human conversation - natural and authentic
- Use subtle, organic slang that doesn't feel forced
- Avoid overusing Gen-Z terms - keep it balanced and realistic
- Make it flow like actual speech, not like AI-generated text
- Focus on being clever and engaging rather than using trendy slang

Message: "${text}"`;
        } else {
            return new Response(
                JSON.stringify({ result: ["Invalid mode"] }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        console.log("Sending prompt to Gemini:", prompt);

        // Call Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        console.log("Raw response from Gemini:", response);

        let geminiText = "";
        if (response.text) {
            geminiText = response.text;
        } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            geminiText = response.candidates[0].content.parts[0].text;
        } else {
            throw new Error("No response text found from Gemini");
        }

        console.log("Extracted text:", geminiText);

        // Enhanced processing to remove unwanted elements
        const cleanText = (text) => {
            let cleaned = text;

            // Remove common introductory phrases
            const introPatterns = [
                /^Here are \d+ flirtatious replies:\s*/i,
                /^Here are \d+ rephrased versions:\s*/i,
                /^Here are \d+ alternatives:\s*/i,
                /^Here are the results:\s*/i,
                /^Here you go:\s*/i,
                /^Certainly! Here are \d+.*:\s*/i,
                /^I've generated \d+.*:\s*/i,
                /^\d+\.\s*Here are.*\n/i,
            ];

            introPatterns.forEach(pattern => {
                cleaned = cleaned.replace(pattern, '');
            });

            // Remove ALL double quotes
            cleaned = cleaned.replace(/"/g, '');

            // Remove ALL emojis
            cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
            cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
            cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
            cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');

            // Remove over-the-top Gen-Z slang that slipped through
            const cringeSlang = [
                /\bw rizz\b/gi,
                /\bno cap\b/gi,
                /\bmain character energy\b/gi,
                /\bslaying\b/gi,
                /\bvibes are immaculate\b/gi,
                /\brizz\b/gi,
                /\bhighkey\b/gi,
                /\blowkey\b/gi,
                /\bbet\b/gi,
                /\bslay\b/gi,
                /\bsus\b/gi,
                /\bbased\b/gi,
                /\bfr fr\b/gi,
            ];

            cringeSlang.forEach(pattern => {
                cleaned = cleaned.replace(pattern, '');
            });

            // Clean up extra spaces
            cleaned = cleaned.replace(/\s+/g, ' ').trim();

            return cleaned;
        };

        // Process the response
        let results;
        if (mode === "fix") {
            const fixedText = cleanText(geminiText);
            results = [fixedText];
        } else {
            // Enhanced splitting that handles various formats
            let lines = geminiText.split('\n');

            // Clean each line and look for numbered items
            const numberedItems = lines
                .map(line => cleanText(line))
                .filter(line => line.length > 0)
                .map(line => {
                    // Extract content after numbers like "1.", "2.", etc.
                    const match = line.match(/^\d+\.\s*(.+)$/);
                    return match ? match[1].trim() : line.trim();
                })
                .filter(line => {
                    // Filter out any remaining introductory text and cringe slang
                    const lowerLine = line.toLowerCase();
                    return !lowerLine.includes('here are') &&
                        !lowerLine.includes('certainly') &&
                        !lowerLine.includes('i\'ve generated') &&
                        !lowerLine.includes('replies:') &&
                        !lowerLine.includes('versions:') &&
                        !lowerLine.includes('alternatives:') &&
                        !lowerLine.includes('rizz') &&
                        !lowerLine.includes('no cap') &&
                        line.length > 5;
                })
                .slice(0, 5);

            results = numberedItems.length > 0 ? numberedItems : [cleanText(geminiText)];
        }

        // Final cleanup fallback
        if (results.length === 0 || (mode !== "fix" && results.length === 1 && results[0].toLowerCase().includes('here are'))) {
            const aggressiveClean = cleanText(geminiText)
                .split(/\n+/)
                .map(line => line.trim())
                .filter(line => {
                    const lowerLine = line.toLowerCase();
                    return line.length > 5 &&
                        !lowerLine.startsWith('here are') &&
                        !lowerLine.startsWith('certainly') &&
                        !lowerLine.startsWith('i\'ve') &&
                        !/^\d+\.\s*here are/i.test(lowerLine) &&
                        !lowerLine.includes('rizz') &&
                        !lowerLine.includes('no cap');
                })
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(line => line.length > 0)
                .slice(0, 5);

            results = aggressiveClean.length > 0 ? aggressiveClean : [cleanText(geminiText)];
        }

        // Final pass: ensure clean, natural language
        results = results.map(line => {
            let cleaned = cleanText(line);
            // Make it sound more natural by removing any remaining AI-sounding phrases
            return cleaned.replace(/\b(?:thus|hence|therefore|indeed|certainly)\b/gi, '');
        });

        console.log("Final processed results:", results);

        return new Response(JSON.stringify({ result: results }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("API error:", err);
        return new Response(
            JSON.stringify({ result: [`Error: ${err.message}`] }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}