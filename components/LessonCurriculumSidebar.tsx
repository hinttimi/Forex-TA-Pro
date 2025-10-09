import React, { useState } from 'react';
import { Module, Lesson } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface LessonCurriculumSidebarProps {
  modules: Module[];
  selectedLessonKey: string;
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: Set<string>;
}

export const LessonCurriculumSidebar: React.FC<LessonCurriculumSidebarProps> = ({
  modules,
  selectedLessonKey,
  onSelectLesson,
  completedLessons
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const currentModule = modules.find(m => m.lessons.some(l => l.key === selectedLessonKey));
    return new Set(currentModule ? [currentModule.title] : []);
  });

  const toggleModule = (title: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-sm dark:shadow-none">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2 mb-4">Course Content</h3>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {modules.map(module => {
          const isExpanded = expandedModules.has(module.title);
          const completedInModule = module.lessons.filter(l => completedLessons.has(l.key)).length;
          const totalInModule = module.lessons.length;

          return (
            <div key={module.title}>
              <button
                onClick={() => toggleModule(module.title)}
                className="w-full flex flex-col p-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                aria-expanded={isExpanded}
              >
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{module.title}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{completedInModule} / {totalInModule} completed</div>
              </button>
              {isExpanded && (
                <ul className="pl-2 pr-1 pt-1 space-y-1">
                  {module.lessons.map(lesson => {
                    const isSelected = lesson.key === selectedLessonKey;
                    const isCompleted = completedLessons.has(lesson.key);
                    return (
                      <li key={lesson.key}>
                        <button
                          onClick={() => onSelectLesson(lesson)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors flex items-start ${
                            isSelected ? 'bg-blue-100 text-blue-800 dark:bg-cyan-500/10 dark:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/70'
                          }`}
                        >
                          <CheckCircleIcon className={`w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 ${isCompleted ? 'text-blue-500 dark:text-cyan-400' : 'text-slate-300 dark:text-slate-600'}`} />
                          <span>{lesson.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};