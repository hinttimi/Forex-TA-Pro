import React, { useState, useEffect, useLayoutEffect } from 'react';

interface TourStep {
    selector: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        selector: '#tour-step-1-sidebar',
        title: 'Welcome to Forex TA Pro!',
        content: "This is your curriculum sidebar. You can navigate through all the modules and lessons here.",
        position: 'right',
    },
    {
        selector: '#tour-step-2-content',
        title: 'Main Content Area',
        content: "Your selected lesson, practice tool, or dashboard will appear in this main area.",
        position: 'bottom',
    },
    {
        selector: '#tour-step-3-mentor',
        title: 'Your AI Mentor',
        content: "Click here any time to chat with your AI mentor. Ask questions, get feedback on charts, or request real-time market info.",
        position: 'top',
    },
    {
        selector: '#tour-step-4-visualize',
        title: 'Visualize Concepts',
        content: "In lessons, you can ask the AI to generate a chart to help you visualize the concept you're learning.",
        position: 'bottom',
    },
];


const WelcomeTour: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [highlightStyle, setHighlightStyle] = useState({});
    const [tooltipStyle, setTooltipStyle] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    const currentStep = TOUR_STEPS[stepIndex];

    useLayoutEffect(() => {
        if (!currentStep) return;

        // Special handling for the mentor, which might be hidden on desktop
        const isMentorStep = currentStep.selector === '#tour-step-3-mentor';
        const element = document.querySelector(currentStep.selector);

        if (element) {
            const rect = element.getBoundingClientRect();
            const padding = 10;
            
            setHighlightStyle({
                top: `${rect.top - padding}px`,
                left: `${rect.left - padding}px`,
                width: `${rect.width + (padding * 2)}px`,
                height: `${rect.height + (padding * 2)}px`,
            });
            
            let top, left;
            switch(currentStep.position) {
                case 'right':
                    top = rect.top;
                    left = rect.right + 15;
                    break;
                case 'left':
                    top = rect.top;
                    left = rect.left - 320 - 15;
                    break;
                case 'top':
                     top = rect.top - 150; // Approximation
                     left = rect.left;
                    break;
                case 'bottom':
                default:
                    top = rect.bottom + 15;
                    left = rect.left;
                    break;
            }
             setTooltipStyle({ top: `${top}px`, left: `${left}px` });

            setIsVisible(true);
        } else {
            // If element is not found (e.g., on a different view), skip to next step
            if(stepIndex < TOUR_STEPS.length - 1) {
                 setStepIndex(s => s + 1);
            } else {
                onClose();
            }
        }
    }, [stepIndex, currentStep, onClose]);
    
    const handleNext = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (stepIndex < TOUR_STEPS.length - 1) {
                setStepIndex(stepIndex + 1);
            } else {
                onClose();
            }
        }, 300);
    };

    const handleSkip = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!currentStep) return null;

    return (
        <div style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s' }}>
            <div className="tour-highlight" style={highlightStyle}></div>
            <div className="tour-tooltip" style={tooltipStyle}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{currentStep.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{currentStep.content}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{stepIndex + 1} / {TOUR_STEPS.length}</span>
                    <div>
                        <button onClick={handleSkip} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white mr-4">Skip</button>
                        <button onClick={handleNext} className="px-4 py-1.5 bg-blue-600 text-white dark:bg-cyan-500 dark:text-slate-900 text-sm font-semibold rounded-md">
                            {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { WelcomeTour };