import React, { useMemo } from 'react';
import { HistoryItem } from '../types';
import { AnalyticsDashboard, DashboardData } from './AnalyticsDashboard';

interface AnalyticsViewProps {
  history: HistoryItem[] | null | undefined;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ history }) => {
  // Map raw database translation logs history to fully data-driven dashboard props
  const analyticsData = useMemo<DashboardData | null>(() => {
    if (history === undefined || history === null) {
      return null; // triggers structural loading skeleton state
    }

    if (history.length === 0) {
      return {
        meta: {
          title: "Translation Operations Workspace Insights",
          subtitle: "Real-time quality scores, readability clarity, and sentiment logs",
        },
        kpis: [],
        timeSeries: [],
        distribution: [],
        comparison: [],
        tableRows: []
      };
    }

    // Calculate dynamic date span from database logs
    const timestamps = history.map((h) => h.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    const meta = {
      title: "Translation Operations Workspace Insights",
      subtitle: "Real-time quality scores, readability clarity, and sentiment logs",
      dateRange: {
        from: new Date(minTime).toISOString(),
        to: new Date(maxTime).toISOString()
      },
      currency: "USD"
    };

    // KPI Metrics calculation
    const totalCount = history.length;

    const totalQuality = history.reduce(
      (acc, h) => acc + (h.qualityScore !== undefined ? h.qualityScore : 0.9),
      0
    );
    const avgQuality = Math.round((totalQuality / totalCount) * 100);

    const totalClarity = history.reduce(
      (acc, h) => acc + (h.clarityScore !== undefined ? h.clarityScore : 0.95),
      0
    );
    const avgClarity = Math.round((totalClarity / totalCount) * 100);

    const positiveCount = history.filter(
      (h) => h.sentiment?.sentiment === 'Positive'
    ).length;
    const positivePct = Math.round((positiveCount / totalCount) * 100);

    // Dynamic trend calculations by comparing chronologically divided halves of the logs
    const sortedByTime = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const halfIdx = Math.floor(sortedByTime.length / 2);
    const firstHalf = sortedByTime.slice(0, halfIdx);
    const secondHalf = sortedByTime.slice(halfIdx);

    let qualityTrend = 0;
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const q1 = firstHalf.reduce((acc, h) => acc + (h.qualityScore ?? 0.9), 0) / firstHalf.length;
      const q2 = secondHalf.reduce((acc, h) => acc + (h.qualityScore ?? 0.9), 0) / secondHalf.length;
      qualityTrend = Math.round((q2 - q1) * 100);
    }

    const volumeTrend = firstHalf.length > 0
      ? Math.round(((secondHalf.length - firstHalf.length) / firstHalf.length) * 100)
      : 0;

    const kpis = [
      {
        label: "Timeline Volume",
        value: totalCount,
        unit: " runs",
        trend: volumeTrend,
        trendLabel: "vs prior period"
      },
      {
        label: "Translation Quality",
        value: avgQuality,
        unit: "%",
        trend: qualityTrend,
        trendLabel: "vs prior period"
      },
      {
        label: "Readability Clarity",
        value: avgClarity,
        unit: "%",
        trend: 0,
        trendLabel: "stable"
      },
      {
        label: "Positive Sentiment",
        value: positivePct,
        unit: "%",
        trend: 0,
        trendLabel: "stable"
      }
    ];

    // Dynamic Time Series values
    const timeSeries = sortedByTime.map((h) => ({
      timestamp: new Date(h.timestamp).toISOString(),
      "quality_score": h.qualityScore ? Math.round(h.qualityScore * 100) : 90,
      "clarity_score": h.clarityScore ? Math.round(h.clarityScore * 100) : 90,
      "input_length": h.inputText.length
    }));

    // Dynamic Distribution (Sentiment)
    const neutralCount = history.filter((h) => h.sentiment?.sentiment === 'Neutral').length;
    const negativeCount = history.filter((h) => h.sentiment?.sentiment === 'Negative').length;

    const distribution = [
      { label: "Positive Tone", value: positiveCount, color: "#10b981" },
      { label: "Neutral Tone", value: neutralCount, color: "var(--color-accent, #7fd0e1)" },
      { label: "Negative Tone", value: negativeCount, color: "#ef4444" }
    ].filter((d) => d.value > 0); // Completely omit zero-value fields

    // Comparative dynamic aggregation by target language name
    const langGroups: { [lang: string]: { sumQ: number; sumC: number; count: number } } = {};
    history.forEach((h) => {
      const lang = h.targetLanguageName || 'Unknown';
      if (!langGroups[lang]) {
        langGroups[lang] = { sumQ: 0, sumC: 0, count: 0 };
      }
      langGroups[lang].sumQ += h.qualityScore ?? 0.9;
      langGroups[lang].sumC += h.clarityScore ?? 0.95;
      langGroups[lang].count += 1;
    });

    const comparison = Object.entries(langGroups).map(([langName, group]) => ({
      category: langName,
      "Avg Quality": Math.round((group.sumQ / group.count) * 100),
      "Avg Clarity": Math.round((group.sumC / group.count) * 100)
    }));

    // Dynamic Table ledger rows mapping
    const tableRows = sortedByTime.map((h) => ({
      id: h.id.substring(0, 8),
      query_text: h.inputText,
      translation: h.translatedText,
      detected_lang: h.detectedLanguageName || 'Unknown',
      target_lang: h.targetLanguageName,
      quality: h.qualityScore ? Math.round(h.qualityScore * 100) : 90,
      clarity: h.clarityScore ? Math.round(h.clarityScore * 100) : 90,
      sentiment: h.sentiment?.sentiment || 'Neutral',
      timestamp: new Date(h.timestamp).toLocaleString()
    }));

    return {
      meta,
      kpis,
      timeSeries,
      distribution,
      comparison,
      tableRows
    };
  }, [history]);

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in pb-36">
      <AnalyticsDashboard data={analyticsData} />
    </div>
  );
};

export default AnalyticsView;
