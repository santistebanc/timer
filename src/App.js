import React from "react";
import "./App.css";

import Bugout from "bugout/docs/bugout.min.js";
import { store, view } from "@risingstack/react-easy-state";
import { hri } from "human-readable-ids";

const DEFAULT_START_TIME = 10 * 60 * 1000;

let b;

const timer = store({
  joinDate: Date.now(),
  connections: 0,
  ready: false,
  time: DEFAULT_START_TIME,
  startAmount: DEFAULT_START_TIME,
  endTime: Date.now() + DEFAULT_START_TIME,
  status: "idle",
  tick: () => {
    timer.time = Math.max(0, timer.endTime - Date.now());
  },
  play: () => {
    timer.status = "running";
    timer.endTime = Date.now() + timer.time;
    timer.shareState();
  },
  pause: () => {
    timer.status = "paused";
    timer.shareState();
  },
  reset: () => {
    timer.status = "idle";
    timer.endTime = Date.now() + timer.startAmount;
    timer.time = timer.startAmount;
    timer.shareState();
  },
  addTime: (amount) => {
    timer.endTime = timer.endTime + amount;
    timer.time = timer.time + amount;
    timer.shareState();
  },
  setState: (state) => {
    timer.ready = false;
    timer.time = state.time;
    timer.startAmount = state.startAmount;
    timer.endTime = state.endTime;
    timer.status = state.status;
  },
  requestToJoin: (ad) => {
    b.send(ad, { type: "ask", joinDate: timer.joinDate });
  },
  acceptRequest: (ad) => {
    const state = {
      time: timer.time,
      startAmount: timer.startAmount,
      endTime: timer.endTime,
      status: timer.status,
    };
    b.send(ad, { type: "accept", state });
  },
  shareState: () => {
    if (timer.ready) {
      const state = {
        time: timer.time,
        startAmount: timer.startAmount,
        endTime: timer.endTime,
        status: timer.status,
      };
      console.log("sharing new state to all");
      b.send({ type: "share", state });
    }
  },
});

if (window.location.hash) {
  b = new Bugout("Sm34sQyBLqcM" + window.location.hash.substr(1));
} else {
  const id = hri.random();
  window.location.hash = id;
  b = Bugout("Sm34sQyBLqcM" + id);
  timer.ready = true;
}

b.on("connections", (count) => {
  timer.connections = count;
});

b.on("message", (address, { type, state, joinDate }) => {
  if (address !== b.address()) {
    if (type === "ask") {
      if (timer.ready) {
        console.log(address, "asks to join, accepting");
        timer.acceptRequest(address);
      } else {
        if (joinDate > timer.joinDate) {
          console.log(
            address,
            "asks to join, conflict, but they were here before, so ignoring"
          );
          timer.ready = true;
        } else {
          console.log(
            address,
            "asks to join, conflict, but we were here before, so accepting"
          );
          timer.acceptRequest(address);
          timer.ready = true;
        }
      }
    } else if (type === "accept" && !timer.ready) {
      console.log(address, "accepted request to join");
      timer.setState(state);
      timer.ready = true;
    } else if (type === "share" && timer.ready) {
      console.log("received new state from", address, "syncing");
      timer.setState(state);
      timer.ready = true;
    }
  }
});

b.on("seen", (ad) => {
  console.log("seen:", ad);
  if (!timer.ready) {
    timer.requestToJoin(ad);
  }
});

setInterval(() => {
  if (timer.status === "running") {
    timer.tick();
  }
}, 100);

const formattedTime = (time) => {
  const secs = Math.floor(time / 1000) % 60;
  const mins = Math.floor(time / 60000) % 60;
  const hours = Math.floor(time / 3600000);
  const watch = [String(secs).padStart(2, "0")];
  if (mins) watch.unshift(String(mins).padStart(2, "0"));
  if (hours) watch.unshift(String(hours).padStart(2, "0"));
  return watch.join(":");
};

export default view(() => (
  <div className="App">
    <div className="container">
      <main
        className={timer.status === "running" ? "paused" : ""}
        onClick={() => {
          if (timer.status === "running") {
            timer.pause();
          } else {
            timer.play();
          }
        }}
      >
        <span className="time">{formattedTime(timer.time)}</span>
        <span className="status_sign" />
        {/* <button
          onClick={() => {
            timer.reset();
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            timer.addTime(10 * 1000);
          }}
        >
          +10 seconds
        </button>
        <button
          onClick={() => {
            timer.addTime(60 * 1000);
          }}
        >
          +1 minute
        </button>
        <button
          onClick={() => {
            timer.addTime(5 * 60 * 1000);
          }}
        >
          +5 minutes
        </button> */}
      </main>
      <p>Connections: {timer.connections}</p>
    </div>
  </div>
));
