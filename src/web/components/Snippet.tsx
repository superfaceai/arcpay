import { FC } from "hono/jsx";
import { IconCheck, IconCopy, IconEye, IconEyeOff } from "./icons";

interface SnippetProps {
  content: string;
  obfuscatedContent?: string;
}

export const Snippet: FC<SnippetProps> = (props: SnippetProps) => {
  const snippetId = Math.random().toString(36).slice(2);
  const isMultiline = props.content.includes("\n");

  return (
    <>
      <div
        className={["snippet", isMultiline && "multiline"]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="content public">
          {props.obfuscatedContent || props.content}
        </div>
        {props.obfuscatedContent && (
          <div className="content obfuscated">{props.content}</div>
        )}

        <div className="actions">
          {props.obfuscatedContent && (
            <button class="ghost show-obfuscated" tabIndex={0}>
              <input type="checkbox" checked={false} />
              <span class="icon icon-base">
                <IconEye />
              </span>
              <span class="icon icon-engaged">
                <IconEyeOff />
              </span>
            </button>
          )}

          <button class="ghost" tabIndex={0} id={snippetId}>
            <span class="icon icon-base">
              <IconCopy />
            </span>
            <span class="icon icon-engaged">
              <IconCheck />
            </span>
          </button>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('${snippetId}').addEventListener('click', () => {
  navigator.clipboard.writeText(\`${props.content}\`);
});
      `,
        }}
      />
    </>
  );
};
