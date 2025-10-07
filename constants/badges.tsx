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
    QuizMasterIcon
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
    description: 'Complete all lessons in Level 1.',
    icon: FoundationIcon,
  },
  {
    id: 'structure-expert',
    title: 'Structure Expert',
    description: 'Complete all lessons in Level 2.',
    icon: StructureExpertIcon,
  },
  {
    id: 'liquidity-hunter',
    title: 'Liquidity Hunter',
    description: 'Complete all lessons in Level 3.',
    icon: LiquidityHunterIcon,
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Score 80% or higher on a lesson quiz.',
    icon: QuizMasterIcon,
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