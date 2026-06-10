import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export interface DashboardData {
  meta?: {
    title: string;
    subtitle: string;
    dateRange?: { from: string; to: string };
    currency?: string;
    timezone?: string;
  };
  kpis?: Array<{
    label: string;
    value: number;
    unit?: string;
    trend?: number;
    trendLabel?: string;
  }>;
  timeSeries?: Array<{
    timestamp: string;
    [metricKey: string]: number | string;
  }>;
  distribution?: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  comparison?: Array<{
    category: string;
    [seriesKey: string]: number | string;
  }>;
  tableRows?: Array<{
    [columnKey: string]: string | number;
  }>;
}

interface AnalyticsDashboardProps {
  data?: DashboardData | null;
}

const DEFAULT_COLORS = [
  'var(--color-primary, #44b3cc)',
  'var(--color-accent, #7fd0e1)',
  'var(--color-purple, #2782a0)',
  'var(--color-amber, #f59e0b)',
  '#f43f5e',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
];

// Helper functions for headers and numbers
const formatHeader = (str: string) => {
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const formatNumber = (val: number, unit?: string, currency?: string) => {
  if (unit === '%') return `${val}%`;
  
  let formatted = '';
  if (val >= 1000000) {
    formatted = (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (val >= 1000) {
    formatted = (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    formatted = val.toLocaleString();
  }

  if (unit) {
    if (['$', '₹', '€', '£', '¥'].includes(unit)) {
      return `${unit}${formatted}`;
    }
    return `${formatted}${unit}`;
  }

  if (currency) {
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${formatted}`;
  }

  return formatted;
};

// Date span calculations and formatter
const getFormatterForTimeSeries = (fromStr?: string, toStr?: string) => {
  if (!fromStr || !toStr) return (val: string) => val;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (val: string) => {
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      if (diffDays < 2) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (diffDays < 90) {
        return d.toLocaleDateString([], { month: 'short', day: '2-digit' });
      } else {
        return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
      }
    } catch {
      return val;
    }
  };
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Client-side date filters
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  // Sync date ranges if meta.dateRange is loaded
  React.useEffect(() => {
    if (data?.meta?.dateRange) {
      setStartDateStr(data.meta.dateRange.from.substring(0, 10));
      setEndDateStr(data.meta.dateRange.to.substring(0, 10));
    }
  }, [data?.meta?.dateRange]);

  // Loading skeleton state
  if (data === undefined || data === null) {
    return (
      <div className="w-full space-y-8 animate-pulse text-zinc-400 dark:text-zinc-650 font-sans">
        {/* Skeleton Meta */}
        <div className="space-y-3">
          <div className="h-6 w-64 bg-zinc-300 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-96 bg-zinc-300 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-5 space-y-4 border border-zinc-250 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-900/30">
              <div className="h-3 w-20 bg-zinc-300 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-32 bg-zinc-300 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-40 bg-zinc-300 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Time Series */}
        <div className="glass-panel p-6 border border-zinc-250 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-900/30 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-zinc-300 dark:bg-zinc-800 rounded" />
            <div className="h-8 w-24 bg-zinc-300 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-72 w-full bg-zinc-300 dark:bg-zinc-800 rounded-xl" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 border border-zinc-250 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-900/30 space-y-4">
            <div className="h-4 w-36 bg-zinc-300 dark:bg-zinc-800 rounded" />
            <div className="h-64 w-full bg-zinc-300 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="glass-panel p-6 border border-zinc-250 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-900/30 space-y-4">
            <div className="h-4 w-36 bg-zinc-300 dark:bg-zinc-800 rounded" />
            <div className="h-64 w-full bg-zinc-300 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>

        {/* Skeleton Table */}
        <div className="glass-panel p-6 border border-zinc-250 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-900/30 space-y-4">
          <div className="h-4 w-32 bg-zinc-300 dark:bg-zinc-800 rounded" />
          <div className="space-y-3">
            <div className="h-8 w-full bg-zinc-300 dark:bg-zinc-800 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-full bg-zinc-200 dark:bg-zinc-850 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Client-side filtering of timeSeries
  const filteredTimeSeries = useMemo(() => {
    if (!data.timeSeries) return [];
    if (!data.meta?.dateRange || !startDateStr || !endDateStr) {
      return data.timeSeries;
    }

    const startMs = new Date(startDateStr).getTime();
    // extend end date to end of the day
    const endMs = new Date(endDateStr).getTime() + (24 * 60 * 60 * 1000 - 1);

    return data.timeSeries.filter((item) => {
      const ms = new Date(item.timestamp).getTime();
      return ms >= startMs && ms <= endMs;
    });
  }, [data.timeSeries, data.meta?.dateRange, startDateStr, endDateStr]);

  // Extract dynamic metric keys for Time Series Chart
  const timeSeriesMetricKeys = useMemo(() => {
    if (!data.timeSeries || data.timeSeries.length === 0) return [];
    return Object.keys(data.timeSeries[0]).filter((key) => key !== 'timestamp');
  }, [data.timeSeries]);

  // Y-axis bounds calculation
  const timeSeriesYDomain = useMemo(() => {
    if (filteredTimeSeries.length === 0 || timeSeriesMetricKeys.length === 0) {
      return [0, 'auto'];
    }
    let minVal = Infinity;
    let maxVal = -Infinity;

    filteredTimeSeries.forEach((item) => {
      timeSeriesMetricKeys.forEach((key) => {
        const val = Number(item[key]);
        if (!isNaN(val)) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      });
    });

    if (minVal === Infinity) return [0, 'auto'];
    const padding = (maxVal - minVal) * 0.08 || 5;
    return [Math.max(0, Math.floor(minVal - padding)), Math.ceil(maxVal + padding)];
  }, [filteredTimeSeries, timeSeriesMetricKeys]);

  // Pie chart calculation
  const donutSum = useMemo(() => {
    if (!data.distribution) return 0;
    return data.distribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.distribution]);

  // Extract dynamic series keys for Comparison Bar Chart
  const comparisonSeriesKeys = useMemo(() => {
    if (!data.comparison || data.comparison.length === 0) return [];
    return Object.keys(data.comparison[0]).filter((key) => key !== 'category');
  }, [data.comparison]);

  // Dynamic columns for table
  const tableColumns = useMemo(() => {
    if (!data.tableRows || data.tableRows.length === 0) return [];
    return Object.keys(data.tableRows[0]);
  }, [data.tableRows]);

  // Table sorting logic
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!data.tableRows) return [];
    if (!sortKey) return data.tableRows;

    return [...data.tableRows].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA);
      const strB = String(valB);
      return sortDirection === 'asc'
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [data.tableRows, sortKey, sortDirection]);

  // Format dynamic dates for TimeSeries Chart ticks
  const timeSeriesDateFormatter = useMemo(() => {
    return getFormatterForTimeSeries(
      data.meta?.dateRange?.from,
      data.meta?.dateRange?.to
    );
  }, [data.meta?.dateRange]);

  return (
    <div className="w-full space-y-8 text-foreground font-sans">
      {/* Header section */}
      {data.meta && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-primary">
              {data.meta.title}
            </h1>
            <p className="text-xs text-muted mt-1">
              {data.meta.subtitle}
            </p>
          </div>

          {/* Client-side date filters */}
          {data.meta.dateRange && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted">From</span>
                <input
                  type="date"
                  value={startDateStr}
                  min={data.meta.dateRange.from.substring(0, 10)}
                  max={endDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="px-2 py-1 border border-border rounded-lg bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted">To</span>
                <input
                  type="date"
                  value={endDateStr}
                  min={startDateStr}
                  max={data.meta.dateRange.to.substring(0, 10)}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="px-2 py-1 border border-border rounded-lg bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      {data.kpis && data.kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.kpis.map((kpi, idx) => {
            const hasTrend = kpi.trend !== undefined && kpi.trend !== null;
            const isTrendPositive = hasTrend && kpi.trend! >= 0;
            return (
              <div
                key={idx}
                className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all duration-300"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                    {kpi.label}
                  </span>
                  <span className="text-2xl font-black text-foreground block">
                    {formatNumber(kpi.value, kpi.unit, data.meta?.currency)}
                  </span>
                </div>

                {hasTrend && (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className={`font-black flex items-center px-1.5 py-0.5 rounded-full border ${
                        isTrendPositive
                          ? 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5'
                          : 'text-red-500 border-red-500/10 bg-red-500/5'
                      }`}
                    >
                      {isTrendPositive ? '↑' : '↓'} {Math.abs(kpi.trend!)}%
                    </span>
                    {kpi.trendLabel && (
                      <span className="text-zinc-400 font-medium">
                        {kpi.trendLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TimeSeries Chart */}
      {data.timeSeries && data.timeSeries.length > 0 && filteredTimeSeries.length > 0 && timeSeriesMetricKeys.length > 0 && (
        <div className="glass-panel p-5 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-border/30 pb-3 flex-wrap">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Timeline Performance
            </h3>

            {/* Chart Type Toggle */}
            <div className="flex bg-zinc-800/15 dark:bg-white/5 border border-border/30 p-0.5 rounded-xl text-[9px] font-bold">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                  chartType === 'area'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                  chartType === 'line'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Line
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 300, minHeight: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={filteredTimeSeries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    {timeSeriesMetricKeys.map((key, i) => (
                      <linearGradient
                        key={key}
                        id={`gradient-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border, #24637a)"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={timeSeriesDateFormatter}
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                  />
                  <YAxis
                    domain={timeSeriesYDomain}
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                    tickFormatter={(val) => formatNumber(val, undefined, data.meta?.currency)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(35, 69, 86, 0.95)',
                      border: '1px solid var(--color-border, #24637a)',
                      borderRadius: '16px',
                      color: 'var(--color-foreground, #effbfc)',
                      fontSize: '11px',
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value: any, name: any) => [
                      formatNumber(Number(value), undefined, data.meta?.currency),
                      formatHeader(name),
                    ]}
                  />
                  <Legend
                    formatter={(val) => (
                      <span className="text-[10px] font-bold text-foreground opacity-85">
                        {formatHeader(val)}
                      </span>
                    )}
                  />
                  {timeSeriesMetricKeys.map((key, i) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                      fillOpacity={1}
                      fill={`url(#gradient-${key})`}
                      strokeWidth={2.5}
                    />
                  ))}
                </AreaChart>
              ) : (
                <LineChart
                  data={filteredTimeSeries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border, #24637a)"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={timeSeriesDateFormatter}
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                  />
                  <YAxis
                    domain={timeSeriesYDomain}
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                    tickFormatter={(val) => formatNumber(val, undefined, data.meta?.currency)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(35, 69, 86, 0.95)',
                      border: '1px solid var(--color-border, #24637a)',
                      borderRadius: '16px',
                      color: 'var(--color-foreground, #effbfc)',
                      fontSize: '11px',
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value: any, name: any) => [
                      formatNumber(Number(value), undefined, data.meta?.currency),
                      formatHeader(name),
                    ]}
                  />
                  <Legend
                    formatter={(val) => (
                      <span className="text-[10px] font-bold text-foreground opacity-85">
                        {formatHeader(val)}
                      </span>
                    )}
                  />
                  {timeSeriesMetricKeys.map((key, i) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1.5 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribution & Comparison Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie / Donut Chart */}
        {data.distribution && data.distribution.length > 0 && (
          <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Distribution Metrics
            </h3>

            <div
              className="relative flex items-center justify-center"
              style={{ width: '100%', height: 260 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color ||
                          DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(35, 69, 86, 0.95)',
                      border: '1px solid var(--color-border, #24637a)',
                      borderRadius: '16px',
                      color: 'var(--color-foreground, #effbfc)',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) =>
                      formatNumber(Number(value), undefined, data.meta?.currency)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total Centered Label */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                  Total
                </span>
                <span className="text-xl font-black text-foreground">
                  {formatNumber(donutSum, undefined, data.meta?.currency)}
                </span>
              </div>
            </div>

            {/* Distribution Legend List */}
            <div className="flex flex-wrap justify-center gap-4 text-[10px]">
              {data.distribution.map((entry, idx) => (
                <div key={entry.label} className="flex items-center gap-1.5 font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        entry.color ||
                        DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                    }}
                  />
                  <span>
                    {entry.label} ({Math.round((entry.value / (donutSum || 1)) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Bar Chart */}
        {data.comparison && data.comparison.length > 0 && comparisonSeriesKeys.length > 0 && (
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Comparative Analysis
            </h3>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.comparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border, #24637a)"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="category"
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                  />
                  <YAxis
                    stroke="var(--color-muted, #b4e4ed)"
                    fontSize={9}
                    tickLine={false}
                    opacity={0.6}
                    tickFormatter={(val) => formatNumber(val, undefined, data.meta?.currency)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(35, 69, 86, 0.95)',
                      border: '1px solid var(--color-border, #24637a)',
                      borderRadius: '16px',
                      color: 'var(--color-foreground, #effbfc)',
                      fontSize: '11px',
                    }}
                    formatter={(value: any, name: any) => [
                      formatNumber(Number(value), undefined, data.meta?.currency),
                      formatHeader(name),
                    ]}
                  />
                  <Legend
                    formatter={(val) => (
                      <span className="text-[10px] font-bold text-foreground opacity-85">
                        {formatHeader(val)}
                      </span>
                    )}
                  />
                  {comparisonSeriesKeys.map((key, i) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Data Table */}
      {data.tableRows && data.tableRows.length > 0 && tableColumns.length > 0 && (
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
            Metric Logs Ledger
          </h3>

          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="bg-zinc-800/10 dark:bg-white/5 border-b border-border/40 text-[10px] uppercase font-bold text-muted tracking-wider">
                <tr>
                  {tableColumns.map((col) => {
                    const isSorted = sortKey === col;
                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className={`p-3 cursor-pointer select-none hover:bg-zinc-800/10 dark:hover:bg-white/5 transition-colors ${
                          typeof data.tableRows![0][col] === 'number'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 ${
                            typeof data.tableRows![0][col] === 'number'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <span>{formatHeader(col)}</span>
                          <span className="text-[9px] text-[#44b3cc]">
                            {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-zinc-800/5 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {tableColumns.map((col) => {
                      const val = row[col];
                      const isNumber = typeof val === 'number';
                      return (
                        <td
                          key={col}
                          className={`p-3 font-medium text-foreground/95 leading-normal ${
                            isNumber ? 'text-right font-mono' : 'text-left'
                          }`}
                        >
                          {isNumber
                            ? formatNumber(val, undefined, data.meta?.currency)
                            : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
