import React, { useState, useEffect, useCallback } from "react";

const formattedTime = (time) => {
  const secs = Math.floor(time / 1000) % 60;
  const mins = Math.floor(time / 60000) % 60;
  const hours = Math.floor(time / 3600000);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
};

function Timer({ endTime, timeRef, status, now }) {
  const [time, setTime] = useState(0);

  const remainingTime = useCallback(() => {
    return Math.max(0, endTime - now());
  }, [endTime, now]);

  useEffect(() => {
    timeRef(() => time);
  }, [timeRef, time]);

  const onInterval = useCallback(() => {
    if (status === "running") {
      setTime(remainingTime());
    }
  }, [status, remainingTime]);

  useEffect(() => {
    const timer = setInterval(onInterval, 100);
    return () => clearInterval(timer);
  }, [onInterval]);

  return <p>{formattedTime(remainingTime())}</p>;
}

export default Timer;
