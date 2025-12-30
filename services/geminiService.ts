
import { GoogleGenAI, Type } from "@google/genai";
import { StitchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KEY });

export const analyzeStitchPattern = async (base64Image: string, mimeType: string): Promise<StitchResult> => {
  const model = 'gemini-3-flash-preview';

  const prompt = `You are an expert fiber artist and pattern designer. Analyze the provided image of a crochet or knitting work-in-progress (WIP).

Your analysis MUST follow these steps:
1. Overall shape and structure: Is it a flat panel, round, 3D shape, etc.?
2. Stitch texture and repetition: Identify the rhythmic pattern of loops and bars.
3. Thickness of yarn: Estimate weight (e.g., Worsted, DK, Bulky).
4. Identify stitches: Correct identification of common stitches (sc, hdc, dc, tr, etc.).

Required Output Fields:
- projectName: Identify the likely project (e.g., coaster, tote bag, granny square, cardigan panel, amigurumi, scarf, etc.).
- stitchName: The common name of the overall pattern (e.g., Alpine Stitch, Moss Stitch, Granny Cluster).
- primaryStitches: List 1-3 dominant stitches used.
- secondaryStitches: List any decorative or edge stitches.
- explanation: Explain WHY you identified these stitches by referencing specific visual clues from the photo (e.g., "The horizontal bar visible under the top loops indicates half double crochet").
- confidence: A numeric score (1-100) following these STRICT rules:
    * 80–95%: Visual clues clearly and strongly match a common stitch/pattern.
    * 50–75%: Match is good but imperfect (lighting/angle/blur/partial view).
    * 30–50% or lower: Only when truly uncertain or no clear match.
    * DO NOT guess confidently when unsure.
- hookSize: Suggested tool size based on yarn and stitch density.
- difficulty: Skill level (Beginner, Easy, Intermediate, Advanced, Expert).
- yarnWeight: Estimated weight category.

Return the result as a raw JSON object matching the StitchResult interface.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            data: base64Image,
            mimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          primaryStitches: { type: Type.ARRAY, items: { type: Type.STRING } },
          secondaryStitches: { type: Type.ARRAY, items: { type: Type.STRING } },
          stitchName: { type: Type.STRING },
          explanation: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          hookSize: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          yarnWeight: { type: Type.STRING }
        },
        required: ["projectName", "primaryStitches", "secondaryStitches", "stitchName", "explanation", "confidence", "hookSize", "difficulty", "yarnWeight"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("No response from AI");
  }

  return JSON.parse(resultText) as StitchResult;
};
