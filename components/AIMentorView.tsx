import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateMentorResponse, getAiClient, generateChartImage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { LiveSession, Modality, LiveServerMessage, Blob } from '@google/genai';
import { ChartDisplay } from './ChartDisplay';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { SpeakerXMarkIcon } from './icons/SpeakerXMarkIcon';
import { useApiKey } from '../hooks/useApiKey';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { LinkIcon } from './icons/LinkIcon';
import { AppView, Lesson } from '../types';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { useCompletion } from '../hooks/useCompletion';
import { MODULES } from '../constants';
import { useMentorSettings } from '../hooks/useMentorSettings';
import { MENTOR_PERSONAS } from '../constants/mentorSettings';

// --- Types ---
interface UploadedFile {
    data: string; // base64 data without the prefix
    mimeType: string;
    name: string;
}
interface Message {
    id: number;
    role: 'user' | 'model';
    text: string;
    file?: UploadedFile;
    userImage?: string; // base64 data URL for user upload display
    modelResponseImage?: string; // base64 data URL for model's annotated image
    isImageLoading?: boolean;
    groundingChunks?: any[];
}
type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

interface AIMentorViewProps {
    onSetView: (view: AppView) => void;
    onExecuteTool: (payload: { toolName: AppView, params: any }) => void;
}

// --- Constants ---
const CHAT_HISTORY_KEY = 'aiMentorChatHistory';
const allLessons = MODULES.flatMap(module => module.lessons);

// --- Helper Functions ---
const readFileAndConvertToBase64 = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ data: base64Data, mimeType: file.type, name: file.name });
    };
    reader.onerror = error => reject(error);
  });

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const regex = /\*\*(.*?)\*\*/g;
        let match;
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-blue-600 dark:text-cyan-400">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };
    
    const lines = text.split('\n').filter(p => p.trim() !== '');
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    const flushListItems = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-1 my-3 pl-5">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isListItem = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
        if (isListItem) {
            listItems.push(<li key={index}>{renderInlineMarkdown(trimmedLine.substring(2))}</li>);
        } else {
            flushListItems();
            elements.push(<p key={index} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
        }
    });
    flushListItems();
    return <>{elements}</>;
};

const EXAMPLE_PROMPTS = [
    {
        icon: LightBulbIcon,
        text: "Explain 'Fair Value Gaps' like I'm five."
    },
    {
        icon: ChartBarIcon,
        text: "Show me a chart of a bearish Change of Character (CHoCH)."
    },
    {
        icon: RocketLaunchIcon,
        text: "Let's practice identifying order blocks."
    },
    {
        icon: MagnifyingGlassIcon,
        text: "What was the market impact of the last US CPI report?"
    },
]

export const AIMentorView: React.FC<AIMentorViewProps> = ({ onSetView, onExecuteTool }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { apiKey, openKeyModal } = useApiKey();
    const { getCompletedLessons } = useCompletion();
    const { personaId, setPersonaId } = useMentorSettings();
    
    // Voice state
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioResourcesRef = useRef<{
        stream: MediaStream | null;
        inputAudioContext: AudioContext | null;
        outputAudioContext: AudioContext | null;
        inputNode: GainNode | null;
        outputNode: GainNode | null;
        scriptProcessor: ScriptProcessorNode | null;
        sources: Set<AudioBufferSourceNode>;
        nextStartTime: number;
    }>({ stream: null, inputAudioContext: null, outputAudioContext: null, inputNode: null, outputNode: null, scriptProcessor: null, sources: new Set(), nextStartTime: 0 });

    // Text-to-Speech state
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // --- Text-to-Speech Handlers ---
    const stopSpeaking = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis || !text) return;
        
        stopSpeaking();
        
        // Clean up any potential markdown for better speech flow
        const cleanedText = text.replace(/\*\*/g, '').replace(/\[CHART:.*?\]/s, '');

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    }, [stopSpeaking]);

    const handleToggleTts = () => {
        const newIsEnabled = !isTtsEnabled;
        setIsTtsEnabled(newIsEnabled);
        if (!newIsEnabled) {
            stopSpeaking();
        }
    };

    // Load chat history from localStorage on component mount
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            if (savedHistory) {
                setMessages(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error("Failed to load chat history from localStorage", error);
            localStorage.removeItem(CHAT_HISTORY_KEY); // Clear potentially corrupted data
        }
    }, []);

    // Save chat history to localStorage whenever it changes
    useEffect(() => {
        if (messages.length > 0) {
            try {
                // Omit file data from being saved to avoid large localStorage usage
                const historyToSave = messages.map(({ file, ...rest }) => rest);
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyToSave));
            } catch (error) {
                console.error("Failed to save chat history to localStorage", error);
            }
        }
    }, [messages]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, currentInputTranscription, currentOutputTranscription]);

    const handleSendMessage = async () => {
        if ((!userInput.trim() && !uploadedFile) || isLoading) return;
        if (!apiKey) {
            openKeyModal();
            return;
        }

        stopSpeaking();
        setError(null);

        const isImage = uploadedFile?.mimeType.startsWith('image/');
        const userMessage: Message = { 
            id: Date.now(), 
            role: 'user', 
            text: userInput.trim(), 
            ...(uploadedFile && { file: uploadedFile }),
            ...(isImage && uploadedFile && { userImage: `data:${uploadedFile.mimeType};base64,${uploadedFile.data}` })
        };
        setMessages(prev => [...prev, userMessage]);
        
        setIsLoading(true);
        setUserInput('');
        setUploadedFile(null);

        try {
            const completedLessons = getCompletedLessons();
            const completedLessonTitles = allLessons
                .filter(l => completedLessons.has(l.key))
                .map(l => l.title);

            const { text: responseText, image: responseImage, groundingChunks, functionCalls } = await generateMentorResponse(apiKey, userMessage.text, completedLessonTitles, personaId, userMessage.file);
            
            const modelMessageId = Date.now() + 1;
            
            const chartRegex = /\[CHART:\s*(.*?)\]/s;
            const chartMatch = responseText.match(chartRegex);
            let cleanText = responseText.replace(chartRegex, '').trim();

            if (functionCalls && functionCalls.length > 0 && !cleanText) {
                const toolName = functionCalls[0]?.args?.toolName;
                if (toolName) {
                    const formattedToolName = (toolName as string).replace(/_/g, ' ');
                    cleanText = `Of course. Navigating to the ${formattedToolName} for you...`;
                }
            }

            if (cleanText || responseImage) {
                const modelMessage: Message = { 
                    id: modelMessageId, 
                    role: 'model', 
                    text: cleanText, 
                    isImageLoading: !!chartMatch,
                    modelResponseImage: responseImage,
                    groundingChunks 
                };
                setMessages(prev => [...prev, modelMessage]);
    
                if (isTtsEnabled && cleanText) {
                    speak(cleanText);
                }
            }
            
            if (chartMatch && chartMatch[1]) {
                const chartPrompt = chartMatch[1];
                try {
                    const imageUrl = await generateChartImage(apiKey, chartPrompt);
                    setMessages(prev => prev.map(m => 
                        m.id === modelMessageId ? { ...m, modelResponseImage: imageUrl, isImageLoading: false } : m
                    ));
                } catch (chartError) {
                    console.error("Failed to generate chart requested by AI:", chartError);
                    setMessages(prev => prev.map(m => 
                        m.id === modelMessageId ? { ...m, isImageLoading: false } : m
                    ));
                }
            }

            if (functionCalls && functionCalls.length > 0) {
                const funcCall = functionCalls[0];
                if (funcCall.name === 'executeTool' && funcCall.args.toolName) {
                    setTimeout(() => {
                         onExecuteTool({ toolName: funcCall.args.toolName as AppView, params: funcCall.args.params });
                    }, 1500); 
                }
            }

        } catch (e) {
            console.error(e);
            const errorMsg = "Sorry, I couldn't get a response from the AI Mentor. Please check your API key and try again.";
            setError(errorMsg);
            setMessages(prev => [...prev, { id: Date.now(), role: 'model', text: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileData = await readFileAndConvertToBase64(file);
                setUploadedFile(fileData);
            } catch (err) {
                console.error("Error converting file to base64:", err);
                setError("Could not upload file. Please try again.");
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const stopVoiceChat = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing live session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
        audioResourcesRef.current.stream?.getTracks().forEach(track => track.stop());
        audioResourcesRef.current.scriptProcessor?.disconnect();
        
        if (audioResourcesRef.current.inputAudioContext?.state !== 'closed') {
            audioResourcesRef.current.inputAudioContext?.close();
        }
        if (audioResourcesRef.current.outputAudioContext?.state !== 'closed') {
            audioResourcesRef.current.outputAudioContext?.close();
        }
        
        audioResourcesRef.current.sources.forEach(s => s.stop());

        audioResourcesRef.current = { stream: null, inputAudioContext: null, outputAudioContext: null, inputNode: null, outputNode: null, scriptProcessor: null, sources: new Set(), nextStartTime: 0 };
        setVoiceState('idle');
    }, []);

    // Effect for cleaning up resources when the component unmounts.
    useEffect(() => {
        return () => {
            stopVoiceChat();
            stopSpeaking();
        };
    }, [stopVoiceChat, stopSpeaking]);


    const handleToggleVoiceChat = async () => {
        if (voiceState === 'active' || voiceState === 'connecting') {
            stopVoiceChat();
            return;
        }

        if (!apiKey) {
            openKeyModal();
            return;
        }

        setVoiceState('connecting');
        setError(null);
        
        try {
            const ai = getAiClient(apiKey);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioResourcesRef.current.stream = stream;
            
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioResourcesRef.current.inputAudioContext = inputAudioContext;
            audioResourcesRef.current.outputAudioContext = outputAudioContext;
            audioResourcesRef.current.inputNode = inputAudioContext.createGain();
            audioResourcesRef.current.outputNode = outputAudioContext.createGain();
            audioResourcesRef.current.nextStartTime = 0;
            audioResourcesRef.current.sources.clear();

            let localInputTranscription = '';
            let localOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setVoiceState('active');
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        audioResourcesRef.current.scriptProcessor = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            setCurrentOutputTranscription(prev => prev + message.serverContent.outputTranscription.text);
                        } else if (message.serverContent?.inputTranscription) {
                            setCurrentInputTranscription(prev => prev + message.serverContent.inputTranscription.text);
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = localInputTranscription + currentInputTranscription;
                            const fullOutput = localOutputTranscription + currentOutputTranscription;
                            setMessages(prev => [
                                ...prev,
                                { id: Date.now(), role: 'user', text: fullInput || "[spoken input]" },
                                { id: Date.now() + 1, role: 'model', text: fullOutput || "[spoken response]" },
                            ]);
                            localInputTranscription = '';
                            localOutputTranscription = '';
                            setCurrentInputTranscription('');
                            setCurrentOutputTranscription('');
                        }

                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64EncodedAudioString) {
                            let { nextStartTime, sources, outputNode: outNode, outputAudioContext: outCtx } = audioResourcesRef.current;
                            if (!outNode || !outCtx) return;

                            nextStartTime = Math.max(nextStartTime, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outNode);
                            source.addEventListener('ended', () => { sources.delete(source); });
                            source.start(nextStartTime);
                            audioResourcesRef.current.nextStartTime = nextStartTime + audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Voice chat error:', e);
                        setError('An error occurred with the voice chat. Please check your API key.');
                        stopVoiceChat();
                    },
                    onclose: () => stopVoiceChat(),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are an expert forex trading mentor specializing in Smart Money Concepts. Keep your spoken answers concise and clear.',
                },
            });
        } catch (err) {
            console.error("Failed to start voice chat:", err);
            setError("Could not access microphone. Please check permissions and try again.");
            setVoiceState('error');
        }
    };
    
    const getVoiceButton = () => {
        const classMap = {
            idle: 'bg-slate-200 text-slate-600 hover:bg-blue-500 hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-cyan-500 dark:hover:text-slate-900',
            connecting: 'bg-yellow-500 text-white animate-pulse',
            active: 'bg-red-500 text-white',
            error: 'bg-red-700 text-white',
        }
        return (
            <button
                onClick={handleToggleVoiceChat}
                className={`p-2.5 rounded-full transition-colors ${classMap[voiceState]}`}
                aria-label={voiceState === 'active' ? 'Stop voice chat' : 'Start voice chat'}
            >
                {voiceState === 'active' || voiceState === 'connecting' ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
            </button>
        )
    }

    const WelcomeScreen = () => (
        <div className="text-center m-auto">
            <SparklesIcon className="w-16 h-16 mx-auto text-blue-500 dark:text-cyan-400" />
            <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">AI Trading Mentor</h2>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Ask me anything, or try one of the examples below.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <button
                        key={index}
                        onClick={() => setUserInput(prompt.text)}
                        className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left shadow-sm hover:border-blue-500/50 dark:hover:border-cyan-500/50 hover:-translate-y-0.5 transition-all"
                    >
                        <prompt.icon className="w-6 h-6 mb-2 text-blue-500 dark:text-cyan-400"/>
                        <p className="text-sm text-slate-800 dark:text-slate-300">{prompt.text}</p>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto">
            <div className="flex-shrink-0 mb-4 flex justify-between items-center">
                {messages.length > 0 ? (
                    <h1 className="text-2xl font-bold text-white">AI Mentor</h1>
                ) : (
                    <div></div> // Spacer
                )}
                <div>
                    <label htmlFor="persona-select" className="text-sm font-medium text-slate-400 mr-2">Persona:</label>
                    <select
                        id="persona-select"
                        value={personaId}
                        onChange={(e) => setPersonaId(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-sm text-white font-semibold focus:ring-2 focus:ring-cyan-500"
                    >
                        {MENTOR_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 pb-4">
                {messages.length === 0 && voiceState === 'idle' && <WelcomeScreen />}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 animate-[fade-in_0.5s_ease-out] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" /></div>}
                       <div className={`w-full max-w-lg p-4 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}>
                           {msg.userImage && (
                               <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                <img src={msg.userImage} alt="User upload" className="max-w-full h-auto" />
                               </div>
                           )}
                           {msg.file && !msg.file.mimeType.startsWith('image/') && (
                                <div className="mb-3 p-3 bg-slate-200 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center gap-3">
                                    <DocumentTextIcon className="w-8 h-8 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-sm text-slate-800 dark:text-slate-300 truncate font-medium">{msg.file.name}</span>
                                </div>
                           )}
                           {msg.isImageLoading && (
                               <ChartDisplay
                                   imageUrl=""
                                   isLoading={true}
                                   loadingText="AI is generating a chart..."
                                   containerClassName="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600"
                               />
                           )}
                           {msg.modelResponseImage && !msg.isImageLoading && (
                               <ChartDisplay
                                   imageUrl={msg.modelResponseImage}
                                   isLoading={false}
                                   containerClassName="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 hover:border-blue-500/50 dark:hover:border-cyan-500/50 transition-colors"
                               />
                           )}
                           {msg.text && <div className="prose dark:prose-invert prose-sm max-w-none text-slate-800 dark:text-slate-200"><FormattedContent text={msg.text} /></div>}
                           {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center"><LinkIcon className="w-4 h-4 mr-1.5" /> Sources</h4>
                                    <ul className="space-y-1.5">
                                        {msg.groundingChunks.map((chunk, index) => chunk.web && (
                                            <li key={index}>
                                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-cyan-400 hover:underline truncate block" title={chunk.web.title}>
                                                    {chunk.web.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                           )}
                       </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" /></div>
                        <div className="w-full max-w-lg p-4 rounded-xl bg-white dark:bg-slate-800 flex items-center space-x-2"><LoadingSpinner /><span className="text-slate-500 dark:text-slate-400 text-sm">AI Mentor is thinking...</span></div>
                    </div>
                )}
                 {error && <div className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 p-3 rounded-lg">{error}</div>}
                 {voiceState !== 'idle' && (
                    <div className="sticky bottom-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400"><strong>You:</strong> {currentInputTranscription}<span className="inline-block w-1.5 h-4 bg-blue-500 dark:bg-cyan-400 ml-1 animate-pulse"></span></p>
                        <p className="text-sm text-blue-700 dark:text-cyan-300 mt-1"><strong>Mentor:</strong> {currentOutputTranscription}</p>
                    </div>
                )}
            </div>
            
            <div className="mt-2 flex-shrink-0">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col">
                    {uploadedFile && (
                         <div className="p-2 relative w-fit">
                            {uploadedFile.mimeType.startsWith('image/') ? (
                                <img src={`data:${uploadedFile.mimeType};base64,${uploadedFile.data}`} alt="Preview" className="max-h-24 w-auto rounded-md border border-slate-200 dark:border-slate-600" />
                            ) : (
                                <div className="flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <DocumentTextIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-sm text-slate-800 dark:text-slate-300 truncate">{uploadedFile.name}</span>
                                </div>
                            )}
                            <button onClick={() => setUploadedFile(null)} className="absolute -top-1 -right-1 bg-slate-500 dark:bg-slate-600 rounded-full p-0.5 text-white hover:bg-red-500"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className="flex items-end space-x-2">
                        <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask the AI Mentor..." className="flex-1 bg-transparent p-2 text-slate-900 dark:text-slate-200 resize-none focus:outline-none placeholder-slate-500 dark:placeholder-slate-500" rows={1} disabled={voiceState !== 'idle'}/>
                        <input type="file" accept="image/*,text/plain,text/csv,application/pdf,.doc,.docx,.xls,.xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Upload file" title="Upload file" disabled={voiceState !== 'idle'}><PaperClipIcon className="w-6 h-6" /></button>
                        <button
                            onClick={handleToggleTts}
                            className={`p-2.5 rounded-full transition-colors ${isTtsEnabled ? 'bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400'}`}
                            aria-label={isTtsEnabled ? "Disable voice output" : "Enable voice output"}
                            title={isTtsEnabled ? "Disable voice output" : "Enable voice output"}
                            disabled={voiceState !== 'idle'}
                        >
                            {isTtsEnabled ? <SpeakerWaveIcon className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} /> : <SpeakerXMarkIcon className="w-6 h-6" />}
                        </button>
                        {getVoiceButton()}
                        <button onClick={handleSendMessage} disabled={(!userInput.trim() && !uploadedFile) || isLoading || voiceState !== 'idle'} className="p-2.5 rounded-full bg-blue-600 text-white dark:bg-cyan-500 dark:text-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-700 dark:hover:bg-cyan-400 transition-colors" aria-label="Send message"><PaperAirplaneIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};