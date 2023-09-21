import OpenAI from "openai";
import { JSDOM } from 'jsdom';

export async function translate(lang: string, htmlString: string, htmlTags: string[]): Promise<string> {
    const openai = new OpenAI({
        apiKey: (import.meta as any).env.VITE_API_KEY ?? '',
        // organization: "org-35EJHLrwW0VUMmMRARvsrpCW"
    });
    const dom = new JSDOM(htmlString);
    const { window } = dom;
    const { document } = window;

    for (const tag of Array.from(document.querySelectorAll(htmlTags.join(','))) as Element[]) {
        const newChildren: ChildNode[] = [];
        
        for (const child of Array.from(tag.childNodes)) {
            if (child.nodeType === 3) {  // Node.TEXT_NODE
                const textContent = child.textContent || "";
                if (textContent.trim() === "") continue;

                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {role: "system", content: `You will be provided with a sentence in English, and your task is to translate it into ${lang}`},
                        {role: "user", content: `Translate '${textContent}' into ${lang}. Provide only the translated text. No elaboration.`}
                    ]
                });

                const translatedText = response.choices[0].message.content ?? '';
                const newChild = document.createTextNode(translatedText);
                newChildren.push(newChild);
            } else {
                newChildren.push(child);
            }
        }

        while (tag.firstChild) {
            tag.removeChild(tag.firstChild);
        }

        for (const newChild of newChildren) {
            tag.appendChild(newChild);
        }
    }

    return (dom.serialize());
}

