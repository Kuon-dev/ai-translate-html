import OpenAI from "openai";
import cheerio from "cheerio";

export async function translate(lang: string, htmlString: string, htmlTags: string[]): Promise<string> {
  const openai = new OpenAI({
    apiKey: (import.meta as any).env.VITE_API_KEY ?? "",
  });

  const $ = cheerio.load(htmlString);

  for (const tag of htmlTags) {
    $(tag).each((index, element) => {
      const htmlContent = $(element).html();
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

      /* eslint-disable-next-line */
      const translateTasks = textNodes.map(({ index, text }) =>
        openai.chat.completions.create({
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
        })
      );

      Promise.all(translateTasks).then((responses) => {
        responses.forEach((response, i) => {
          const translatedText = response.choices[0].message.content || "";
          const textNode = $(element).contents().get(textNodes[i].index);
          if (textNode) {
            $(textNode).replaceWith(translatedText);
          }
        });
      });
    });
  }

  // Wait for translations to finish
  // This is just for demonstration. In a real-world application,
  // you would need a more robust way to confirm that all translations are complete.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return $.html();
}
