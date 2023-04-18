import { PropaneSharp } from "@mui/icons-material";
import React, { useMemo, useCallback } from "react";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { RichElement } from "./RichElement";
import { RichLeaf } from "./RichLeaf";
import { withMentions } from "./Mention";
import { withEmojis } from "./Emoji";

import "./RichTextViewer.css";
const RichTextViewer = (props) => {
  const editor = useMemo(
    () => withEmojis(withMentions(withReact(createEditor()))),
    []
  );
  const renderElement = useCallback((props) => <RichElement {...props} />, []);
  const renderLeaf = useCallback((props) => <RichLeaf {...props} />, []);
  return props.message ? (
    <Slate editor={editor} value={JSON.parse(props.message)}>
      <Editable
        readOnly
        placeholder=""
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Slate>
  ) : null;
};

export default RichTextViewer;
