import { OpenAI } from "openai";
import cheerio from "cheerio";


export async function translate(
  lang: string,
  htmlString: string,
  htmlTags: string[],
  timeout: number = 60000, // Timeout duration in milliseconds
): Promise<string> {
  const openai = new OpenAI({
    apiKey: (import.meta as any).env.VITE_API_KEY ?? "",
  });

  const $ = cheerio.load(htmlString);
  const allChainedPromises: Promise<void | string>[] = [];
  let total = 0;
  let completed = 0;

  for (const tag of htmlTags) {
    $(tag).each((_, element) => {
      const htmlContent = $(element).html();
      if (!htmlContent) return;

      const textNodes: { index: number; text: string }[] = [];
      $(element)
        .contents()
        .each((i, el) => {
          if (el.type === "text") {
            const text = $(el).text().trim();
            if (text && isNaN(Number(text))) {
              textNodes.push({ index: i, text });
              total++
            }
          }
        });

      const chainedPromise = textNodes.reduce(
        async (acc: Promise<void>, { index, text }) => {
          return acc.then(() => {
            const apiPromise = openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `Translate following sentence into ${lang}. No elaboration, no explanation`,
                },
                {
                  role: "user",
                  content: `Translate '${text}' into ${lang}.`,
                },
              ],
            });

            const timeoutPromise = new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            );

            return Promise.race([apiPromise, timeoutPromise])
              .then((response: any) => {
                const translatedText = response.choices[0].message.content || "";
                const textNode = $(element).contents().get(index);
                if (textNode) {
                  $(textNode).replaceWith(translatedText);
                }
              }).then(() => {
                completed++;
                console.log(completed, total)}
              )
              .catch((error) => {
                console.error(
                  `Failed to translate text at index ${index}: ${error.message}. Original source: '${text}'`
                );
              });
          });
        },
        Promise.resolve()
      );

      allChainedPromises.push(chainedPromise);
    });
  }

  const results = await Promise.allSettled(allChainedPromises);
  const successfulPromises = results.filter(
    (result) => result.status === "fulfilled"
  );
  console.log(successfulPromises)

  return $.html();
}

