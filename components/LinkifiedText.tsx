import { Fragment } from 'react';

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
// Trailing punctuation that's almost always sentence structure, not part of the URL.
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

/**
 * Renders plain text with any http(s)/www URLs turned into clickable links.
 * Used for user-authored text (broadcasts, chat, etc.) that isn't HTML/markdown.
 */
export function LinkifiedText({ text }: { text: string }) {
    const parts = text.split(URL_PATTERN);

    return (
        <>
            {parts.map((part, i) => {
                // String.split() with a single-capturing-group regex alternates
                // [text, match, text, match, ...] — odd indices are always URLs.
                const isUrl = i % 2 === 1;
                if (!isUrl) {
                    return <Fragment key={i}>{part}</Fragment>;
                }

                const trailingMatch = part.match(TRAILING_PUNCTUATION);
                const trailing = trailingMatch ? trailingMatch[0] : '';
                const url = trailing ? part.slice(0, -trailing.length) : part;
                const href = url.startsWith('www.') ? `https://${url}` : url;

                return (
                    <Fragment key={i}>
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="underline underline-offset-2 hover:opacity-80 break-all"
                        >
                            {url}
                        </a>
                        {trailing}
                    </Fragment>
                );
            })}
        </>
    );
}
