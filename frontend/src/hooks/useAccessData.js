import { useEffect, useMemo, useState } from "react";

import { accessApi } from "../api/client";

function unwrapList(payload) {
  return Array.isArray(payload) ? payload : payload.results || [];
}

export function useAccessData() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    stats: null,
    devices: [],
    visitors: [],
    alarms: [],
    logs: [],
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [stats, devices, visitors, alarms, logsRaw] = await Promise.all([
          accessApi.stats(),
          accessApi.devices(),
          accessApi.visitors(),
          accessApi.alarms(),
          accessApi.doorLogs({ page_size: 5 }),
        ]);
        const logs = unwrapList(logsRaw);
        if (mounted) {
          setState({ loading: false, error: "", stats, devices, visitors, alarms, logs });
        }
      } catch (error) {
        if (mounted) {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => state, [state]);
}
