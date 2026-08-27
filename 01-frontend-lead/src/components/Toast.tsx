"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(timeout = 4000) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), timeout);
    },
    [timeout]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { message, show };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
