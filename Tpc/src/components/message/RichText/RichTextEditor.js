import React, {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cx, css } from "@emotion/css";
import isHotkey from "is-hotkey";
import { Editable, withReact, useSlate, Slate, ReactEditor } from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Element as SlateElement,
  Point,
  Node,
  Range,
} from "slate";
import { withHistory } from "slate-history";
import "./RichTextEditor.css";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import CodeIcon from "@mui/icons-material/Code";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import { RichElement } from "./RichElement";
import { RichLeaf } from "./RichLeaf";
import { insertMention } from "./Mention";
import { CometChat } from "@cometchat-pro/chat";
import ReactDOM from "react-dom";
import { withMentions } from "./Mention";
import { withEmojis } from "./Emoji";

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

export const Portal = ({ children }) => {
  return typeof document === "object"
    ? ReactDOM.createPortal(children, document.body)
    : null;
};

const Button = React.forwardRef(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? "white"
              : "#aaa"
            : active
            ? "black"
            : "#ccc"};
        `
      )}
    />
  )
);

const Menu = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    data-test-id="menu"
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }
        & > * + * {
          margin-left: 15px;
        }
      `
    )}
  />
));

const Toolbar = React.forwardRef(({ className, ...props }, ref) => (
  <Menu
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        width: 97.5%;
      `
    )}
  />
));

/**
 * resetNodes resets the value of the editor.
 * It should be noted that passing the `at` parameter may cause a "Cannot resolve a DOM point from Slate point" error.
 */
const resetNodes = (editor, options) => {
  const children = [...editor.children];

  children.forEach((node) =>
    editor.apply({ type: "remove_node", path: [0], node })
  );

  if (options.nodes) {
    const nodes = Node.isNode(options.nodes) ? [options.nodes] : options.nodes;

    nodes.forEach((node, i) =>
      editor.apply({ type: "insert_node", path: [i], node: node })
    );
  }

  const point =
    options.at && Point.isPoint(options.at)
      ? options.at
      : Editor.end(editor, []);

  if (point) {
    Transforms.select(editor, point);
  }
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const RichTextEditor = forwardRef((props, parentRef) => {
  const initialInput = [{ type: "paragraph", children: [{ text: "" }] }];
  const renderElement = useCallback((props) => <RichElement {...props} />, []);
  const renderLeaf = useCallback((props) => <RichLeaf {...props} />, []);
  const [search, setSearch] = React.useState("");
  const [target, setTarget] = React.useState();
  const [index, setIndex] = React.useState(0);
  const [userList, setUserList] = React.useState([]);
  // const editor = props.editor;
  const editor = useMemo(
    () => withEmojis(withMentions(withReact(withHistory(createEditor())))),
    []
  );

  const ref = useRef();
  useEffect(() => {
    //get user list based on search term and set it to userList
    let searchIn = ["name", "uid"];
    let usersRequest = new CometChat.UsersRequestBuilder()
      .setLimit(10)
      .setSearchKeyword(search)
      // .searchIn(searchIn)  buggy, returns empty list
      .build();
    usersRequest.fetchNext().then((userList) => {
      setUserList(userList);
      console.log("update userList", userList);
    });

    if (target && userList.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      el.style.top = `${rect.top + window.pageYOffset + 24}px`;
      el.style.left = `${rect.left + window.pageXOffset}px`;
    }
  }, [userList.length, editor, index, target, search]);

  const onKeyDown = useCallback(
    (event) => {
      if (target && userList.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= userList.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? userList.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, userList[index].name);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
          default:
            break;
        }
      }
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }
    },
    [editor, index, target, userList]
  );
  const clearMessage = () => {
    editor.children = initialInput;
    resetNodes(editor, { nodes: initialInput });
    //re-render the editor
    editor.onChange();
  };

  const insertEmoji = (emojiUrl) => {
    editor.insertData(emojiUrl);
  };

  useImperativeHandle(parentRef, () => ({
    clearMessage,
    insertEmoji,
  }));

  const onChange = (value) => {
    props.onMessageChange(JSON.stringify(value));
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = Editor.before(editor, start, { unit: "word" });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        console.log("beforeRange", beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);
  };

  return (
    <Slate
      editor={editor}
      value={initialInput}
      onChange={(value) => {
        onChange(value);
      }}
    >
      <Toolbar>
        <MarkButton format="bold" Icon={FormatBoldIcon} />
        <MarkButton format="italic" Icon={FormatItalicIcon} />
        <MarkButton format="underline" Icon={FormatUnderlinedIcon} />
        <MarkButton format="code" Icon={CodeIcon} />
        <BlockButton format="block-quote" Icon={FormatQuoteIcon} />
        <BlockButton format="numbered-list" Icon={FormatListNumberedIcon} />
        <BlockButton format="bulleted-list" Icon={FormatListBulletedIcon} />
        <BlockButton format="left" Icon={FormatAlignLeftIcon} />
        <BlockButton format="center" Icon={FormatAlignCenterIcon} />
        <BlockButton format="right" Icon={FormatAlignRightIcon} />
        <BlockButton format="justify" Icon={FormatAlignJustifyIcon} />
      </Toolbar>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        className="rich__text__editor"
        placeholder={props.placeholder}
        spellCheck
        autoFocus
        onKeyDown={onKeyDown}
      />
      {target && userList.length > 0 && (
        <Portal>
          <div
            ref={ref}
            style={{
              top: "-9999px",
              left: "-9999px",
              position: "absolute",
              zIndex: 1,
              padding: "3px",
              background: "white",
              borderRadius: "4px",
              boxShadow: "0 1px 5px rgba(0,0,0,.2)",
            }}
            data-cy="mentions-portal"
          >
            {userList.map((user, i) => (
              <div
                key={user.uid}
                style={{
                  padding: "1px 3px",
                  borderRadius: "3px",
                  background: i === index ? "#B4D5FF" : "transparent",
                }}
              >
                {user.name}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </Slate>
  );
});

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });
  let newProperties;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
  }
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const BlockButton = ({ format, Icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon />
    </Button>
  );
};

const MarkButton = ({ format, Icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon />
    </Button>
  );
};

export default RichTextEditor;
