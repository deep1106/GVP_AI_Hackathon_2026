import { GoogleGenAI } from "@google/genai";
import { PerformanceRecord, Student } from "../types";

// Fallback logic matching specific requirements:
// >= 75: Good
// 50 - 74: Average
// < 50: Needs Improvement
const generateFallbackRemark = (marks: number): string => {
  if (marks >= 75) return "Good";
  if (marks >= 50) return "Average";
  return "Needs Improvement";
};

export const aiService = {
  generatePerformanceRemark: async (studentName: string, marks: number, subject: string): Promise<string> => {
    try {
      if (!process.env.API_KEY) {
        console.warn("API Key not found, using fallback AI logic.");
        return generateFallbackRemark(marks);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';
      
      const prompt = `
        Act as a strict grading system. Return ONLY one of the following strings based on the marks provided, nothing else:
        - "Good" (if marks >= 75)
        - "Average" (if marks between 50 and 74)
        - "Needs Improvement" (if marks < 50)

        Student: ${studentName}
        Marks: ${marks}
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text?.trim() || generateFallbackRemark(marks);

    } catch (error) {
      console.error("AI Generation Error:", error);
      return generateFallbackRemark(marks);
    }
  },

  analyzeAttendanceRisk: (attended: number, total: number): { isRisk: boolean; message: string } => {
    const percentage = total === 0 ? 0 : (attended / total) * 100;
    
    // Warning if < 75%
    if (percentage < 75) {
        return {
            isRisk: true,
            message: `⚠ Attendance Shortage (${percentage.toFixed(1)}%)`
        };
    }
    return { isRisk: false, message: "Attendance is sufficient." };
  }
};