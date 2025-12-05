import { SSEMessage } from "hono/streaming";

// See Datastar SSE reference
// https://data-star.dev/reference/sse_events
type PatchMode =
  | "outer" //
  | "inner"
  | "replace" //
  | "prepend"
  | "append"
  | "before"
  | "after"
  | "remove"; //
type PatchSelector = string;
type PatchElements = string;
type PatchUseViewTransition = boolean;

type PatchElementsInput =
  | {
      mode?: Extract<PatchMode, "outer" | "replace">;
      elements: PatchElements;
      selector?: PatchSelector;
      useViewTransition?: PatchUseViewTransition;
    }
  | {
      mode: Extract<PatchMode, "remove">;
      selector: PatchSelector;
      useViewTransition?: PatchUseViewTransition;
      // elements: never;
    }
  | {
      mode: Exclude<PatchMode, "outer" | "replace" | "remove">;
      selector: PatchSelector;
      elements: PatchElements;
      useViewTransition?: PatchUseViewTransition;
    };

export const patchElements = (input: PatchElementsInput): SSEMessage => {
  return {
    event: "datastar-patch-elements",
    data: patchElementsData(input),
  };
};

const patchElementsData = (input: PatchElementsInput): string => {
  const datastarHeaders = [
    input.mode ? `mode ${input.mode}` : "",
    input.selector ? `selector ${input.selector.trim()}` : "",
    input.useViewTransition ? `useViewTransition true` : "",
  ].filter(Boolean);

  const elementsLines =
    "elements" in input
      ? input.elements
          .split("\n")
          .filter(Boolean)
          .map((line) => `elements ${line}`)
      : [];

  return datastarHeaders.concat(elementsLines).join("\n");
};
