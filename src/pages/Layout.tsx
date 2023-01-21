import "./Layout.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { faBell, faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { System } from "../nostr/System";
import ProfileImage from "../element/ProfileImage";
import { init } from "../state/Login";
import useLoginFeed from "../feed/LoginFeed";
import { RootState } from "../state/Store";
import { HexKey, RawEvent, TaggedRawEvent } from "../nostr";
import { RelaySettings } from "../nostr/Connection";
import { totalUnread } from "./MessagesPage";
import Textarea from "../element/Textarea";

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isInit = useSelector<RootState, boolean | undefined>(
    (s) => s.login.loggedOut
  );
  const key = useSelector<RootState, HexKey | undefined>(
    (s) => s.login.publicKey
  );
  const relays = useSelector<RootState, Record<string, RelaySettings>>(
    (s) => s.login.relays
  );
  const notifications = useSelector<RootState, TaggedRawEvent[]>(
    (s) => s.login.notifications
  );
  const readNotifications = useSelector<RootState, number>(
    (s) => s.login.readNotifications
  );
  const dms = useSelector<RootState, RawEvent[]>((s) => s.login.dms);
  useLoginFeed();
  const [sub, setSub] = useState<string>();
  const [subActive, setSubActive] = useState<boolean>(false);

  useEffect(() => {
    if (relays) {
      for (let [k, v] of Object.entries(relays)) {
        System.ConnectToRelay(k, v);
      }
      for (let [k, v] of System.Sockets) {
        if (!relays[k]) {
          System.DisconnectRelay(k);
        }
      }
    }
  }, [relays]);

  useEffect(() => {
    dispatch(init());
  }, []);

  async function goToNotifications(e: any) {
    e.stopPropagation();
    // request permissions to send notifications
    if ("Notification" in window && Notification.permission !== "granted") {
      try {
        let res = await Notification.requestPermission();
        console.debug(res);
      } catch (e) {
        console.error(e);
      }
    }
    navigate("/notifications");
  }

  function accountHeader() {
    const unreadNotifications = notifications?.filter(
      (a) => a.created_at * 1000 > readNotifications
    ).length;
    const unreadDms = key ? totalUnread(dms, key) : 0;
    return (
      <>
        <div
          className={`btn btn-rnd${unreadDms === 0 ? " mr10" : ""}`}
          onClick={(e) => navigate("/messages")}
        >
          <FontAwesomeIcon icon={faMessage} size="xl" />
        </div>
        {unreadDms > 0 && (
          <span className="unread-count">
            {unreadDms > 100 ? ">99" : unreadDms}
          </span>
        )}
        <div
          className={`btn btn-rnd${unreadNotifications === 0 ? " mr10" : ""}`}
          onClick={(e) => goToNotifications(e)}
        >
          <FontAwesomeIcon icon={faBell} size="xl" />
        </div>
        {unreadNotifications > 0 && (
          <span className="unread-count">
            {unreadNotifications > 100 ? ">99" : unreadNotifications}
          </span>
        )}
        <ProfileImage pubkey={key || ""} showUsername={false} />
      </>
    );
  }

  if (typeof isInit !== "boolean") {
    return null;
  }

  function onSubChange(ev: any) {
    const { value } = ev.target;
    setSub(value);
    if (value) {
      setSubActive(true);
    } else {
      setSubActive(false);
    }
  }

  const handleKeyPress = (ev: any) => {
    if (ev.key === "Enter") {
      window.location.href = `/s/${sub}`;
    }
  };

  return (
    <div className="page">
      <div className="header f-space-between">
        <div className="logo" onClick={() => navigate("/")}>
          <img className="logo-image" src="/img/subnautical3.png" />
          subnautical
        </div>
        <div>
          <div>
            <input
              type="text"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="goto sub..."
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        <div className="account-header">
          {key ? (
            accountHeader()
          ) : (
            <div className="btn" onClick={() => navigate("/login")}>
              Login
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
