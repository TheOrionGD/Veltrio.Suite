import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioGroq, generateSpeechGroq, chatWithGroqConversation, isGroqTtsActive } from '../services/groqService';
import { MicrophoneIcon, StopIcon, SpinnerIcon, SpeakerIcon } from './icons';
import WaveformVisualizer from './WaveformVisualizer';
import FramePlayer from './FramePlayer';
import { LANGUAGES } from '../constants';

type TranscriptEntry = {
    speaker: 'You' | 'AI';
    text: string;
    languageCode?: string;
};

interface ConversationViewProps {
    onAskAssistant: (prompt: string) => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ onAskAssistant }) => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'speaking' | 'error'>('idle');
    const [isLoopActive, setIsLoopActive] = useState<boolean>(false);
    const [inputLanguage, setInputLanguage] = useState<string>('auto');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string>('');
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Silence detection refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Refs to keep values fresh in callbacks and loops
    const statusRef = useRef(status);
    const isLoopActiveRef = useRef(isLoopActive);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        isLoopActiveRef.current = isLoopActive;
    }, [isLoopActive]);

    const scrollToBottom = () => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [transcript]);

    useEffect(() => () => {
        window.speechSynthesis.cancel();
        audioRef.current?.pause();
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
    }, []);

    const speakNative = (text: string, lang: string = 'en') => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;

        const wordCount = text.split(/\s+/).length;
        const estimatedDurationMs = Math.max(3000, wordCount * 400 + 3000);

        let didComplete = false;
        const completeSpeech = () => {
            if (didComplete) return;
            didComplete = true;
            clearTimeout(backupTimer);
            setStatus('idle');
            if (isLoopActiveRef.current) {
                setTimeout(startRecording, 400);
            }
        };

        u.onend = completeSpeech;
        u.onerror = completeSpeech;

        const backupTimer = setTimeout(() => {
            if (!didComplete) {
                window.speechSynthesis.cancel();
                completeSpeech();
            }
        }, estimatedDurationMs);

        window.speechSynthesis.speak(u);
    };

    const speakText = async (text: string, lang: string = 'en') => {
        setStatus('speaking');
        if (lang === 'en' && isGroqTtsActive()) {
            try {
                const blob = await generateSpeechGroq(text, 'en');
                const url = URL.createObjectURL(blob);
                if (!audioRef.current) {
                    const audio = new Audio(url);
                    audio.onended = () => {
                        setStatus('idle');
                        if (isLoopActiveRef.current) {
                            setTimeout(startRecording, 400);
                        }
                    };
                    audio.onerror = () => speakNative(text, 'en');
                    audioRef.current = audio;
                } else {
                    audioRef.current.src = url;
                    audioRef.current.onended = () => {
                        setStatus('idle');
                        if (isLoopActiveRef.current) {
                            setTimeout(startRecording, 400);
                        }
                    };
                    audioRef.current.onerror = () => speakNative(text, 'en');
                }
                audioRef.current.play();
            } catch (err) { speakNative(text, 'en'); }
        } else {
            speakNative(text, lang);
        }
    };

    const startRecording = async () => {
        setError(''); setStatus('recording');
        window.speechSynthesis.cancel(); audioRef.current?.pause();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                setAudioStream(null);

                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(() => { });
                    audioContextRef.current = null;
                }

                processAudioInput(audioBlob);
            };

            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                const bufferLength = analyser.fftSize;
                const dataArray = new Uint8Array(bufferLength);
                let lastSoundTime = Date.now();

                const checkSilence = () => {
                    if (statusRef.current !== 'recording') return;
                    analyser.getByteTimeDomainData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        const deviation = (dataArray[i] - 128) / 128;
                        sum += deviation * deviation;
                    }
                    const rms = Math.sqrt(sum / bufferLength);

                    const threshold = 0.015;
                    if (rms > threshold) {
                        lastSoundTime = Date.now();
                    }

                    if (Date.now() - lastSoundTime > 1600) {
                        stopRecording();
                    } else {
                        animationFrameRef.current = requestAnimationFrame(checkSilence);
                    }
                };

                animationFrameRef.current = requestAnimationFrame(checkSilence);
            } catch (vadErr) {
                console.error("VAD initialization failed:", vadErr);
            }

            mediaRecorder.start();
        } catch (err: any) { setError('Could not access microphone: ' + err.message); setStatus('idle'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const processAudioInput = async (audioBlob: Blob) => {
        setStatus('processing');
        try {
            const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
            if (!hasGroqKey) throw new Error('VITE_GROQ_API_KEY is not set. Please add it to your .env file.');

            const userText = await transcribeAudioGroq(audioBlob, inputLanguage);
            if (!userText.trim()) {
                setError('No speech detected. Please try again.');
                setStatus('idle');
                if (isLoopActiveRef.current) {
                    setTimeout(startRecording, 1000);
                }
                return;
            }

            const newTranscript = [...transcript, { speaker: 'You' as const, text: userText }];
            setTranscript(newTranscript);

            const formattedHistory = newTranscript.map(e => ({
                role: (e.speaker === 'You' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: e.text
            }));
            const res = await chatWithGroqConversation(formattedHistory, inputLanguage);
            if (!res.responseText.trim()) throw new Error('Empty response from AI model.');

            setTranscript(prev => [...prev, {
                speaker: 'AI' as const,
                text: res.responseText,
                languageCode: res.languageCode
            }]);

            await speakText(res.responseText, res.languageCode);
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
            setStatus('error');
            if (isLoopActiveRef.current) {
                setTimeout(startRecording, 2000);
            }
        }
    };

    const handleMicClick = () => {
        if (status === 'recording') {
            setIsLoopActive(false);
            stopRecording();
        } else if (status === 'speaking') {
            window.speechSynthesis.cancel();
            audioRef.current?.pause();
            setStatus('idle');
            setIsLoopActive(false);
        } else {
            setIsLoopActive(true);
            startRecording();
        }
    };

    const handleClearTranscript = () => {
        setTranscript([]);
        setError('');
        setStatus('idle');
    };

    // dynamic styles for microphone HUD circle in SaaS theme
    const centerRingGlow = {
        idle: 'border-slate-300 bg-slate-50 shadow-inner rounded-full',
        recording: 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] animate-pulse rounded-full',
        processing: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-spin [animation-duration:3s] rounded-full',
        speaking: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse rounded-full',
        error: 'border-red-500 rounded-full',
    }[status];

    const innerSphereColor = {
        idle: 'bg-white border-slate-200 text-slate-600 shadow-sm rounded-full',
        recording: 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm rounded-full',
        processing: 'bg-amber-50 border-amber-300 text-amber-600 rounded-full',
        speaking: 'bg-emerald-50 border-emerald-300 text-emerald-600 rounded-full',
        error: 'bg-red-50 border-red-300 text-red-600 rounded-full',
    }[status];

    const stateLabel = {
        idle: 'Ready to listen',
        recording: 'Listening to speech...',
        processing: 'AI processing translation...',
        speaking: 'AI speaking response...',
        error: 'Voice mode error',
    }[status];

    return (
        <div className="col-span-full grid grid-cols-1 lg:grid-cols-10 gap-6 relative font-sans">

            {/* Left Column: Voice Interaction Panel */}
            <div className="col-span-full lg:col-span-7 flex flex-col justify-start gap-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">

                {/* Advanced HUD Telemetry Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-shrink-0 text-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${status === 'recording' ? 'bg-blue-500 animate-ping' : 'bg-slate-300'}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            Live Conversation Console
                        </span>
                        <span className="hidden xl:inline text-[10px] text-slate-500 font-semibold">
                            [Status: Connected] [Active Dialogs: {transcript.length}]
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* LOCALE selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Input Language:</span>
                            <select
                                value={inputLanguage}
                                onChange={(e) => setInputLanguage(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg outline-none font-semibold shadow-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="auto">🔍 Auto-Detect</option>
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {transcript.length > 0 && (
                            <button
                                onClick={handleClearTranscript}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                                Clear Chat
                            </button>
                        )}
                    </div>
                </div>

                {/* Central Interaction Stage */}
                <div className="flex-grow flex flex-col items-center justify-center py-6 space-y-6 relative">

                    {/* Dynamic Voice HUD Circle */}
                    <button
                        onClick={handleMicClick}
                        disabled={status === 'processing'}
                        className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center z-10 flex-shrink-0 focus:outline-none cursor-pointer group"
                    >
                        <div className={`absolute inset-0 border-2 transition-all duration-500 ${centerRingGlow}`} />
                        <div className={`w-28 h-28 md:w-32 md:h-32 border flex items-center justify-center transition-all duration-500 ${innerSphereColor} relative overflow-hidden group-hover:scale-102`}>
                            {status === 'idle' && <MicrophoneIcon className="w-12 h-12" />}
                            {status === 'recording' && <StopIcon className="w-12 h-12 text-blue-600 animate-pulse" />}
                            {status === 'processing' && <SpinnerIcon className="w-12 h-12 text-amber-600 animate-spin" />}
                            {status === 'speaking' && <SpeakerIcon className="w-12 h-12 text-emerald-600 animate-bounce" />}
                            {status === 'error' && <span className="text-red-500 text-2xl font-bold">!</span>}
                        </div>
                    </button>

                    {/* Active Voice Subtitle */}
                    <div className="w-full max-w-md bg-slate-50 border border-slate-150 p-4 rounded-xl text-center min-h-[56px] flex items-center justify-center text-xs text-slate-700 shadow-inner flex-shrink-0 font-medium">
                        {status === 'recording' && <span className="text-blue-600 animate-pulse flex items-center gap-1.5">🎙️ Capturing your voice signal...</span>}
                        {status === 'processing' && <span className="text-amber-600 animate-pulse flex items-center gap-1.5">⏳ AI transcribing and translating speech...</span>}
                        {status === 'speaking' && (
                            <span className="text-emerald-700 font-semibold">
                                🤖 AI Assistant: "{transcript[transcript.length - 1]?.text}"
                            </span>
                        )}
                        {status === 'idle' && (
                            <span className="text-slate-400">Click the microphone to start talking</span>
                        )}
                    </div>

                    {/* Interactive Canvas Waveform Visualizer */}
                    <div className="text-center z-10 w-full max-w-md space-y-1.5 flex-shrink-0">
                        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            {stateLabel}
                        </h4>

                        <WaveformVisualizer
                            isActive={status !== 'idle'}
                            mode={status}
                            audioStream={audioStream}
                        />
                    </div>
                </div>

                {error && (
                    <div className="absolute top-20 left-6 right-6 border border-red-200 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-xs font-semibold text-center z-20 shadow-sm animate-pulse">
                        ⚠️ Voice connection error: {error}
                    </div>
                )}
            </div>

            {/* Right Column: Chat Logs & Help Section */}
            <div className="col-span-full lg:col-span-3 flex flex-col gap-6">

                {/* Chat Log History */}
                <div className="flex-grow bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col min-h-[300px]">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
                        Conversation Logs
                    </h3>

                    <div className="flex-grow space-y-3 pr-2 font-sans text-xs">
                        {transcript.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic text-center p-4">
                                No dialogs logged yet. Speak into the mic to start.
                            </div>
                        ) : (
                            transcript.map((entry, idx) => (
                                <div key={idx} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                                    <div className={`max-w-[85%] px-3 py-2 border rounded-xl text-xs leading-relaxed ${entry.speaker === 'You'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-800 border-slate-200'
                                        } flex items-center gap-2`}>
                                        <div className="flex-grow">
                                            <span className={`block text-[9px] font-bold uppercase mb-0.5 ${entry.speaker === 'You' ? 'text-indigo-200' : 'text-slate-400'
                                                }`}>{entry.speaker}</span>
                                            <p>{entry.text}</p>
                                        </div>
                                        {entry.speaker === 'AI' && (
                                            <button
                                                onClick={() => speakText(entry.text, entry.languageCode || 'en')}
                                                className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 cursor-pointer focus:outline-none"
                                                title="Replay Audio"
                                            >
                                                <SpeakerIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={transcriptEndRef} />
                    </div>

                    {transcript.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 flex-shrink-0 mt-3">
                            <button
                                onClick={() => {
                                    const formatted = transcript.map(e => `${e.speaker}: ${e.text}`).join('\n');
                                    onAskAssistant(`I am reviewing this conversation context from the Live Voice Mode:\n\n${formatted}\n\nCan you summarize the main discussion or provide phrasing tips based on this conversation?`);
                                }}
                                className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                                ✨ Analyze Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationView;
