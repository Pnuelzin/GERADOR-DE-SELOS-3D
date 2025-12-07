import { GoogleGenAI } from "@google/genai";
import { StampFormData } from "../types";

// Helper to convert File to Base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SYSTEM_INSTRUCTION = `
Você é um gerador de prompts de selos 3D.
Recebe dados do usuário (nome do selo, tema, cores, efeitos, referências anexadas) e devolve um prompt ultra detalhado em perspectiva 3/4, com profundidade, ornamentos temáticos e efeitos visuais intensos.

O prompt deve seguir o estilo de cartazes promocionais 3D: texto central grande e volumoso, ornamentos ao redor, fundo escuro com profundidade e iluminação dramática.

Sempre inclua:
- Texto central com relevo e cores especificadas
- Ornamentos temáticos relacionados ao evento
- Fundo com textura e profundidade
- Iluminação e efeitos visuais (glow, neon, fogo, metálico, degradê)
- Renderização em 8K ultra detalhado
- Pós-processo com realismo (imperfeições, microdetalhes, evitar artefatos)

Template de saída (Prompt gerado). O modelo deve devolver algo assim:
"Selo 3D em perspectiva com o texto central “{NOME_DO_SELO}” em estilo {TEMA}.
O título deve aparecer em letras volumosas, metálicas e brilhantes, com cores {CORES}, aplicando efeitos {EFEITOS}.
Composição: texto central em relevo alto com bordas biseladas; fundo escuro com textura e profundidade marcada; ornamentos temáticos ao redor (baseados nas referências anexadas).
Iluminação: esquema three-point com key 45° sobre o texto, rim para recorte metálico, fill 30% neutro; HDR estúdio com reflexos controlados; bloom leve nos glows; lens dirt sutil para atmosfera.
Óptica: lente 85mm, f/5.6, close-up em ângulo 3/4; foco cravado no texto; DOF sutil destacando ornamentos; bokeh neutro sem distorções.
Render: 8K ultra detalhado, amostragem alta, SSR ativo, PBR rigoroso em metais e esmaltes; normal/roughness/metalness calibrados; AO suave; evitar clipping em highlights.
Pós-processo: tonemapping filmic, curvas em S suave, micro-sharpen em arestas do texto e ornamentos, grão finíssimo para textura realista; correção de cor mínima para preservar contraste entre as cores e efeitos.
Diretrizes de realismo: fissuras, brilho irregular, variação de cor nos ornamentos, marcas discretas de manufatura; evitar flare sobre tipografia e excesso de glow."
`;

const getApiKey = (): string | undefined => {
  // Tenta encontrar a chave em diferentes locais comuns
  try {
    // 1. Node.js / Webpack / CRA / Vercel padrão
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    
    // 2. Fallback para prefixos comuns se a variável pura não for exposta
    if (typeof process !== 'undefined') {
       if (process.env?.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
       if (process.env?.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
    }

    // 3. Vite (import.meta.env)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Erro ao ler variáveis de ambiente:", e);
  }
  return undefined;
};

export const generateStampPrompt = async (data: StampFormData): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "Chave de API não encontrada.\n" +
      "Se estiver no Vercel, adicione 'API_KEY' nas configurações de Environment Variables do projeto."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare prompt parts
  const textPrompt = `
    Gere um prompt detalhado para um selo 3D com as seguintes especificações:
    
    Nome do selo (texto central): ${data.name}
    Tema: ${data.theme}
    Cores principais: ${data.colors}
    Efeitos desejados: ${data.effects}
    
    ${data.images.length > 0 ? 'Use as imagens anexadas como referência visual para ornamentos e estilo.' : ''}
  `;

  const parts: any[] = [{ text: textPrompt }];

  // Add images if present
  if (data.images.length > 0) {
    const imageParts = await Promise.all(data.images.map(fileToPart));
    parts.push(...imageParts);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      }
    });

    return response.text || "Não foi possível gerar o prompt. Tente novamente.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate the specific error message from the API or network
    throw new Error(error.message || "Erro desconhecido na API do Gemini");
  }
};