export interface LLMAdapter {
  generateExplanation(
    matchResult: unknown,
    tone: string
  ): Promise<string>;
}

export async function createLLMAdapter(): Promise<LLMAdapter> {
  const provider = process.env.LLM_PROVIDER || "openai";

  switch (provider) {
    case "openai": {
      const { OpenAIProvider } = await import("./openai-provider");
      return new OpenAIProvider();
    }
    default:
      throw new Error(
        `Unknown LLM provider: ${provider}. Supported: "openai".`
      );
  }
}
