import React from 'react';
import { NewsArticle } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { LinkIcon } from './icons/LinkIcon';
import { useApiKey } from '../hooks/useApiKey';
import { useMarketIntel } from '../hooks/useMarketIntel';

export const NewsFeedView: React.FC = () => {
    const { news, loading, errors, refreshNews } = useMarketIntel();
    const { apiKey, openKeyModal } = useApiKey();

    const renderContent = () => {
        if (loading.news && news.articles.length === 0) { // Only show full-page spinner on initial load
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-slate-300">Fetching the latest market news...</p>
                </div>
            );
        }

        if (errors.news) {
            return (
                <div className="max-w-2xl mx-auto text-center">
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400" />
                        <h2 className="mt-4 text-2xl font-bold text-white">Could Not Load News</h2>
                        <p className="mt-2 text-red-300">{errors.news}</p>
                    </div>
                     <button onClick={refreshNews} className="mt-6 inline-flex items-center px-6 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600">
                        <ArrowPathIcon className="w-5 h-5 mr-2" />
                        Try Again
                    </button>
                    {!apiKey && (
                         <button onClick={openKeyModal} className="mt-4 text-sm text-cyan-400 underline hover:text-cyan-300">
                            Set API Key
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {news.articles.map((article, index) => (
                    <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 shadow-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20 animate-[fade-in_0.5s_ease-out]" style={{ animationDelay: `${index * 100}ms` }}>
                        <h3 className="text-xl font-bold text-white">{article.headline}</h3>
                        <p className="text-slate-300 mt-2 text-base leading-relaxed">{article.summary}</p>
                        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Read full article on {article.sourceTitle || 'the source'}
                        </a>
                    </div>
                ))}

                {news.sources.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-slate-700">
                         <h4 className="text-lg font-semibold text-slate-300 mb-3">Sources</h4>
                         <ul className="list-disc list-inside space-y-2">
                             {news.sources.map((chunk, index) => chunk.web && (
                                <li key={index} className="text-sm text-slate-400">
                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline" title={chunk.web.title}>
                                       {chunk.web.title}
                                    </a>
                                </li>
                             ))}
                         </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center">
                        <NewspaperIcon className="w-9 h-9 mr-3 text-cyan-400" />
                        Forex News Feed
                    </h1>
                    {news.lastUpdated && !loading.news && (
                        <p className="text-slate-500 text-sm mt-1">
                            Last updated: {news.lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                 <button 
                    onClick={refreshNews} 
                    className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                    disabled={loading.news}
                >
                    <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading.news ? 'animate-spin' : ''}`} />
                    Refresh News
                </button>
            </div>
            {renderContent()}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};