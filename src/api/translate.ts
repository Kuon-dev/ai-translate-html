import { OpenAI } from "openai";
import cheerio from "cheerio";

export async function translate(lang: string, htmlString: string, htmlTags: string[]): Promise<string> {
  const openai = new OpenAI({
    apiKey: (import.meta as any).env.VITE_API_KEY ?? "",
  });

  const $ = cheerio.load(htmlString);
  const allChainedPromises: Promise<void>[] = [];

  for (const tag of htmlTags) {
    $(tag).each((index, element) => {
      let htmlContent = $(element).html();
      if (!htmlContent) return;

      const textNodes: { index: number; text: string }[] = [];
      $(element)
        .contents()
        .each((i, el) => {
          if (el.type === "text") {
            const text = $(el).text().trim();
            if (text) {
              textNodes.push({ index: i, text });
            }
          }
        });

      const chainedPromise = textNodes.reduce((acc, { index, text }) => {
        return acc.then(() => {
          return openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You will be provided with a sentence in English, and your task is to translate it into ${lang}`,
              },
              {
                role: "user",
                content: `Translate '${text}' into ${lang}. Provide only the translated text. No elaboration.`,
              },
            ],
          }).then((response) => {
            const translatedText = response.choices[0].message.content || "";
            const textNode = $(element).contents().get(index);
            if (textNode) {
              $(textNode).replaceWith(translatedText);
            }
          });
        });
      }, Promise.resolve());

      allChainedPromises.push(chainedPromise);
    });
  }

  await Promise.all(allChainedPromises);  // Wait for all chains to complete.
  
  return $.html();
}

