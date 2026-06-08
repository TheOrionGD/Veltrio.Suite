import React from 'react';
import { SentimentResult, SentimentLabel } from '../types';
import { PositiveIcon, NegativeIcon, NeutralIcon, SpinnerIcon } from './icons';

interface SentimentDisplayProps {
  sentimentResult: SentimentResult | null;
  isLoading: boolean;
}

const sentimentConfig = {
  [SentimentLabel.Positive]: {
    icon: PositiveIcon,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50/50',
    label: 'Positive Sentiment',
  },
  [SentimentLabel.Negative]: {
    icon: NegativeIcon,
    color: 'text-red-600',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50/50',
    label: 'Negative Sentiment',
  },
  [SentimentLabel.Neutral]: {
    icon: NeutralIcon,
    color: 'text-slate-500',
    borderColor: 'border-slate-200',
    bgColor: 'bg-slate-50/50',
    label: 'Neutral Sentiment',
  },
};

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ sentimentResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-sans text-xs">
        <SpinnerIcon className="animate-spin h-7 w-7 mb-3 text-indigo-500" />
        <p className="font-bold uppercase tracking-wider animate-pulse">Analyzing text sentiment...</p>
      </div>
    );
  }

  if (!sentimentResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 font-sans text-xs">
        <NeutralIcon className="h-9 w-9 mb-2.5 opacity-40 animate-pulse text-slate-300" />
        <p className="uppercase tracking-wider">Awaiting input stream</p>
      </div>
    );
  }

  const config = sentimentConfig[sentimentResult.sentiment];
  const IconComponent = config.icon;

  const percentScore = Math.round((sentimentResult.confidence || 0.8) * 100);
  const intensityPercent = Math.round((sentimentResult.intensity || 0.5) * 100);

  return (
    <div className={`p-5 border rounded-xl transition-all duration-300 font-sans text-xs ${config.borderColor} ${config.bgColor}`}>
      <div className="flex flex-col gap-5">
        
        {/* Left: Overall Sentiment Label & Tone */}
        <div className="flex items-center gap-4">
          <div className={`p-2.5 bg-white border rounded-xl ${config.borderColor} shadow-sm`}>
            <IconComponent className={`w-8 h-8 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-extrabold tracking-tight ${config.color}`}>{config.label}</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 uppercase">
                Tone: {sentimentResult.tone ? sentimentResult.tone : 'Neutral'}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed max-w-md">{sentimentResult.explanation}</p>
          </div>
        </div>

        {/* Right: Intensity & Confidence Meters */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          {/* Intensity Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Emotional Intensity</span>
              <span>{intensityPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${intensityPercent}%` }}
              />
            </div>
          </div>

          {/* AI Confidence Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Classifier Confidence</span>
              <span>{percentScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Emotional Insight Badges */}
      {sentimentResult.emotionalInsights && sentimentResult.emotionalInsights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">Insights:</span>
          {sentimentResult.emotionalInsights.map((insight, idx) => (
            <span 
              key={idx}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600"
            >
              {insight.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentDisplay;
