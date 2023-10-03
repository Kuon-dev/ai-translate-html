import { type RequestHandler } from "@builder.io/qwik-city";
import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import cheerio from "cheerio";

type CounterBody = {
  model: string;
  htmlString: string;
  htmlTags: string[];
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const { model, htmlString, htmlTags } = (await parseBody()) as CounterBody;
  const enc = encodingForModel((model || "gpt-4") as TiktokenModel);

  const $ = cheerio.load(htmlString);
  // const allChainedPromises: Promise<void>[] = [];
  const textNodes: { index: number; text: string }[] = [];

  for (const tag of htmlTags) {
    $(tag).each((index, element) => {
      const htmlContent = $(element).html();
      if (!htmlContent) return;

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
    });
  }

  let totalTokens = 0;
  for (const text of textNodes){
    const tokenCount = enc.encode(text.text).length;
    const promptCount = enc.encode('You will be provided with a sentence in English, and your task is to translate it into ${lang} in the context of a fintech industry. Provide only translated text. No elaboration.').length;
    totalTokens += (tokenCount + promptCount)
  }
      json(200, { totalTokens });
};
