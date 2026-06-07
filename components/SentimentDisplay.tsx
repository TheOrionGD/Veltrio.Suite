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
    color: 'text-primary cyber-glow-green',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary/5',
    label: 'POSITIVE_VALENCY',
  },
  [SentimentLabel.Negative]: {
    icon: NegativeIcon,
    color: 'text-red-500',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/5',
    label: 'NEGATIVE_VALENCY',
  },
  [SentimentLabel.Neutral]: {
    icon: NeutralIcon,
    color: 'text-muted',
    borderColor: 'border-primary/20',
    bgColor: 'bg-black/40',
    label: 'NEUTRAL_VALENCY',
  },
};

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ sentimentResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono text-xs">
        <SpinnerIcon className="animate-spin h-8 w-8 mb-4 text-primary" />
        <p className="font-bold uppercase animate-pulse">Running biometric sentiment classification...</p>
      </div>
    );
  }

  if (!sentimentResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted/60 font-mono text-xs">
        <NeutralIcon className="h-10 w-10 mb-3 opacity-30 animate-pulse" />
        <p className="uppercase">Biometric diagnostics system standby</p>
      </div>
    );
  }

  const config = sentimentConfig[sentimentResult.sentiment];
  const IconComponent = config.icon;

  const percentScore = Math.round((sentimentResult.confidence || 0.8) * 100);
  const intensityPercent = Math.round((sentimentResult.intensity || 0.5) * 100);

  return (
    <div className={`p-5 border transition-all duration-300 font-mono text-xs ${config.borderColor} ${config.bgColor}`}>
      <div className="flex flex-col gap-6">
        
        {/* Left: Overall Sentiment Label & Tone */}
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-black border ${config.borderColor} shadow-inner`}>
            <IconComponent className={`w-10 h-10 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-md font-extrabold tracking-wider ${config.color}`}>{config.label}</h3>
              <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 bg-black border border-primary/20 text-muted">
                TONE: {sentimentResult.tone ? sentimentResult.tone.toUpperCase() : 'NEUTRAL'}
              </span>
            </div>
            <p className="text-muted text-xs mt-2 leading-relaxed max-w-md">{sentimentResult.explanation}</p>
          </div>
        </div>

        {/* Right: Intensity & Confidence Meters */}
        <div className="flex flex-col gap-4 border-t border-primary/20 pt-4">
          {/* Intensity Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
              <span>EMOTIONAL INTENSITY</span>
              <span>{intensityPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 border border-primary/20 rounded-none overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-purple transition-all duration-500"
                style={{ width: `${intensityPercent}%` }}
              />
            </div>
          </div>

          {/* AI Confidence Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
              <span>CLASSIFIER CONFIDENCE</span>
              <span>{percentScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 border border-primary/20 rounded-none overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${percentScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Emotional Insight Badges */}
      {sentimentResult.emotionalInsights && sentimentResult.emotionalInsights.length > 0 && (
        <div className="mt-5 pt-4 border-t border-primary/20 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-muted mr-2 uppercase">EMOTIONAL TAGS:</span>
          {sentimentResult.emotionalInsights.map((insight, idx) => (
            <span 
              key={idx}
              className="text-[10px] font-bold px-2 py-1 bg-black border border-primary/30 text-foreground hover:text-primary hover:border-primary transition-colors"
            >
              ✨ {insight.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentDisplay;
