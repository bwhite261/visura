import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Send,
  Code2,
  Table2,
  LayoutGrid,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Clock,
  Activity,
  AlertCircle,
  FileJson,
  Zap,
  Hash,
} from "lucide-react";

/* ============================================================
   VISURA — API Response Visualizer
   Single-file React app. Tailwind utilities only.
   ============================================================ */

const EXAMPLES = [
  {
    label: "Users",
    url: "https://jsonplaceholder.typicode.com/users",
    method: "GET",
    body: "",
  },
  {
    label: "Posts",
    url: "https://jsonplaceholder.typicode.com/posts?_limit=8",
    method: "GET",
    body: "",
  },
  {
    label: "Repos",
    url: "https://api.github.com/users/anthropics/repos",
    method: "GET",
    body: "",
  },
  {
    label: "Create Post",
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "POST",
    body: JSON.stringify(
      { title: "Hello from VISURA", body: "Crafted request payload", userId: 1 },
      null,
      2,
    ),
  },
];

/* ---------- helpers ---------- */

const formatBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const statusTone = (s) => {
  if (s >= 200 && s < 300) return "success";
  if (s >= 300 && s < 400) return "warning";
  if (s >= 400) return "error";
  return "neutral";
};

const isObj = (v) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isArrOfObjects = (v) =>
  Array.isArray(v) && v.length > 0 && v.every((x) => isObj(x));

const formatCell = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

/* ============================================================
   JSON Tree Viewer
   ============================================================ */

const PrimitiveValue = ({ value }) => {
  if (value === null)
    return <span className="text-neutral-500 italic">null</span>;
  if (typeof value === "string")
    return (
      <span className="text-emerald-300/90">
        "<span className="text-emerald-300">{value}</span>"
      </span>
    );
  if (typeof value === "number")
    return <span className="text-amber-300">{String(value)}</span>;
  if (typeof value === "boolean")
    return (
      <span className="text-cyan-300 font-medium">{String(value)}</span>
    );
  return <span className="text-neutral-400">{String(value)}</span>;
};

const TreeNode = ({ k, value, depth, isLast, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen || depth < 1);
  const isObject = isObj(value);
  const isArray = Array.isArray(value);
  const isContainer = isObject || isArray;

  const childCount = isArray
    ? value.length
    : isObject
    ? Object.keys(value).length
    : 0;

  const keyLabel =
    k !== undefined ? (
      <span className="text-[#7C83FD] font-medium">
        {typeof k === "number" ? `[${k}]` : `"${k}"`}
      </span>
    ) : null;

  const bracketOpen = isArray ? "[" : "{";
  const bracketClose = isArray ? "]" : "}";

  if (!isContainer) {
    return (
      <div
        className="flex items-start gap-2 group/row hover:bg-white/[0.015] rounded px-1 -mx-1"
        style={{ paddingLeft: depth * 14 }}
      >
        <span className="w-3 shrink-0" />
        {keyLabel}
        {keyLabel && <span className="text-neutral-600">:</span>}
        <span className="break-all">
          <PrimitiveValue value={value} />
        </span>
        {!isLast && <span className="text-neutral-700">,</span>}
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-start gap-1.5 cursor-pointer group/row hover:bg-white/[0.02] rounded px-1 -mx-1 select-none"
        style={{ paddingLeft: depth * 14 }}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight
          size={12}
          className={`mt-[5px] shrink-0 text-neutral-500 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
        {keyLabel}
        {keyLabel && <span className="text-neutral-600">:</span>}
        <span className="text-neutral-400">{bracketOpen}</span>
        {!open && (
          <>
            <span className="text-neutral-600 text-xs italic">
              {isArray ? `${childCount} items` : `${childCount} keys`}
            </span>
            <span className="text-neutral-400">{bracketClose}</span>
            {!isLast && <span className="text-neutral-700">,</span>}
          </>
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="py-0.5">
            {isArray
              ? value.map((item, i) => (
                  <TreeNode
                    key={i}
                    k={i}
                    value={item}
                    depth={depth + 1}
                    isLast={i === value.length - 1}
                  />
                ))
              : Object.entries(value).map(([key, v], i, arr) => (
                  <TreeNode
                    key={key}
                    k={key}
                    value={v}
                    depth={depth + 1}
                    isLast={i === arr.length - 1}
                  />
                ))}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="flex items-start gap-2"
          style={{ paddingLeft: depth * 14 }}
        >
          <span className="w-3 shrink-0" />
          <span className="text-neutral-400">{bracketClose}</span>
          {!isLast && <span className="text-neutral-700">,</span>}
        </div>
      )}
    </div>
  );
};

const JsonTreeViewer = ({ data }) => (
  <div className="font-mono text-[12.5px] leading-[1.7] text-neutral-200 p-5">
    <TreeNode value={data} depth={0} isLast={true} defaultOpen={true} />
  </div>
);

/* ============================================================
   Table View
   ============================================================ */

const TableView = ({ data }) => {
  const columns = useMemo(() => {
    if (!isArrOfObjects(data)) return [];
    const seen = new Set();
    const cols = [];
    for (const row of data) {
      for (const k of Object.keys(row)) {
        if (!seen.has(k)) {
          seen.add(k);
          cols.push(k);
        }
      }
    }
    return cols;
  }, [data]);

  if (!isArrOfObjects(data)) {
    return (
      <EmptyHint
        icon={<Table2 size={20} />}
        title="Not tabular"
        body="Table view requires an array of objects. Try the JSON or Card view."
      />
    );
  }

  return (
    <div className="p-5">
      <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0E1422]">
        <div className="overflow-auto max-h-[calc(100vh-260px)] scroller">
          <table className="w-full text-[12.5px] text-left">
            <thead className="sticky top-0 bg-[#141C2F]/95 backdrop-blur z-10">
              <tr>
                <th className="px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-500 border-b border-white/[0.06] w-10">
                  #
                </th>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 border-b border-white/[0.06] whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2 text-neutral-600 font-mono text-[11px]">
                    {i + 1}
                  </td>
                  {columns.map((c) => {
                    const val = row[c];
                    const missing = val === undefined;
                    return (
                      <td
                        key={c}
                        className={`px-3 py-2 align-top max-w-[280px] truncate font-mono ${
                          missing ? "text-neutral-700" : "text-neutral-300"
                        }`}
                        title={missing ? "missing" : formatCell(val)}
                      >
                        {missing ? "—" : formatCell(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <Hash size={11} /> {data.length} rows
        </span>
        <span className="flex items-center gap-1.5">
          <Activity size={11} /> {columns.length} columns
        </span>
      </div>
    </div>
  );
};

/* ============================================================
   Card View
   ============================================================ */

const HEADLINE_KEYS = ["name", "title", "fullName", "full_name", "login"];
const ID_KEYS = ["id", "uuid", "_id", "key"];
const SUBTITLE_KEYS = [
  "email",
  "username",
  "description",
  "body",
  "url",
  "html_url",
];

const pickFirst = (obj, keys) => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
      return { key: k, value: obj[k] };
  }
  return null;
};

const CardItem = ({ obj, index }) => {
  const headline = pickFirst(obj, HEADLINE_KEYS);
  const idField = pickFirst(obj, ID_KEYS);
  const subtitle = pickFirst(obj, SUBTITLE_KEYS);

  const usedKeys = new Set(
    [headline?.key, idField?.key, subtitle?.key].filter(Boolean),
  );

  const otherEntries = Object.entries(obj)
    .filter(([k]) => !usedKeys.has(k))
    .slice(0, 6);

  const headlineStr = headline ? String(headline.value) : `Item ${index + 1}`;
  const initials =
    headlineStr
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "·";

  return (
    <div
      className="group relative rounded-2xl bg-[#121A2A] border border-white/[0.05] p-5 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-0.5"
      style={{
        animation: `cardIn 0.4s ease-out ${index * 30}ms backwards`,
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-semibold tracking-wider shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(76,201,240,0.18), rgba(124,131,253,0.18))",
            color: "#4CC9F0",
            border: "1px solid rgba(76,201,240,0.2)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-neutral-100 truncate">
            {headlineStr}
          </div>
          {subtitle && (
            <div className="text-[12px] text-neutral-500 truncate mt-0.5">
              {String(subtitle.value)}
            </div>
          )}
        </div>
        {idField && (
          <span
            className="shrink-0 text-[10px] font-mono px-2 py-1 rounded-md tracking-wider"
            style={{
              background: "rgba(124,131,253,0.10)",
              color: "#A5AAFF",
              border: "1px solid rgba(124,131,253,0.18)",
            }}
          >
            {String(idField.value).slice(0, 12)}
          </span>
        )}
      </div>

      {otherEntries.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-white/[0.04]">
          {otherEntries.map(([k, v]) => {
            const isPrim =
              v === null ||
              ["string", "number", "boolean"].includes(typeof v);
            return (
              <div
                key={k}
                className="flex items-start gap-3 text-[11.5px] font-mono"
              >
                <span className="text-neutral-600 w-[38%] truncate shrink-0">
                  {k}
                </span>
                <span
                  className={`flex-1 truncate ${
                    isPrim ? "text-neutral-300" : "text-neutral-500 italic"
                  }`}
                  title={formatCell(v)}
                >
                  {isPrim
                    ? formatCell(v)
                    : Array.isArray(v)
                    ? `[${v.length}]`
                    : "{…}"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CardView = ({ data }) => {
  let items = null;
  if (isArrOfObjects(data)) items = data;
  else if (isObj(data)) items = [data];

  if (!items) {
    return (
      <EmptyHint
        icon={<LayoutGrid size={20} />}
        title="Not card-friendly"
        body="Card view works with objects or arrays of objects."
      />
    );
  }

  return (
    <div className="p-5">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {items.map((obj, i) => (
          <CardItem key={i} obj={obj} index={i} />
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   Empty / Skeleton / Status helpers
   ============================================================ */

const EmptyHint = ({ icon, title, body }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-20">
    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-neutral-500 mb-4">
      {icon}
    </div>
    <div className="text-[14px] font-semibold text-neutral-300 mb-1">
      {title}
    </div>
    <div className="text-[12.5px] text-neutral-500 max-w-xs">{body}</div>
  </div>
);

const Skeleton = () => (
  <div className="p-5 space-y-3">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div
          className="h-3 rounded-md bg-white/[0.04] shimmer"
          style={{ width: `${20 + (i % 3) * 15}%` }}
        />
        <div
          className="h-3 rounded-md bg-white/[0.04] shimmer"
          style={{ width: `${30 + ((i + 2) % 4) * 10}%` }}
        />
        <div
          className="h-3 rounded-md bg-white/[0.04] shimmer flex-1"
          style={{ maxWidth: "60%" }}
        />
      </div>
    ))}
  </div>
);

const StatusPill = ({ status, statusText }) => {
  const tone = statusTone(status);
  const map = {
    success: {
      dot: "#22C55E",
      text: "#86EFAC",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.25)",
    },
    warning: {
      dot: "#FBBF24",
      text: "#FCD34D",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.25)",
    },
    error: {
      dot: "#EF4444",
      text: "#FCA5A5",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
    },
    neutral: {
      dot: "#6B7280",
      text: "#D1D5DB",
      bg: "rgba(107,114,128,0.08)",
      border: "rgba(107,114,128,0.25)",
    },
  };
  const c = map[tone];
  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11.5px] font-mono"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }}
      />
      <span className="font-semibold">{status}</span>
      <span className="opacity-70">{statusText || "OK"}</span>
    </div>
  );
};

/* ============================================================
   Request Panel
   ============================================================ */

const RequestPanel = ({
  url,
  setUrl,
  method,
  setMethod,
  body,
  setBody,
  bodyError,
  loading,
  sendRequest,
  loadExample,
}) => {
  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendRequest();
    }
  };

  return (
    <section
      className="relative rounded-2xl border border-white/[0.05] bg-[#111827] overflow-hidden grain"
      style={{
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)",
      }}
    >
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0]"
            style={{ boxShadow: "0 0 6px #4CC9F0" }}
          />
          <h2 className="text-[12px] font-semibold tracking-[0.14em] uppercase text-neutral-300">
            Request
          </h2>
        </div>
        <button
          onClick={loadExample}
          className="group flex items-center gap-1.5 text-[11.5px] text-neutral-400 hover:text-[#4CC9F0] transition-colors px-2 py-1 rounded-md hover:bg-white/[0.03]"
        >
          <Sparkles
            size={11}
            className="group-hover:rotate-12 transition-transform"
          />
          Load Example
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500 mb-2">
            Endpoint
          </label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="appearance-none pr-7 pl-3 py-2.5 rounded-xl bg-[#0B0F17] border border-white/[0.06] text-[12px] font-mono font-semibold tracking-wider text-[#4CC9F0] focus:outline-none focus:border-[#4CC9F0]/40 transition-colors cursor-pointer"
                style={{ minWidth: 88 }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <ChevronRight
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-neutral-500 pointer-events-none"
              />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder="https://api.example.com/resource"
              spellCheck={false}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-white/[0.06] text-[12.5px] font-mono text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-[#4CC9F0]/40 focus:ring-1 focus:ring-[#4CC9F0]/20 transition-all min-w-0"
            />
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            method === "POST"
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
                  Request Body
                </label>
                <span className="text-[10px] font-mono text-neutral-600">
                  application/json
                </span>
              </div>
              <div
                className={`relative rounded-xl bg-[#0B0F17] border transition-colors ${
                  bodyError
                    ? "border-[#EF4444]/40"
                    : "border-white/[0.06] focus-within:border-[#4CC9F0]/40"
                }`}
              >
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={'{\n  "key": "value"\n}'}
                  spellCheck={false}
                  rows={8}
                  className="w-full bg-transparent px-3.5 py-3 text-[12px] font-mono leading-relaxed text-neutral-200 placeholder:text-neutral-700 focus:outline-none resize-none scroller"
                />
                {bodyError && (
                  <div className="px-3.5 pb-2 -mt-1 text-[10.5px] font-mono text-[#FCA5A5] flex items-start gap-1.5">
                    <AlertCircle size={10} className="mt-0.5 shrink-0" />
                    <span className="truncate">{bodyError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={sendRequest}
            disabled={loading || !url.trim()}
            className="group relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight text-[#0B0F17] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985] transition-all duration-150 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #4CC9F0 0%, #7C83FD 100%)",
              boxShadow:
                "0 4px 16px -4px rgba(76,201,240,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #5DD3F5 0%, #8E94FF 100%)",
              }}
            />
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-[#0B0F17]/30 border-t-[#0B0F17] animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={13} strokeWidth={2.5} />
                  Send Request
                </>
              )}
            </span>
          </button>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-[10px] font-mono text-neutral-500">
            ⌘ ⏎
          </kbd>
        </div>

        <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[10.5px] text-neutral-600 font-mono">
          <Code2 size={11} />
          <span>No-cache · CORS-aware · Public APIs only</span>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   Response Panel
   ============================================================ */

const ResponsePanel = ({
  loading,
  response,
  error,
  tab,
  setTab,
  tabAvailable,
  copied,
  copyResponse,
  onLoadExample,
}) => {
  const tabs = [
    { id: "json", label: "JSON", icon: <Code2 size={13} /> },
    { id: "table", label: "Table", icon: <Table2 size={13} /> },
    { id: "card", label: "Card", icon: <LayoutGrid size={13} /> },
  ];

  return (
    <section
      className="relative rounded-2xl border border-white/[0.05] bg-[#111827] overflow-hidden flex flex-col grain"
      style={{
        minHeight: 600,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)",
      }}
    >
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#7C83FD]"
            style={{ boxShadow: "0 0 6px #7C83FD" }}
          />
          <h2 className="text-[12px] font-semibold tracking-[0.14em] uppercase text-neutral-300">
            Response
          </h2>
        </div>

        {response && (
          <div className="flex items-center gap-2 fade-in flex-wrap">
            <StatusPill
              status={response.status}
              statusText={response.statusText}
            />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-mono text-neutral-400 bg-white/[0.02] border border-white/[0.05]">
              <Clock size={11} />
              {response.timeMs}ms
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-mono text-neutral-400 bg-white/[0.02] border border-white/[0.05]">
              <FileJson size={11} />
              {formatBytes(response.size)}
            </span>
            <button
              onClick={copyResponse}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-mono text-neutral-400 hover:text-[#4CC9F0] bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-[#4CC9F0]/30 transition-all"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={11} />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {response && (
        <div className="px-5 pt-3 border-b border-white/[0.05] flex items-center gap-1 fade-in">
          {tabs.map((t) => {
            const active = tab === t.id;
            const enabled =
              t.id === "json"
                ? tabAvailable.json
                : t.id === "table"
                ? tabAvailable.table
                : tabAvailable.card;
            return (
              <button
                key={t.id}
                onClick={() => enabled && setTab(t.id)}
                disabled={!enabled}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium rounded-t-lg transition-all ${
                  active
                    ? "text-[#4CC9F0]"
                    : enabled
                    ? "text-neutral-500 hover:text-neutral-300"
                    : "text-neutral-700 cursor-not-allowed"
                }`}
              >
                {t.icon}
                {t.label}
                {active && (
                  <span
                    className="absolute -bottom-px left-2 right-2 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #4CC9F0, transparent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-auto scroller relative">
        {loading && <Skeleton />}

        {!loading && error && (
          <div className="p-8 fade-in">
            <div
              className="rounded-2xl border p-6 flex items-start gap-4"
              style={{
                background: "rgba(239,68,68,0.05)",
                borderColor: "rgba(239,68,68,0.2)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <AlertCircle size={18} className="text-[#FCA5A5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#FCA5A5] mb-1">
                  {error.message}
                </div>
                {error.detail && (
                  <div className="text-[12px] font-mono text-neutral-400 break-words">
                    {error.detail}
                  </div>
                )}
                <div className="text-[11.5px] text-neutral-500 mt-3">
                  Common causes: invalid URL, CORS restrictions, network
                  outage, or malformed request body.
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !response && (
          <EmptyState onLoadExample={onLoadExample} />
        )}

        {!loading && !error && response && (
          <div key={tab} className="tab-fade">
            {tab === "json" && <JsonTreeViewer data={response.body} />}
            {tab === "table" && <TableView data={response.body} />}
            {tab === "card" && <CardView data={response.body} />}
          </div>
        )}
      </div>
    </section>
  );
};

/* ============================================================
   Empty State
   ============================================================ */

const EmptyState = ({ onLoadExample }) => (
  <div className="flex flex-col items-center justify-center px-8 py-20 text-center fade-in">
    <div className="relative mb-6">
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-40"
        style={{
          background: "radial-gradient(circle, #4CC9F0 0%, transparent 70%)",
        }}
      />
      <div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(76,201,240,0.12), rgba(124,131,253,0.12))",
          border: "1px solid rgba(76,201,240,0.18)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <FileJson size={26} className="text-[#4CC9F0]" />
      </div>
    </div>
    <h3 className="text-[16px] font-semibold text-neutral-200 mb-2">
      Awaiting your first request
    </h3>
    <p className="text-[13px] text-neutral-500 max-w-sm leading-relaxed mb-6">
      Send a request to transform raw JSON into structured tree, table, and card
      visualizations.
    </p>
    <button
      onClick={onLoadExample}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#4CC9F0] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#4CC9F0]/30 transition-all"
    >
      <Sparkles
        size={13}
        className="group-hover:rotate-12 transition-transform"
      />
      Try an example
    </button>

    <div className="mt-10 grid grid-cols-3 gap-3 max-w-md w-full">
      {[
        { icon: <Code2 size={14} />, label: "Tree view" },
        { icon: <Table2 size={14} />, label: "Auto-table" },
        { icon: <LayoutGrid size={14} />, label: "Card grid" },
      ].map((f) => (
        <div
          key={f.label}
          className="rounded-xl p-3 bg-white/[0.015] border border-white/[0.04] text-[11px] text-neutral-500 flex flex-col items-center gap-1.5"
        >
          <span className="text-[#7C83FD]">{f.icon}</span>
          {f.label}
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================
   Main App
   ============================================================ */

export default function VISURA() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/users");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [bodyError, setBodyError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("json");
  const [copied, setCopied] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    if (method !== "POST" || body.trim() === "") {
      setBodyError(null);
      return;
    }
    try {
      JSON.parse(body);
      setBodyError(null);
    } catch (e) {
      setBodyError(e.message);
    }
  }, [body, method]);

  const loadExample = useCallback(() => {
    const ex = EXAMPLES[exampleIdx % EXAMPLES.length];
    setUrl(ex.url);
    setMethod(ex.method);
    setBody(ex.body);
    setExampleIdx((i) => i + 1);
  }, [exampleIdx]);

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError({ message: "URL is required" });
      return;
    }
    if (method === "POST" && body.trim() && bodyError) {
      setError({ message: "Invalid JSON body", detail: bodyError });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const t0 = performance.now();
    try {
      const init = { method };
      if (method === "POST") {
        init.headers = { "Content-Type": "application/json" };
        if (body.trim()) init.body = body;
      }
      const res = await fetch(url, init);
      const text = await res.text();
      const elapsed = Math.round(performance.now() - t0);

      let parsed = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* not JSON — leave as text */
      }

      const headers = {};
      res.headers.forEach((v, k) => (headers[k] = v));

      setResponse({
        status: res.status,
        statusText: res.statusText,
        timeMs: elapsed,
        body: parsed,
        size: new Blob([text]).size,
        headers,
      });

      if (isArrOfObjects(parsed)) setTab("table");
      else setTab("json");
    } catch (e) {
      const elapsed = Math.round(performance.now() - t0);
      setError({
        message: "Request failed",
        detail: `${e.message} (after ${elapsed}ms)`,
      });
    } finally {
      setLoading(false);
    }
  }, [url, method, body, bodyError]);

  const copyResponse = useCallback(async () => {
    if (!response) return;
    const text =
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }, [response]);

  const tabAvailable = useMemo(() => {
    if (!response) return { json: false, table: false, card: false };
    return {
      json: true,
      table: isArrOfObjects(response.body),
      card: isArrOfObjects(response.body) || isObj(response.body),
    };
  }, [response]);

  return (
    <div
      className="min-h-screen w-full text-neutral-100 antialiased"
      style={{
        background: "#0B0F17",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
        }
        .fade-in { animation: fadeIn 0.35s ease-out; }
        .tab-fade { animation: fadeIn 0.25s ease-out; }
        .grain::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.025;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }
        ::selection { background: rgba(76,201,240,0.25); color: #fff; }
        .scroller::-webkit-scrollbar { width: 8px; height: 8px; }
        .scroller::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .scroller::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
        .scroller::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
      `}</style>

      <header className="border-b border-white/[0.05] bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4CC9F0 0%, #7C83FD 100%)",
                boxShadow:
                  "0 4px 16px -4px rgba(76,201,240,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Zap size={16} className="text-[#0B0F17]" strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold tracking-tight">
                VISURA
              </span>
              <span className="text-[10px] font-mono text-neutral-600 tracking-[0.15em] uppercase">
                v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[11.5px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 6px #22C55E" }}
              />
              Ready
            </span>
            <span className="hidden md:inline font-mono">
              API Response Visualizer
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6">
          <RequestPanel
            url={url}
            setUrl={setUrl}
            method={method}
            setMethod={setMethod}
            body={body}
            setBody={setBody}
            bodyError={bodyError}
            loading={loading}
            sendRequest={sendRequest}
            loadExample={loadExample}
          />
          <ResponsePanel
            loading={loading}
            response={response}
            error={error}
            tab={tab}
            setTab={setTab}
            tabAvailable={tabAvailable}
            copied={copied}
            copyResponse={copyResponse}
            onLoadExample={loadExample}
          />
        </div>
      </main>
    </div>
  );
}
