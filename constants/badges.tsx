import React from 'react';
import { Badge } from '../types';
import { 
    FirstStepIcon, 
    FoundationIcon, 
    StructureExpertIcon,
    LiquidityHunterIcon,
    SharpEyeIcon,
    BeatTheClockIcon,
    SimulatorApprenticeIcon,
    ArchivistIcon,
    QuizMasterIcon,
    JournalStarterIcon,
    ConsistentLoggerIcon,
} from '../components/icons/badges/icons';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your very first lesson.',
    icon: FirstStepIcon,
  },
  {
    id: 'foundation-builder',
    title: 'Foundation Builder',
    description: 'Complete all lessons in the Universal Foundation.',
    icon: FoundationIcon,
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Score 80% or higher on a lesson quiz.',
    icon: QuizMasterIcon,
  },
  {
    id: 'journal-starter',
    title: 'Journal Starter',
    description: 'Log your first trade in the Trading Journal.',
    icon: JournalStarterIcon,
  },
  {
    id: 'consistent-logger',
    title: 'Consistent Logger',
    description: 'Log 10 trades in your Trading Journal.',
    icon: ConsistentLoggerIcon,
  },
  {
    id: 'sharp-eye',
    title: 'Sharp Eye',
    description: 'Correctly identify 10 patterns in Pattern Recognition.',
    icon: SharpEyeIcon,
  },
  {
    id: 'beat-the-clock',
    title: 'Beat the Clock',
    description: 'Successfully complete a Timed Challenge.',
    icon: BeatTheClockIcon,
  },
  {
    id: 'simulator-apprentice',
    title: 'Simulator Apprentice',
    description: 'Complete 5 scenarios in the Trade Simulator.',
    icon: SimulatorApprenticeIcon,
  },
  {
    id: 'archivist',
    title: 'Archivist',
    description: 'Save 3 of your analyses from the Trade Simulator.',
    icon: ArchivistIcon,
  },
];