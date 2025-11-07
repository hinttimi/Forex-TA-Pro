import React, { useState, useRef, useEffect } from 'react';
// FIX: The function generateChatResponse does not exist. It has been replaced with generateMentorResponse, which serves a similar purpose.
import { generateMentorResponse } from '../services/geminiService';
import { useApiKey } from '../hooks/useApiKey';
import { LoadingSpinner } from './LoadingSpinner';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
// FIX: MENTOR_PERSONAS is needed to provide a default persona for the AI model.
import { MENTOR_PERSONAS } from '../constants/mentorSettings';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const regex = /\*\*(.*?)\*\*/g;
        let match;
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-cyan-400">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) parts.push(text.substring(lastIndex));
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

export const ChatbotView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { apiKey, openKeyModal } = useApiKey();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        if (!apiKey) {
            openKeyModal();
            return;
        }

        setError(null);
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput.trim() }] };
        setMessages(prev => [...prev, userMessage]);
        
        setIsLoading(true);
        const currentInput = userInput;
        setUserInput('');

        try {
            // FIX: Replaced the non-existent generateChatResponse with generateMentorResponse.
            // Provided an empty array for completed lessons and a default persona as this is a simple chatbot.
            // Extracted the .text property from the response object.
            const response = await generateMentorResponse(apiKey, currentInput, [], MENTOR_PERSONAS[0].id);
            const responseText = response.text;
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
            console.error(e);
            setError("Sorry, I couldn't get a response. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const WelcomeScreen = () => (
        <div className="text-center m-auto">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-cyan-400" />
            <h2 className="mt-4 text-3xl font-bold text-white">AI Chatbot</h2>
            <p className="mt-2 text-lg text-slate-400">Ask a quick question and get a response from Gemini.</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col max-w-3xl mx-auto">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 pb-4">
                {messages.length === 0 && <WelcomeScreen />}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 animate-[fade-in_0.5s_ease-out] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-cyan-400" /></div>}
                       <div className={`w-full max-w-lg p-4 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-slate-700' : 'bg-slate-800'}`}>
                           <div className="prose prose-invert prose-sm max-w-none text-slate-200"><FormattedContent text={msg.parts[0].text} /></div>
                       </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-cyan-400" /></div>
                        <div className="w-full max-w-lg p-4 rounded-xl bg-slate-800 flex items-center space-x-2"><LoadingSpinner /><span className="text-slate-400 text-sm">Thinking...</span></div>
                    </div>
                )}
                 {error && <div className="text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</div>}
            </div>
            
            <div className="mt-2 flex-shrink-0">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 flex items-end space-x-2">
                    <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question..." className="flex-1 bg-transparent p-2 text-slate-200 resize-none focus:outline-none placeholder-slate-500" rows={1} />
                    <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading} className="p-2.5 rounded-full bg-cyan-500 text-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors" aria-label="Send message"><PaperAirplaneIcon className="w-6 h-6" /></button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};