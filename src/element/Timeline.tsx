import { useMemo } from "react";
import useTimelineFeed from "../feed/TimelineFeed";
import { HexKey, TaggedRawEvent, u256 } from "../nostr";
import EventKind from "../nostr/EventKind";
import LoadMore from "./LoadMore";
import Note from "./Note";
import NoteReaction from "./NoteReaction";

export interface TimelineProps {
    global: boolean,
    postsOnly: boolean,
    pubkeys: HexKey[],
    method: "TIME_RANGE" | "LIMIT_UNTIL"
}

/**
 * A list of notes by pubkeys
 */
export default function Timeline({ global, pubkeys, postsOnly = false, method }: TimelineProps) {
    const { main, others, loadMore } = useTimelineFeed(pubkeys, {
        global,
        method
    });

    const mainFeed = useMemo(() => {
        return main?.sort((a, b) => b.created_at - a.created_at)?.filter(a => postsOnly ? !a.tags.some(b => b[0] === "e") : true);
    }, [main]);

    function eventElement(e: TaggedRawEvent) {
        switch (e.kind) {
            case EventKind.TextNote: {
                return <Note key={e.id} data={e} related={others} />
            }
            case EventKind.Reaction:
            case EventKind.Repost: {
                return <NoteReaction data={e} key={e.id} />
            }
        }
    }

    return (
        <>
            {mainFeed.map(eventElement)}
            {mainFeed.length > 0 ? <LoadMore onLoadMore={loadMore} /> : null}
        </>
    );
}