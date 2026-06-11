import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../utils/format";
import { accessApi } from "../../api/client";

const PAGE_SIZE = 20;

export function DoorLogSearch() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [result, setResult] = useState("");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  const tablePanelRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, result]);

  useEffect(() => {
    if (tablePanelRef.current) {
      tablePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    accessApi
      .doorLogs({ keyword: debouncedKeyword, result, page })
      .then((data) => {
        if (!cancelled) {
          const results = Array.isArray(data) ? data : data.results || [];
          const count = typeof data.count === "number" ? data.count : results.length;
          setLogs(results);
          setTotalCount(count);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "加载失败");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword, result, page]);

  return (
    <section className="view-stack">
      <header className="page-header">
        <div>
          <h1>开门日志查询</h1>
          <p>按人员、设备、编码、失败原因和开门结果快速筛选门禁流水。</p>
        </div>
      </header>

      <div className="filter-bar">
        <label>
          <Search size={16} />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索人员、设备、编码或原因" />
        </label>
        <select value={result} onChange={(event) => setResult(event.target.value)}>
          <option value="">全部结果</option>
          <option value="success">成功</option>
          <option value="denied">拒绝</option>
        </select>
      </div>

      <div className="table-panel" ref={tablePanelRef}>
        <div className="table-toolbar">
          {loading ? (
            <span className="muted">加载中…</span>
          ) : error ? (
            <span className="error-text">{error}</span>
          ) : (
            <span className="muted">共 {totalCount} 条记录</span>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>人员</th>
              <th>类型</th>
              <th>设备</th>
              <th>设备编码</th>
              <th>方式</th>
              <th>结果</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.opened_at)}</td>
                <td>{log.opener_name}</td>
                <td>{log.opener_type_display}</td>
                <td>{log.device_name}</td>
                <td>{log.device_code}</td>
                <td>{log.credential_method_display}</td>
                <td><StatusBadge value={log.result} label={log.result_display} /></td>
                <td>{log.failure_reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !logs.length && <EmptyState />}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
              上一页
            </button>
            <span className="page-info">{page} / {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
