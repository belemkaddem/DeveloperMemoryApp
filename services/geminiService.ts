import { GoogleGenAI, Type } from "@google/genai";
import { AIReply, NoteType } from "../types";

const SYSTEM_PROMPT = `
Tu es un assistant expert pour un développeur Java/Spring Senior. 
L'utilisateur va te donner du texte brut (une commande, un bout de code, une URL, ou une explication mal formatée).
Ta tâche est de structurer cette information pour la rendre mémorisable et utile.

Règles :
1. Détermine le 'type' le plus approprié (COMMAND, SNIPPET, PROCEDURE, LINK, CONFIG, ERROR_FIX).
2. Génère un 'title' concis et descriptif.
3. Formate le 'content' en Markdown propre. Si c'est du code, utilise les blocs de code. Si c'est une procédure, utilise des listes à puces.
4. Génère des 'tags' pertinents (ex: 'maven', 'docker', 'spring-boot', 'jpa').
`;

// Helper pour récupérer la clé API que ce soit dans l'environnement Web actuel ou en Local (Vite)
const getApiKey = (): string | undefined => {
  // @ts-ignore - Support pour Vite (Local)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // Support pour l'environnement Node/Web standard actuel
  return process.env.API_KEY;
};

export const analyzeContentWithGemini = async (rawText: string): Promise<AIReply> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key manquante. En local, créez un fichier .env avec VITE_API_KEY=votre_cle.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: rawText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { 
              type: Type.STRING, 
              enum: [
                'COMMAND', 'SNIPPET', 'PROCEDURE', 'LINK', 'CONFIG', 'ERROR_FIX'
              ]
            },
            formattedContent: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ['title', 'type', 'formattedContent', 'tags']
        }
      }
    });

    if (!response.text) {
      throw new Error("Réponse vide de Gemini");
    }

    const data = JSON.parse(response.text) as AIReply;
    // Map string to Enum just to be safe, though Schema validation handles it mostly
    const mappedType = Object.values(NoteType).includes(data.type as NoteType) 
      ? (data.type as NoteType) 
      : NoteType.SNIPPET;

    return {
      ...data,
      type: mappedType
    };

  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw error;
  }
};