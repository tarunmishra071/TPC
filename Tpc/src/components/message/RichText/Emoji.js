import React from "react";
import { useSelected, useFocused } from "slate-react";
import { Transforms } from "slate";
import imageExtensions from "image-extensions";
import isUrl from "is-url";
import { css } from "@emotion/css";

export const withEmojis = (editor) => {
  const { insertData, isVoid, isInline } = editor;

  editor.isVoid = (element) => {
    return element.type === "emoji" ? true : isVoid(element);
  };

  editor.isInline = (element) => {
    return "emoji" === element.type ? true : isInline(element);
  };

  editor.insertData = (data) => {
    if (isImageUrl(data)) {
      insertEmoji(editor, data);
    } else {
      insertData(data);
    }
  };

  return editor;
};

const insertEmoji = (editor, url) => {
  const text = { text: "" };
  const emoji = { type: "emoji", url, children: [text] };
  Transforms.insertNodes(editor, emoji);
};

export const Emoji = ({ attributes, children, element, editor }) => {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <div
      {...attributes}
      className={css`
        display: inline-block;
      `}
    >
      {children}
      <div
        contentEditable={false}
        className={css`
          display: inline-block;
        `}
      >
        <img
          alt="emoji"
          src={element.url}
          className={css`
            display: inline-block;
            width: 24px;
            height: 24px;
            box-shadow: ${selected && focused ? "0 0 0 3px #B4D5FF" : "none"};
          `}
        />
      </div>
    </div>
  );
};

const isImageUrl = (url) => {
  if (!url) return false;
  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split(".").pop();
  return imageExtensions.includes(ext);
};
