import React from "react";
import "./App.css";

import Bugout from "bugout/docs/bugout.min.js";
import { store, view } from "@risingstack/react-easy-state";

const DEFAULT_START_TIME = 10 * 60 * 1000;

let b = window.location.hash
  ? new Bugout(window.location.hash.substr(1))
  : Bugout();

if (!window.location.hash) window.location.hash = b.address();

const timer = store({
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
    timer.sendState();
  },
  pause: () => {
    timer.status = "paused";
    timer.sendState();
  },
  reset: () => {
    timer.status = "idle";
    timer.endTime = Date.now() + timer.startAmount;
    timer.time = timer.startAmount;
    timer.sendState();
  },
  addTime: (amount) => {
    timer.endTime = timer.endTime + amount;
    timer.time = timer.time + amount;
    timer.sendState();
  },
  setState: (state) => {
    timer.ready = false;
    timer.time = state.time;
    timer.startAmount = state.startAmount;
    timer.endTime = state.endTime;
    timer.status = state.status;
  },
  sendState: (ad) => {
    const state = {
      time: timer.time,
      startAmount: timer.startAmount,
      endTime: timer.endTime,
      status: timer.status,
    };
    if (ad) {
      console.log("sending state to", ad, state);
      b.send(ad, { state, justJoined: !timer.ready });
    } else {
      console.log("sending state to all", state);
      b.send({ state, justJoined: !timer.ready });
    }
  },
});

b.on("connections", (count) => {
  timer.connections = count;
});

b.on("message", (address, { state, justJoined }) => {
  if (!justJoined && (address !== b.address() || !timer.ready)) {
    console.log("got message from", address, state, justJoined);
    timer.setState(state);
    timer.ready = true;
  }
});

b.on("seen", (ad) => {
  console.log("seen:", ad);
  timer.sendState(ad);
});

setInterval(() => {
  if (timer.status === "running") {
    timer.tick();
  }
}, 100);

setTimeout(() => {
  //if nobody connected in some time then call it ready
  if (!timer.connections) {
    timer.ready = true;
  }
}, 5000);

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
    <header className="App-header">
      {!timer.ready ? (
        <p>Syncing</p>
      ) : (
        <main>
          <h1>{formattedTime(timer.time)}</h1>
          <button
            onClick={() => {
              if (timer.status === "running") {
                timer.pause();
              } else {
                timer.play();
              }
            }}
          >
            {timer.status === "running"
              ? "Pause"
              : timer.status === "paused"
              ? "Resume"
              : "Start"}
          </button>
          <button
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
          </button>
          <p>Connections: {timer.connections}</p>
        </main>
      )}
    </header>
  </div>
));
