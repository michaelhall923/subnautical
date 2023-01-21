import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";

import "./NoteCreator.css";

import useEventPublisher from "../feed/EventPublisher";
import { openFile } from "../Util";
import VoidUpload from "../feed/VoidUpload";
import { FileExtensionRegex } from "../Const";
import Textarea from "../element/Textarea";
import Event, { default as NEvent } from "../nostr/Event";

export interface NoteCreatorProps {
  replyTo?: NEvent;
  onSend?: Function;
  show: boolean;
  autoFocus: boolean;
  sub?: string;
}

export function NoteCreator(props: NoteCreatorProps) {
  const publisher = useEventPublisher();
  const [title, setTitle] = useState<string>();
  const [sub, setSub] = useState<string>(props.sub ? "/s/" + props.sub : "");
  const [note, setNote] = useState<string>();
  const [error, setError] = useState<string>();
  const [titleActive, setTitleActive] = useState<boolean>(false);
  const [subActive, setSubActive] = useState<boolean>(false);
  const [noteActive, setNoteActive] = useState<boolean>(false);

  async function sendNote() {
    if (note) {
      let ev = props.replyTo
        ? await publisher.reply(props.replyTo, note)
        : await publisher.note(note);
      console.debug("Sending note: ", ev);
      publisher.broadcast(ev);
      setNote("");
      if (typeof props.onSend === "function") {
        props.onSend();
      }
      setNoteActive(false);
    }
  }

  async function attachFile() {
    try {
      let file = await openFile();
      if (file) {
        let rx = await VoidUpload(file, file.name);
        if (rx?.ok && rx?.file) {
          let ext = file.name.match(FileExtensionRegex);

          // extension tricks note parser to embed the content
          let url =
            rx.file.meta?.url ??
            `https://void.cat/d/${rx.file.id}${ext ? `.${ext[1]}` : ""}`;

          setNote((n) => `${n}\n${url}`);
        } else if (rx?.errorMessage) {
          setError(rx.errorMessage);
        }
      }
    } catch (error: any) {
      setError(error?.message);
    }
  }

  function onTitleChange(ev: any) {
    const { value } = ev.target;
    setTitle(value);
    if (value) {
      setTitleActive(true);
    } else {
      setTitleActive(false);
    }
  }

  function onSubChange(ev: any) {
    var { value } = ev.target;
    if (value.length < 3) {
      if (value.includes("/")) {
        value = "/s/";
      } else {
        let sub = value.toLowerCase();
        sub = sub.replace(/\W/g, "");
        value = "/s/" + sub;
      }
    } else if (value.startsWith("/s/")) {
      let sub = value.substring(3).toLowerCase();
      sub = sub.replace(/\W/g, "");
      value = "/s/" + sub;
    } else {
      let sub = value.toLowerCase();
      sub = sub.replace(/\W/g, "");
      value = "/s/" + sub;
    }
    setSub(value);
    if (value) {
      setSubActive(true);
    } else {
      setSubActive(false);
    }
  }

  function onNoteChange(ev: any) {
    const { value } = ev.target;
    setNote(value);
    if (value) {
      setNoteActive(true);
    } else {
      setNoteActive(false);
    }
  }

  function onSubmit(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation();
    sendNote().catch(console.warn);
  }

  if (!props.show) return null;
  return (
    <>
      <div className={`flex note-creator ${props.replyTo ? "note-reply" : ""}`}>
        <div className="flex f-col mr10 f-grow">
          <div className="flex w-max">
            <div className="f-grow w-max mr5">
              <Textarea
                autoFocus={props.autoFocus}
                className={`textarea ${titleActive ? "textarea--focused" : ""}`}
                onChange={onTitleChange}
                value={title}
                onFocus={() => setTitleActive(true)}
                placeholder="title"
              />
            </div>
            <div
              style={{
                flexBasis: "50%",
              }}
            >
              <Textarea
                autoFocus={props.autoFocus}
                className={`textarea ${subActive ? "textarea--focused" : ""}`}
                onChange={onSubChange}
                value={sub}
                onFocus={() => setSubActive(true)}
                placeholder="sub"
              />
            </div>
          </div>
          <Textarea
            // autoFocus={props.autoFocus}
            className={`textarea ${noteActive ? "textarea--focused" : ""} note`}
            onChange={onNoteChange}
            value={note}
            onFocus={() => setNoteActive(true)}
          />
          {noteActive && note && (
            <div className="actions flex f-row">
              <div className="attachment flex f-row">
                {(error?.length ?? 0) > 0 ? (
                  <b className="error">{error}</b>
                ) : null}
                <FontAwesomeIcon
                  icon={faPaperclip}
                  size="xl"
                  onClick={(e) => attachFile()}
                />
              </div>
              <button type="button" className="btn" onClick={onSubmit}>
                {props.replyTo ? "Reply" : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
