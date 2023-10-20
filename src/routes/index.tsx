import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import MonacoEditor from "~/integrations/react/monaco";
import LangSelect, { languages } from "~/integrations/react/LanguageSelect";
import { routeAction$, type DocumentHead } from "@builder.io/qwik-city";
import { qwikify$ } from "@builder.io/qwik-react";

import { Button } from "~/integrations/shadcn/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { translate } from "~/api/translate";
import { toast } from "sonner";
import cheerio from "cheerio";
import { useDebounce } from "~/hooks/useDebounce";
// import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import { Tiktoken } from "@dqbd/tiktoken/lite";
import cl100k_base from "@dqbd/tiktoken/encoders/cl100k_base.json";

const QMonacoEditor = qwikify$(MonacoEditor, { eagerness: "load" });
const QButton = qwikify$(Button, { eagerness: "hover" });
const QLang = qwikify$(LangSelect, { eagerness: "hover" });
const QScrollArea = qwikify$(ScrollArea, { eagerness: "load" });

export const useTokenCounter = routeAction$(async (data) => {
  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str,
  );

  let totalTokens: number = 0;
  for (const text of data.textNodes as any[]) {
    const tokenCount = encoding.encode(text.text).length;
    const promptCount = encoding.encode(
      "You will be provided with a sentence in English, and your task is to translate it into ${lang} in the context of a fintech industry. Provide only translated text. No elaboration.",
    ).length;
    totalTokens += tokenCount + promptCount;
  }
  return {
    totalTokens,
  };
});

export const useTranslateHtml = routeAction$(async (data) => {
  const lang = data.lang as string;
  const htmlString = data.htmlString as string;
  if (!lang || !htmlString)
    return {
      fail: true,
      message: "empty language or html content",
    };
  // const htmlTags = data.htmlTags.split(',');
  const htmlTags = [
    "h1",
    "p",
    "span",
    "a",
    "div",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
  ];

  const translatedHtml = await translate(lang, htmlString, htmlTags);
  console.log(translatedHtml);

  return {
    success: true,
    translatedHtml,
  };
});

export default component$(() => {
  const editorValue = useSignal("");
  const selectLang = useSignal<string>("");

  const action = useTranslateHtml();
  const counter = useTokenCounter();

  const tokenCount = useSignal<number>(0);
  const debouncedSig = useDebounce(editorValue, 500);
  const htmlTags = [
    "h1",
    "p",
    "span",
    "a",
    "div",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
  ];

  useVisibleTask$(async ({ track }) => {
    track(() => debouncedSig.value);
    if (!debouncedSig.value) return;
    try {
      const $ = cheerio.load(editorValue.value);
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
      const token = await counter.submit({ textNodes });
      tokenCount.value = token.value.totalTokens;
    } catch (e) {
      toast(JSON.stringify(e, null, 2));
    }
  });

  return (
    <>
      <div class="container mt-5">
        <div class="flex flex-col gap-5">
          <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Translate your html content
          </h1>
          <p class="text-red-500">
            {action.value?.fail && action.value.message}
          </p>
          <div class="flex flex-row items-center gap-5">
            <QLang
              options={languages}
              placeholder="Select a language"
              label="Languages"
              onChange$={(lang: string) => {
                selectLang.value = lang;
              }}
            />
            <div>
              <p>Token count: {tokenCount}</p>
              <p>
                Estimate cost: RM{(tokenCount.value / 1000) * 0.0015 * 4.15 * 2}
              </p>
            </div>
          </div>
          <QMonacoEditor
            name="htmlString"
            defaultValue={editorValue.value}
            onValueChange$={(e) => {
              editorValue.value = e;
            }}
          />
          <QButton
            onClick$={() => {
              if (!selectLang.value) {
                toast("No language selected");
              }
              // toast('Maintainance mode enabled, please come back later')
              action.submit({
                htmlString: editorValue.value,
                lang: selectLang.value,
              });
            }}
            disabled={action.isRunning}
          >
            Submit
          </QButton>
        </div>

        <div class="max-h-32">
          {/* eslint-disable-next-line */}
          <QScrollArea className="h-auto mt-2 w-full rounded-md bg-slate-950 p-4">
            <code class="text-white whitespace-normal h-auto overflow-scroll">
              {removeHtmlHeadBodyTags(action.value?.translatedHtml)}
            </code>
          </QScrollArea>
        </div>
      </div>
    </>
  );
});

const removeHtmlHeadBodyTags = (htmlString: string | undefined): string => {
  if (!htmlString) return "";
  const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }
  return htmlString;
};

export const head: DocumentHead = {
  title: "HTML Tag Translator",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
