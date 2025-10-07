
import React, { useState, useRef, useEffect } from 'react';
import { generateMentorResponse, ai, generateChartImage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { LiveSession, Modality, LiveServerMessage, Blob } from '@google/genai';
import { ChartDisplay } from './ChartDisplay';

// --- Types ---
interface Message {
    id: number;
    role: 'user' | 'model';
    text: string;
    image?: string; // base64 data URL
    isImageLoading?: boolean;
}
type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

// --- Constants ---
const CHAT_HISTORY_KEY = 'aiMentorChatHistory';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
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
    const lines = text.split('\n').filter(p => p.trim() !== '');
    const renderInlineMarkdown = (lineText: string) => lineText.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-cyan-300">{part}</strong> : part
    );
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
        if (isListItem) listItems.push(<li key={index}>{renderInlineMarkdown(trimmedLine.substring(2))}</li>);
        else { flushListItems(); elements.push(<p key={index} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>); }
    });
    flushListItems();
    return <>{elements}</>;
};

export const AIMentorView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

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
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat history to localStorage", error);
            }
        }
    }, [messages]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, currentInputTranscription, currentOutputTranscription]);

    const handleSendMessage = async () => {
        if ((!userInput.trim() && !uploadedImage) || isLoading) return;

        setError(null);
        const userMessage: Message = { id: Date.now(), role: 'user', text: userInput.trim(), ...(uploadedImage && { image: uploadedImage }) };
        setMessages(prev => [...prev, userMessage]);
        
        setIsLoading(true);
        setUserInput('');
        setUploadedImage(null);

        try {
            const responseText = await generateMentorResponse(userMessage.text, userMessage.image);
            
            const chartRegex = /\[CHART:\s*(.*?)\]/s;
            const chartMatch = responseText.match(chartRegex);
            const cleanText = responseText.replace(chartRegex, '').trim();

            const modelMessageId = Date.now() + 1;
            
            const modelMessage: Message = { id: modelMessageId, role: 'model', text: cleanText, isImageLoading: !!chartMatch };
            setMessages(prev => [...prev, modelMessage]);
            
            if (chartMatch && chartMatch[1]) {
                const chartPrompt = chartMatch[1];
                try {
                    const imageUrl = await generateChartImage(chartPrompt);
                    setMessages(prev => prev.map(m => 
                        m.id === modelMessageId ? { ...m, image: imageUrl, isImageLoading: false } : m
                    ));
                } catch (chartError) {
                    console.error("Failed to generate chart requested by AI:", chartError);
                    setMessages(prev => prev.map(m => 
                        m.id === modelMessageId ? { ...m, isImageLoading: false } : m
                    ));
                }
            }
        } catch (e) {
            console.error(e);
            const errorMsg = "Sorry, I couldn't get a response from the AI Mentor. Please try again.";
            setError(errorMsg);
            setMessages(prev => [...prev, { id: Date.now(), role: 'model', text: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setUploadedImage(base64);
            } catch (err) {
                console.error("Error converting file to base64:", err);
                setError("Could not upload image. Please try a different file.");
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const stopVoiceChat = async () => {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        audioResourcesRef.current.stream?.getTracks().forEach(track => track.stop());
        audioResourcesRef.current.scriptProcessor?.disconnect();
        audioResourcesRef.current.inputAudioContext?.close();
        audioResourcesRef.current.outputAudioContext?.close();
        audioResourcesRef.current.sources.forEach(s => s.stop());

        audioResourcesRef.current = { stream: null, inputAudioContext: null, outputAudioContext: null, inputNode: null, outputNode: null, scriptProcessor: null, sources: new Set(), nextStartTime: 0 };
        setVoiceState('idle');
    };

    const handleToggleVoiceChat = async () => {
        if (voiceState === 'active' || voiceState === 'connecting') {
            stopVoiceChat();
            return;
        }

        setVoiceState('connecting');
        setError(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioResourcesRef.current.stream = stream;
            
            // FIX: Cast window to `any` to allow TypeScript to compile with the non-standard `webkitAudioContext` for broader browser compatibility.
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // FIX: Cast window to `any` to allow TypeScript to compile with the non-standard `webkitAudioContext` for broader browser compatibility.
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

                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
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
                        setError('An error occurred with the voice chat.');
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
            idle: 'bg-gray-700 text-gray-300 hover:bg-cyan-500 hover:text-gray-900',
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
            <SparklesIcon className="w-16 h-16 mx-auto text-cyan-400" />
            <h2 className="mt-4 text-3xl font-bold text-white">AI Trading Mentor</h2>
            <p className="mt-2 text-lg text-gray-400">Ask me anything about trading, or upload a chart for analysis.</p>
            <div className="mt-6 text-left max-w-md mx-auto space-y-2 text-gray-300">
                <p className="p-3 bg-gray-800/50 rounded-lg text-sm">"Explain what an FVG is in simple terms."</p>
                <p className="p-3 bg-gray-800/50 rounded-lg text-sm">"What's the difference between a BOS and a CHoCH?"</p>
                <p className="p-3 bg-gray-800/50 rounded-lg text-sm">Upload a chart and ask: "Where is the sell-side liquidity on this chart?"</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 pb-4">
                {messages.length === 0 && voiceState === 'idle' && <WelcomeScreen />}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 animate-[fade-in_0.5s_ease-out] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-cyan-400" /></div>}
                       <div className={`w-full max-w-lg p-4 rounded-xl ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gray-800/50'}`}>
                           {(msg.image || msg.isImageLoading) && (
                               <ChartDisplay
                                   imageUrl={msg.image || ''}
                                   isLoading={msg.isImageLoading || false}
                                   loadingText={msg.role === 'model' ? "AI is generating a chart..." : "Loading..."}
                                   containerClassName="mb-3 rounded-lg overflow-hidden border border-gray-600 hover:border-cyan-500/50 transition-colors"
                               />
                           )}
                           {msg.text && <div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={msg.text} /></div>}
                       </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-cyan-400" /></div>
                        <div className="w-full max-w-lg p-4 rounded-xl bg-gray-800/50 flex items-center space-x-2"><LoadingSpinner /><span className="text-gray-400 text-sm">AI Mentor is thinking...</span></div>
                    </div>
                )}
                 {error && <div className="text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</div>}
                 {voiceState !== 'idle' && (
                    <div className="sticky bottom-0 bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400"><strong>You:</strong> {currentInputTranscription}<span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse"></span></p>
                        <p className="text-sm text-cyan-300 mt-1"><strong>Mentor:</strong> {currentOutputTranscription}</p>
                    </div>
                )}
            </div>
            
            <div className="mt-2 flex-shrink-0">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-2 flex flex-col">
                    {uploadedImage && (
                         <div className="p-2 relative w-fit">
                            <img src={uploadedImage} alt="Preview" className="max-h-24 w-auto rounded-md" />
                            <button onClick={() => setUploadedImage(null)} className="absolute -top-1 -right-1 bg-gray-600 rounded-full p-0.5 text-white hover:bg-red-500"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className="flex items-end space-x-2">
                        <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask the AI Mentor..." className="flex-1 bg-transparent p-2 text-gray-200 resize-none focus:outline-none placeholder-gray-500" rows={1} disabled={voiceState !== 'idle'}/>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-cyan-400 rounded-full hover:bg-gray-700 transition-colors" aria-label="Upload chart" title="Upload chart" disabled={voiceState !== 'idle'}><PhotoIcon className="w-6 h-6" /></button>
                        {getVoiceButton()}
                        <button onClick={handleSendMessage} disabled={(!userInput.trim() && !uploadedImage) || isLoading || voiceState !== 'idle'} className="p-2.5 rounded-full bg-cyan-500 text-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors" aria-label="Send message"><PaperAirplaneIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
