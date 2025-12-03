import { GoogleGenAI, Type } from "@google/genai";
import { Objective } from "../types";
import { calculateObjectiveProgress } from "../utils/helpers";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. In a real environment, the key should be set.
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const suggestKRSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "The concise title of the Key Result.",
        },
        description: {
          type: Type.STRING,
          description: "A brief, optional description for the Key Result.",
        }
      },
      required: ["title"],
    },
};

export const suggestKeyResults = async (objectiveTitle: string, objectiveDescription?: string) => {
  if (!API_KEY) throw new Error("API key not configured.");
  
  const prompt = `
    Based on the following Objective, suggest 3 to 5 specific, measurable, achievable, relevant, and time-bound (SMART) Key Results.
    Each Key Result should be a simple statement of an outcome that can be tracked with a 0-100% progress.
    Objective Title: "${objectiveTitle}"
    Objective Description: "${objectiveDescription || 'No description provided.'}"
    
    Provide the Key Results in a structured JSON format with just a "title" and an optional "description".
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: suggestKRSchema,
        }
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error suggesting Key Results:", error);
    throw new Error("Failed to get AI suggestions. Please try again.");
  }
};

export const rewriteTextAsSMART = async (text: string, type: 'Objective' | 'Key Result') => {
    if (!API_KEY) throw new Error("API key not configured.");

    const prompt = `
        Rewrite the following ${type} to be more specific, measurable, achievable, relevant, and time-bound (SMART).
        Keep the tone professional and concise.
        Original text: "${text}"
        
        Return only the rewritten text, without any preamble.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error rewriting text:", error);
        throw new Error("Failed to get AI rewrite. Please try again.");
    }
};

export const generateSummaryReport = async (objective: Objective) => {
    if (!API_KEY) throw new Error("API key not configured.");
    
    const progressHistory = objective.keyResults.flatMap(kr => 
        kr.progressUpdates.map(pu => 
            `- On ${new Date(pu.date).toLocaleDateString()}, KR "${kr.title}" was updated to ${pu.value}%. Comment: ${pu.comment || 'N/A'}`
        )
    ).join('\n');

    const prompt = `
        Generate a concise summary report for the following Objective based on its details and progress history for the quarter.
        The report should highlight achievements, identify potential risks or learnings, and provide a concluding thought.

        Objective Title: "${objective.title}"
        Description: "${objective.description}"
        Status: ${objective.status}
        Overall Progress: ${calculateObjectiveProgress(objective)}%

        Key Results & their final progress:
        ${objective.keyResults.map(kr => `- "${kr.title}": ${kr.progress}% complete`).join('\n')}

        Progress Update Log:
        ${progressHistory || "No progress updates were logged."}

        Generate the report in markdown format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating summary report:", error);
        throw new Error("Failed to generate AI summary. Please try again.");
    }
};

export const generateCfrSummary = async (objective: Objective, recentProgress: string) => {
  if (!API_KEY) throw new Error("API key not configured.");

  const prompt = `
    Based on the Objective and its recent progress, generate a summary for the "What Happened This Month?" section of a CFR session.
    Objective Title: "${objective.title}"
    Key Results:
    ${objective.keyResults.map(kr => `- ${kr.title} (Current Progress: ${kr.progress}%)`).join('\n')}
    Recent Progress Updates:
    ${recentProgress || "No specific updates provided this month."}

    Summarize the key achievements and progress points concisely in 2-3 sentences.
  `;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating CFR summary:", error);
    throw new Error("Failed to get AI summary.");
  }
};

export const suggestCfrRisks = async (objective: Objective) => {
  if (!API_KEY) throw new Error("API key not configured.");

  const krData = objective.keyResults.map(kr => {
      return `- ${kr.title} (Progress: ${kr.progress}%, Due: ${kr.dueDate})`;
  }).join('\n');

  const prompt = `
    Analyze the following Objective and its Key Results to identify potential challenges or risks for the upcoming month.
    Objective Title: "${objective.title}"
    Overall Status: ${objective.status}
    Key Results Data:
    ${krData}

    List 2-3 potential risks as bullet points, based on current progress, status, or upcoming deadlines.
    For example, if progress is low and the deadline is near, that is a risk.
  `;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error suggesting CFR risks:", error);
    throw new Error("Failed to get AI risk suggestions.");
  }
};

export const suggestCfrNextPlans = async (objective: Objective) => {
    if (!API_KEY) throw new Error("API key not configured.");
    
    const krData = objective.keyResults.map(kr => {
         return `- ${kr.title} (Current Progress: ${kr.progress}%)`;
    }).join('\n');

    const prompt = `
        Based on the Objective and the current progress of its Key Results, suggest a brief plan for "Next Month's Plans".
        Focus on the KRs that have the lowest progress or are most critical.
        Objective Title: "${objective.title}"
        Key Results Data:
        ${krData}

        Suggest 2-3 actionable steps as bullet points for the next month.
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting CFR next plans:", error);
        throw new Error("Failed to get AI plan suggestions.");
    }
};
