// src/utils/useMountLog.js
import { useEffect } from "react";

export default function useMountLog(name){
    useEffect(() => {
      if (!import.meta.env.DEV) return;
      const t = Math.round(performance.now());
      console.log(`🟢 MOUNT ${name} @${t}ms`);
    }, [name]);
  }
  

