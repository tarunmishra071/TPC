import React, { useCallback, useMemo, forwardRef } from "react";
import { IconButton } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import AddIcon from "@mui/icons-material/Add";
import AtIcon from "@mui/icons-material/AlternateEmail";
import EmojiIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import TextIcon from "@mui/icons-material/TextFormat";
import MicNoneIcon from "@mui/icons-material/MicNone";
import "./MessageInput.css";
import EmojiPicker from "emoji-picker-react";
import RichTextEditor from "./RichText/RichTextEditor";
import { withHistory } from "slate-history";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import { withMentions } from "./RichText/Mention";
import ErrorBoundary from "../helper/ErrorBoundary";

const MessageInput = forwardRef((props, ref) => {
  const [emoji, setEmoji] = React.useState(false);
  const onToggleEmoji = () => {
    setEmoji(!emoji);
  };
  const onEmojiChange = (emojiData) => {
    console.log(emoji);
    // props.onMessageChange(props.message + emojiData.emoji);
    ref.current.insertEmoji(emojiData.getImageUrl());
  };
  return (
    <div className="user__chatInput">
      <div>
        {emoji ? (
          <div className="emoji__container">
            <EmojiPicker
              onEmojiClick={(emojiData, event) => {
                onEmojiChange(emojiData);
              }}
            />
          </div>
        ) : null}
      </div>
      <form className="user__chatInput__form">
        {/* <input
          placeholder={props.placeholder}
          value={props.message}
          onChange={(e) => props.onMessageChange(e.target.value)}
        /> */}
        <ErrorBoundary>
          <RichTextEditor
            ref={ref}
            message={props.message}
            placeholder={props.placeholder}
            onMessageChange={props.onMessageChange}
          />
        </ErrorBoundary>
        <div className="toolbar">
          <IconButton>
            <AddIcon />
          </IconButton>
          <IconButton onClick={onToggleEmoji}>
            <EmojiIcon />
          </IconButton>
          <IconButton>
            <AtIcon />
          </IconButton>
          <IconButton>
            <TextIcon />
          </IconButton>
          <IconButton>
            <MicNoneIcon />
          </IconButton>
          <IconButton
            className="submit__button"
            type="submit"
            onClick={props.onMessageSubmit}
          >
            <SendIcon />
          </IconButton>
        </div>
      </form>
    </div>
  );
});

export default MessageInput;
