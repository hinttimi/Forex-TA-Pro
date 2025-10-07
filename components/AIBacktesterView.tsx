import React, { useState, useRef } from 'react';
import { generateMentorResponse } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { useApiKey } from '../hooks/useApiKey';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

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

export const AIBacktesterView: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { apiKey, openKeyModal } = useApiKey();

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSubmit = async () => {
        if (!apiKey) {
            setError("Please set your Gemini API key to use the AI Analyst.");
            openKeyModal();
            return;
        }
        if (!uploadedImage || !prompt.trim()) {
            setError("Please upload a chart image and provide your analysis or question.");
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysis('');

        try {
            const response = await generateMentorResponse(apiKey, prompt, uploadedImage);
            setAnalysis(response);
        } catch (e) {
            console.error(e);
            setError("Failed to get analysis from the AI. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setUploadedImage(null);
        setPrompt('');
        setAnalysis('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const WelcomeScreen = () => (
         <div className="text-center h-full flex flex-col justify-center items-center bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg p-12">
            <MagnifyingGlassChartIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Upload Your Chart</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">
                Upload a screenshot from your trading platform to get an expert AI analysis on your real-world trade setups.
            </p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Chart Analyst</h1>
            <p className="text-gray-400 mb-8">Get AI-powered feedback on your real-world chart analysis and trade setups.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Left Panel: Upload and Prompt --- */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold text-white mb-2">1. Upload Your Chart Screenshot</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative flex justify-center items-center w-full h-64 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors"
                        >
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                            {uploadedImage ? (
                                <>
                                    <img src={uploadedImage} alt="Uploaded chart" className="max-w-full max-h-full object-contain rounded-md" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleClear(); }} 
                                        className="absolute top-2 right-2 p-1 bg-gray-900/70 rounded-full text-white hover:bg-red-500"
                                        aria-label="Remove image"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <PhotoIcon className="w-12 h-12 mx-auto" />
                                    <p className="mt-2">Click to upload an image</p>
                                    <p className="text-xs">PNG, JPG, or GIF</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                         <label htmlFor="prompt" className="block text-lg font-semibold text-white mb-2">2. Provide Your Analysis or Question</label>
                         <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder='e.g., "This is a 15M EUR/USD chart. I see a liquidity sweep of the previous high, followed by a CHoCH. Is the resulting order block a high-probability entry for a short?"'
                            rows={6}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                         />
                    </div>
                     {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md">{error}</p>}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSubmit} 
                            disabled={isLoading || !uploadedImage || !prompt.trim()} 
                            className="w-full py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Analyzing...' : 'Get AI Analysis'}
                        </button>
                        <button onClick={handleClear} className="py-3 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                            Clear
                        </button>
                    </div>
                </div>

                {/* --- Right Panel: AI Analysis --- */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">AI Mentor's Feedback</h3>
                    {isLoading && (
                        <div className="m-auto text-center">
                            <LoadingSpinner />
                            <p className="mt-3 text-gray-400">Analyzing your chart...</p>
                        </div>
                    )}
                    {!isLoading && !analysis && (
                        <div className="m-auto text-center text-gray-500">
                             <p>Your analysis will appear here.</p>
                        </div>
                    )}
                    {analysis && (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 overflow-y-auto flex-1 animate-[fade-in_0.5s]">
                            <FormattedContent text={analysis} />
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
             `}</style>
        </div>
    );
};
