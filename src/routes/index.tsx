import { component$, useSignal } from "@builder.io/qwik";
import MonacoEditor from '~/integrations/react/monaco'
import LangSelect, { languages } from '~/integrations/react/LanguageSelect'
import { routeAction$, type DocumentHead } from "@builder.io/qwik-city";
import { qwikify$ } from '@builder.io/qwik-react'

import { Button } from "~/integrations/shadcn/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { translate } from "~/api/translate";

const QMonacoEditor = qwikify$(MonacoEditor, { eagerness: 'load'})
const QButton = qwikify$(Button, { eagerness: 'hover'})
const QLang = qwikify$(LangSelect, { eagerness: 'hover'})
const QScrollArea = qwikify$(ScrollArea, { eagerness: 'hover'})

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
          {action.value?.fail && action.value.message}
          <QLang
            options={languages}
            placeholder="Select a language"
            label="Languages"
            onChange$={(lang: string) => {selectLang.value = lang}}
          />
          <QMonacoEditor name="htmlString" defaultValue={editorValue.value} onValueChange$={(e)=> {editorValue.value = e}}/>
          <QButton onClick$={() => {
            action.submit({
              htmlString: editorValue.value,
              lang: selectLang.value,
            })
          }}>Submit</QButton>
        </div>

        <div>
          {/* eslint-disable-next-line */}
          <QScrollArea className='h-64 mt-2 w-full rounded-md bg-slate-950 p-4'>
            <pre class='h-auto'>
              <code class='text-white whitespace-normal'>
                {removeHtmlHeadBodyTags(action.value?.translatedHtml)}
              </code>
            </pre>
          </QScrollArea>
        </div>
      </div>
    </>
  );
});

const removeHtmlHeadBodyTags = (htmlString: string | undefined): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString ?? '', "text/html");
  return doc.body.innerHTML;
}

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
