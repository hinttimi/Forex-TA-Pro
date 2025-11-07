import React, { useState, useRef, useCallback } from 'react';
import { analyzeGeneralImage } from '../services/geminiService';
import { useApiKey } from '../hooks/useApiKey';
import { LoadingSpinner } from './LoadingSpinner';
import { PhotoIcon } from './icons/PhotoIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { UploadedFile } from '../types';

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

export const ImageAnalyzerView: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { apiKey, openKeyModal } = useApiKey();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAnalyze = async () => {
        if (!apiKey) { setError("Please set your Gemini API key."); openKeyModal(); return; }
        if (!uploadedFile) { setError("Please upload an image to analyze."); return; }

        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const result = await analyzeGeneralImage(apiKey, prompt, uploadedFile);
            setAnalysis(result);
        } catch(e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
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
                console.error("Error reading file:", err);
                setError("Could not read the uploaded file.");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const reset = () => {
        setUploadedFile(null);
        setPrompt('');
        setAnalysis('');
        setError('');
        setIsLoading(false);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Image Analyzer</h1>
            <p className="text-[--color-muted-grey] mb-8">Upload any image and ask the AI to analyze it for you.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold text-white mb-2">1. Upload an Image</label>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        
                        {uploadedFile ? (
                             <div className="relative group">
                                <img src={`data:${uploadedFile.mimeType};base64,${uploadedFile.data}`} alt="Upload preview" className="w-full h-auto object-cover rounded-lg border-2 border-[--color-border]" />
                                <button onClick={() => setUploadedFile(null)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                             <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center p-10 bg-[--color-dark-matter] border-2 border-dashed border-[--color-border] rounded-lg hover:border-cyan-500 transition-colors">
                                <PhotoIcon className="w-12 h-12 text-gray-500" />
                                <span className="mt-2 text-sm font-semibold text-gray-400">Click to upload an image</span>
                            </button>
                        )}
                    </div>

                    <div>
                         <label htmlFor="prompt" className="block text-lg font-semibold text-white mb-2">2. What should I look for?</label>
                         <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder='e.g., "Describe this scene," or "What patterns do you see?"' rows={3} className="w-full p-3 bg-[--color-dark-matter] border border-[--color-border] rounded-lg text-gray-300 focus:ring-2 focus:ring-cyan-500" />
                    </div>

                     <button onClick={handleAnalyze} disabled={isLoading || !uploadedFile} className="w-full py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-slate-600 flex items-center justify-center"><SparklesIcon className="w-6 h-6 mr-2" />Analyze Image</button>

                </div>
                {/* Output Panel */}
                <div className="bg-[--color-dark-matter]/50 border border-[--color-border] rounded-lg p-6 min-h-[400px] flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-4">AI Analysis</h2>
                    {isLoading && <div className="m-auto text-center"><LoadingSpinner /><p className="mt-3 text-[--color-muted-grey]">Analyzing image...</p></div>}
                    {error && <div className="m-auto text-center"><p className="text-red-400 bg-red-500/10 p-4 rounded-md">{error}</p></div>}
                    {!isLoading && !error && !analysis && <div className="m-auto text-center"><p className="text-slate-500">Analysis will appear here.</p></div>}
                    {analysis && <div className="prose prose-invert prose-sm max-w-none text-gray-300 animate-[fade-in_0.5s]"><FormattedContent text={analysis} /></div>}
                     {analysis && <button onClick={reset} className="mt-auto w-full py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-500">Analyze Another Image</button>}
                </div>

            </div>
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};
