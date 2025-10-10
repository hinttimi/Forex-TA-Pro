import React, { useState, useMemo } from 'react';
import { LearningPath, Lesson, AppView } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { PlayIcon } from './icons/PlayIcon';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { SignalIcon } from './icons/SignalIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BookmarkSquareIcon } from './icons/BookmarkSquareIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

interface SidebarProps {
  learningPaths: LearningPath[];
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonKey?: string;
  currentView: AppView;
  onSetView: (view: AppView) => void;
  completedLessons: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedbackModal: () => void;
}

interface NavLinkProps {
  label: string;
  view: AppView;
  icon: React.FC<{className?: string}>;
  currentView: AppView;
  onClick: (view: AppView) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ label, view, icon: Icon, currentView, onClick }) => {
    const isSelected = currentView === view;
    return (
        <li>
            <button
                onClick={() => onClick(view)}
                className={`w-full text-left flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 font-medium ${
                isSelected
                    ? 'bg-[--color-neural-blue]/10 text-[--color-neural-blue]'
                    : 'text-[--color-ghost-white]/70 hover:bg-[--color-dark-matter]/70 hover:text-[--color-ghost-white]'
                }`}
            >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isSelected ? 'text-[--color-neural-blue]' : 'text-[--color-muted-grey]'}`} />
                <span>{label}</span>
            </button>
        </li>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ learningPaths, onSelectLesson, selectedLessonKey, currentView, onSetView, completedLessons, isOpen, onClose, onOpenFeedbackModal }) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
      const currentModule = learningPaths.flatMap(p => p.modules).find(m => m.lessons.some(l => l.key === selectedLessonKey));
      return new Set(currentModule ? [currentModule.title] : [learningPaths[0]?.modules[0]?.title].filter(Boolean));
  });

  const [searchQuery, setSearchQuery] = useState('');

  const allLessons = useMemo(() => learningPaths.flatMap(path => path.modules.flatMap(module => module.lessons.map(lesson => ({ ...lesson, moduleTitle: module.title })))), [learningPaths]);

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLessons.filter(lesson => lesson.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, allLessons]);
  
  const handleSearchResultClick = (lesson: Lesson) => {
    onSelectLesson(lesson);
    setSearchQuery('');
  };

  const toggleModule = (title: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      newSet.has(title) ? newSet.delete(title) : newSet.add(title);
      return newSet;
    });
  };

  const practiceTools = [
      { label: 'AI Mentor', view: 'mentor', icon: SparklesIcon },
      { label: 'Trade Simulator', view: 'simulator', icon: RocketLaunchIcon },
      { label: 'Live Chart Simulator', view: 'live_simulator', icon: PlayIcon },
      { label: 'AI Strategy Lab', view: 'backtester', icon: BeakerIcon },
      { label: 'Pattern Recognition', view: 'pattern', icon: EyeIcon },
      { label: 'Timed Challenges', view: 'timed', icon: ClockIcon },
      { label: 'Free Practice Canvas', view: 'canvas', icon: PencilSquareIcon },
  ];

  const marketTools = [
      { label: 'Market Dynamics', view: 'market_dynamics', icon: GlobeAltIcon },
      { label: 'Market Pulse', view: 'market_pulse', icon: SignalIcon },
      { label: 'News Feed', view: 'news_feed', icon: NewspaperIcon },
      { label: 'Market Analyzer', view: 'market_analyzer', icon: MagnifyingGlassChartIcon },
      { label: 'AI Calendar', view: 'economic_calendar', icon: CalendarDaysIcon },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-[--color-dark-matter] p-6 flex flex-col overflow-y-auto border-r border-[--color-border] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8 text-[--color-neural-blue]" />
            <h1 className="text-2xl font-bold tracking-tight text-[--color-ghost-white]">Forex TA Pro</h1>
        </div>
        <button onClick={onClose} className="p-1 text-[--color-muted-grey] rounded-full hover:bg-[--color-dark-matter] hover:text-[--color-ghost-white] md:hidden" aria-label="Close sidebar">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="relative mb-4 flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-[--color-muted-grey]" />
        </div>
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[--color-obsidian-slate] border-[--color-border] text-[--color-ghost-white] placeholder-[--color-muted-grey] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-[--color-neural-blue] focus:border-[--color-neural-blue]"
        />
      </div>

      <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-6">
        {searchQuery.trim() ? (
            <div className="space-y-1">
                <h3 className="px-3 py-2 text-xs font-semibold text-[--color-muted-grey] uppercase">Search Results</h3>
                {filteredLessons.length > 0 ? (
                    <ul>
                        {filteredLessons.map(lesson => (
                            <li key={lesson.key}>
                                <button onClick={() => handleSearchResultClick(lesson)} className="w-full text-left flex flex-col px-3 py-2 rounded-lg transition-colors duration-150 text-[--color-ghost-white]/80 hover:bg-[--color-dark-matter]/70 hover:text-[--color-ghost-white]">
                                    <span className="text-sm font-medium text-[--color-ghost-white]">{lesson.title}</span>
                                    <span className="text-xs text-[--color-muted-grey]">{lesson.moduleTitle}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-[--color-muted-grey] text-sm p-4">No lessons found.</p>}
            </div>
        ) : (
          <>
            <nav>
                <ul className="space-y-1">
                    <NavLink label="Dashboard" view="dashboard" icon={HomeIcon} currentView={currentView} onClick={onSetView} />
                </ul>
            </nav>
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-[--color-muted-grey] uppercase">Course Curriculum</h3>
              <nav className="space-y-1 mt-1">
                {learningPaths.map((path) => (
                    path.isFoundation && path.modules.map((module) => {
                        const isExpanded = expandedModules.has(module.title);
                        const totalInModule = module.lessons.length;
                        const completedInModule = module.lessons.filter(l => completedLessons.has(l.key)).length;
                        const progress = totalInModule > 0 ? (completedInModule / totalInModule) * 100 : 0;
                        
                        return (
                        <div key={module.title}>
                            <button onClick={() => toggleModule(module.title)} className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-[--color-ghost-white] hover:bg-[--color-dark-matter]/50 rounded-lg transition-colors" aria-expanded={isExpanded}>
                                <span className="flex items-center"><BookOpenIcon className="w-5 h-5 mr-3 text-[--color-muted-grey]" />{module.title}</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 text-[--color-muted-grey] ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                              <div className="pl-6 pr-1 py-2">
                                    <div className="flex justify-between text-xs text-[--color-muted-grey] mb-1">
                                        <span>Progress</span>
                                        <span>{completedInModule}/{totalInModule}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1">
                                        <div className="bg-[--color-focus-gold] h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <ul className="space-y-1 pt-2">
                                        {module.lessons.map((lesson) => (
                                        <li key={lesson.key}>
                                            <button onClick={() => onSelectLesson(lesson)} className={`w-full text-left flex items-start p-2 text-sm rounded-md transition-colors duration-150 ${selectedLessonKey === lesson.key && currentView === 'lesson' ? 'bg-[--color-neural-blue]/10 text-[--color-neural-blue]' : 'text-[--color-ghost-white]/80 hover:bg-[--color-dark-matter]/70'}`}>
                                                <CheckCircleIcon className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${completedLessons.has(lesson.key) ? 'text-[--color-focus-gold]' : 'text-slate-600'}`} />
                                                <span>{lesson.title}</span>
                                            </button>
                                        </li>
                                        ))}
                                    </ul>
                              </div>
                            </div>
                        </div>
                        )
                    })
                ))}
              </nav>
            </div>
             <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-[--color-muted-grey] uppercase">Tools & Practice</h3>
                <ul className="space-y-1 mt-1">
                    {practiceTools.map(tool => <NavLink key={tool.view} {...tool} currentView={currentView} onClick={onSetView} />)}
                    {marketTools.map(tool => <NavLink key={tool.view} {...tool} currentView={currentView} onClick={onSetView} />)}
                </ul>
            </div>
             <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-[--color-muted-grey] uppercase">Profile</h3>
                <ul className="space-y-1 mt-1">
                    <NavLink label="Trading Journal" view="trading_journal" icon={ClipboardDocumentListIcon} currentView={currentView} onClick={onSetView} />
                    <NavLink label="My Trading Plan" view="trading_plan" icon={DocumentTextIcon} currentView={currentView} onClick={onSetView} />
                    <NavLink label="Saved Analysis" view="saved" icon={BookmarkSquareIcon} currentView={currentView} onClick={onSetView} />
                    <NavLink label="Achievements" view="achievements" icon={TrophyIcon} currentView={currentView} onClick={onSetView} />
                </ul>
            </div>
          </>
        )}
      </div>

      <div className="flex-shrink-0 pt-6 mt-auto border-t border-[--color-border] space-y-1">
        <ul className="space-y-1">
            <li>
                <button onClick={onOpenFeedbackModal} className="w-full text-left flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 font-medium text-[--color-ghost-white]/80 hover:bg-[--color-dark-matter]/70 hover:text-[--color-ghost-white]">
                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-3 flex-shrink-0 text-[--color-muted-grey]" />
                    <span>Provide Feedback</span>
                </button>
            </li>
            <NavLink label="Settings" view="settings" icon={Cog6ToothIcon} currentView={currentView} onClick={onSetView} />
        </ul>
      </div>
    </aside>
  );
};