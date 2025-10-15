import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

// Let TypeScript know about the global emailjs object
declare const emailjs: any;

const EMAILJS_SERVICE_ID = 'service_bvaub18';
const EMAILJS_TEMPLATE_ID = 'template_bw3ct2d';
const EMAILJS_PUBLIC_KEY = 'evDNrr84GpSJNCGSi';


interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackCategory = 'bug' | 'feature' | 'content' | 'ui' | 'general';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const [category, setCategory] = useState<FeedbackCategory>('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        // The check for placeholder credentials was causing a TypeScript error because the
        // constants have been assigned with actual values, making the check redundant.
        // The try/catch block below will handle runtime errors with the EmailJS service.

        setIsSubmitting(true);
        setError(null);

        const templateParams = {
            category: category,
            message: message,
        };

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, {
                publicKey: EMAILJS_PUBLIC_KEY,
            });
            
            setIsSubmitting(false);
            setIsSubmitted(true);
            setMessage('');
            setCategory('general');

            setTimeout(() => {
                onClose();
                setTimeout(() => setIsSubmitted(false), 500);
            }, 2000);

        } catch (err) {
            console.error('Failed to send feedback via EmailJS:', err);
            setIsSubmitting(false);
            setError('Could not send your feedback. Please check your EmailJS configuration and try again later.');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={onClose}
            aria-labelledby="feedback-modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                {isSubmitted ? (
                    <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-[--color-signal-green] mb-4" />
                        <h2 className="text-2xl font-bold text-[--color-ghost-white]">Thank You!</h2>
                        <p className="mt-2 text-[--color-muted-grey]">Your feedback has been received. We appreciate you helping us improve.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 id="feedback-modal-title" className="text-2xl font-bold text-[--color-ghost-white] flex items-center">
                                <ChatBubbleBottomCenterTextIcon className="w-8 h-8 mr-3 text-[--color-neural-blue]" />
                                Share Your Feedback
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full text-[--color-muted-grey] hover:bg-[--color-obsidian-slate]" aria-label="Close">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-[--color-muted-grey] mb-6">
                            We're constantly working to improve Forex TA Pro. Let us know what you think!
                        </p>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">
                                        Feedback Category
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                                        className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-md py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]"
                                    >
                                        <option value="general">General Feedback</option>
                                        <option value="bug">Bug Report</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="content">Lesson Content</option>
                                        <option value="ui">UI/UX Suggestion</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">
                                        Your Message
                                    </label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={5}
                                        placeholder="Please be as detailed as possible..."
                                        className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-md py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]"
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="mt-4 p-3 bg-[--color-warning-red]/10 border border-[--color-warning-red]/30 rounded-lg text-sm text-[--color-warning-red] flex items-center">
                                    <ExclamationTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-[--color-neural-blue] text-[--color-obsidian-slate] font-semibold rounded-md shadow-sm hover:bg-[--color-neural-blue]/80 disabled:bg-[--color-border] disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <LoadingSpinner /> : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};