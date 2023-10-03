import { type RequestHandler } from "@builder.io/qwik-city";
import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import cheerio from "cheerio";

type CounterBody = {
  textNodes: any[]
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const { textNodes } = (await parseBody()) as CounterBody;
  const enc = encodingForModel("gpt-4" as TiktokenModel);

  let totalTokens: number = 0;
  for (const text of textNodes){
    const tokenCount = enc.encode(text.text).length;
    const promptCount = enc.encode('You will be provided with a sentence in English, and your task is to translate it into ${lang} in the context of a fintech industry. Provide only translated text. No elaboration.').length;
      totalTokens += (tokenCount + promptCount)
  }
      json(200, { totalTokens });
};
