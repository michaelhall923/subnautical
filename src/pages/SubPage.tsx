import "./Root.css";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { NoteCreator } from "../element/NoteCreator";
import Timeline from "../element/Timeline";
import { useState } from "react";
import { RootState } from "../state/Store";
import { HexKey } from "../nostr";

const RootTab = {
  Posts: 0,
  PostsAndReplies: 1,
  Global: 2,
};

export default function SubPage() {
  const params = useParams();
  const [loggedOut, pubKey, follows] = useSelector<
    RootState,
    [boolean | undefined, HexKey | undefined, HexKey[]]
  >((s) => [s.login.loggedOut, s.login.publicKey, s.login.follows]);
  const [tab, setTab] = useState(RootTab.Posts);

  function followHints() {
    if (follows?.length === 0 && pubKey && tab !== RootTab.Global) {
      return (
        <>
          Hmm nothing here.. Checkout <Link to={"/new"}>New users page</Link> to
          follow some recommended nostrich's!
        </>
      );
    }
  }

  return (
    <>
      {pubKey ? (
        <>
          <NoteCreator show={true} autoFocus={false} sub={params.sub} />
          <div className="tabs root-tabs">
            <div
              className={`root-tab f-1 ${
                tab === RootTab.Posts ? "active" : ""
              }`}
              onClick={() => setTab(RootTab.Posts)}
            >
              Posts
            </div>
            <div
              className={`root-tab f-1 ${
                tab === RootTab.PostsAndReplies ? "active" : ""
              }`}
              onClick={() => setTab(RootTab.PostsAndReplies)}
            >
              Posts &amp; Replies
            </div>
            <div
              className={`root-tab f-1 ${
                tab === RootTab.Global ? "active" : ""
              }`}
              onClick={() => setTab(RootTab.Global)}
            >
              Global
            </div>
          </div>
        </>
      ) : null}
      {followHints()}
      <Timeline
        key={tab}
        pubkeys={follows}
        global={loggedOut || tab === RootTab.Global}
        postsOnly={tab === RootTab.Posts}
        method={"TIME_RANGE"}
      />
    </>
  );
}
