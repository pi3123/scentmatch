import { LLMAdapter } from "./adapter";
import { buildPrompt } from "./prompt";

export class OpenAIProvider implements LLMAdapter {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
    this.apiKey = process.env.LLM_API_KEY || "";
    this.model = process.env.LLM_MODEL || "gpt-4o-mini";
  }

  async generateExplanation(
    matchResult: unknown,
    tone: string
  ): Promise<string> {
    const prompt = buildPrompt(matchResult, tone);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error(`LLM error: ${res.status}`);
      return "Couldn't generate an explanation right now. Check the score and breakdown above.";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No explanation available.";
  }
}
