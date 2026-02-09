import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "../../shared/observability/logger";

// Generates a building maintenance plan based on specific condo details using Gemini API
export const generateMaintenancePlan = async (condoType: string, facilities: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Using 'gemini-3-flash-preview' for specialized text generation tasks
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Atue como um engenheiro civil especialista em manutenção predial.
      Crie um plano de manutenção resumido para um condomínio do tipo: "${condoType}".
      O condomínio possui as seguintes áreas/equipamentos: "${facilities}".
      
      Retorne um JSON array contendo manutenções preventivas essenciais.
    `;

    // Always configure responseSchema for JSON output tasks to ensure consistency
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Nome da Manutenção',
              },
              category: {
                type: Type.STRING,
                description: 'Categoria (ex: Elétrica, Hidráulica)',
              },
              frequency: {
                type: Type.STRING,
                description: 'Mensal/Semestral/Anual',
              },
              description: {
                type: Type.STRING,
                description: 'Breve descrição do que fazer',
              },
            },
            required: ["title", "category", "frequency", "description"],
            propertyOrdering: ["title", "category", "frequency", "description"],
          },
        },
      },
    });

    // Access the text property directly from the response object as per updated @google/genai guidelines
    return response.text || "[]";
  } catch (error) {
    logger.error("Gemini Error:", error);
    // Return standard fallback items for demo purposes if the API fails
    return `[
      {
        "title": "Exemplo: Verificar Extintores (Modo Demo - Sem API Key)",
        "category": "Sistema de Incêndio",
        "frequency": "Mensal",
        "description": "Verificar manômetro e lacre."
      }
    ]`;
  }
};18446744073709551614