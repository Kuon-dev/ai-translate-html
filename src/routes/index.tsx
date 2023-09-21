import { component$, useSignal } from "@builder.io/qwik";
import MonacoEditor from '~/integrations/react/monaco'
import LangSelect, { languages } from '~/integrations/react/LanguageSelect'
import { routeAction$, type DocumentHead } from "@builder.io/qwik-city";
import { qwikify$ } from '@builder.io/qwik-react'

import { Button } from "~/integrations/shadcn/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { translate } from "~/api/translate";
import { toast } from "sonner";

const QMonacoEditor = qwikify$(MonacoEditor, { eagerness: 'load'})
const QButton = qwikify$(Button, { eagerness: 'hover'})
const QLang = qwikify$(LangSelect, { eagerness: 'hover'})
const QScrollArea = qwikify$(ScrollArea, { eagerness: 'load'})

export const useTranslateHtml = routeAction$(async (data) => {
  const lang = data.lang as string;
  const htmlString = data.htmlString as string;
  if (!lang || !htmlString) return {
    fail: true,
    message: 'empty language or html content'
  };
  // const htmlTags = data.htmlTags.split(',');
  const htmlTags = ['h1', 'p', 'span', 'a', 'div', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong']

  const translatedHtml = await translate(lang, htmlString, htmlTags)
  console.log(translatedHtml)

  return {
    success: true,
    translatedHtml,
  };
});

export default component$(() => {
  const editorValue = useSignal('')
  const selectLang = useSignal<string>('')
  const action = useTranslateHtml();

  return (
    <>
      <div class="container mt-5">
        <div class="flex flex-col gap-5">
          <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Translate your html content</h1>
          <p class="text-red-500">
            {action.value?.fail && action.value.message}
          </p>
          <QLang
            options={languages}
            placeholder="Select a language"
            label="Languages"
            onChange$={(lang: string) => {selectLang.value = lang}}
          />
          <QMonacoEditor name="htmlString" defaultValue={editorValue.value} onValueChange$={(e)=> {editorValue.value = e}}/>
          <QButton onClick$={() => {
            if (!selectLang.value) {
              toast('Error')
            }

            action.submit({
              htmlString: editorValue.value,
              lang: selectLang.value,
            })
          }}
          disabled={action.isRunning}
          >Submit</QButton>
        </div>

        <div class="max-h-32">
          {/* eslint-disable-next-line */}
          <QScrollArea className='h-auto mt-2 w-full rounded-md bg-slate-950 p-4'>
              <code class='text-white whitespace-normal h-auto overflow-scroll'>
                {removeHtmlHeadBodyTags(action.value?.translatedHtml)}
              </code>
          </QScrollArea>
        </div>
      </div>
    </>
  );
});

const removeHtmlHeadBodyTags = (htmlString: string | undefined): string => {
  if (!htmlString) return ''
  const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }
  return htmlString;
}

export const head: DocumentHead = {
  title: "HTML Tag Translator",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
