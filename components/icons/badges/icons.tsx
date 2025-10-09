

import React from 'react';
import { BadgeShell } from './BadgeShell';

const IconWrapper: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
    <BadgeShell className={className}>
        <g stroke="#451a03" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
         {children}
        </g>
    </BadgeShell>
);

export const FirstStepIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M50,90 V70 M35,70 h30 M50,70 L70,50 M50,70 L30,50 M50,50 V10" />
    </IconWrapper>
);

export const FoundationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M10,80 H90 M15,80 V60 H85 V80 M20,60 V40 H80 V60 M25,40 V20 H75 V40 M50,20 L50,10" />
    </IconWrapper>
);

export const StructureExpertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M10 80 L30 60 L20 60 L40 40 L30 40 L50 20 L70 40 L60 40 L80 60 L70 60 L90 80" />
    </IconWrapper>
);

export const LiquidityHunterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M20,70 h60 M10,50 h80 M30,30 h40 M50,10 V90 M50,50 a20,20 0 1,1 0,-0.01" />
        <text x="50" y="70" fontSize="30" fill="#451a03" textAnchor="middle" stroke="none">$</text>
    </IconWrapper>
);

export const QuizMasterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M50 20 A 25 25, 0, 1, 0, 50 20 M30 40 A 20 15, 0, 0, 1, 70 40 M35 55 A 15 10, 0, 0, 1, 65 55" />
        <path d="M50 70 V 90 M 40 90 H 60" />
    </IconWrapper>
);

export const SharpEyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M10,50 Q50,20 90,50 M10,50 Q50,80 90,50" />
        <circle cx="50" cy="50" r="15" />
    </IconWrapper>
);

export const BeatTheClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <circle cx="50" cy="50" r="40" />
        <path d="M50,50 L50,20 M50,50 L75,50" />
    </IconWrapper>
);

export const SimulatorApprenticeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M50 15 L70 30 L60 35 L75 50 L65 55 L80 70 L50 85 L20 70 L35 55 L25 50 L40 35 L30 30 Z" />
    </IconWrapper>
);

export const ArchivistIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M20,10 H80 V90 H20 Z M30,20 H70 M30,35 H70 M30,50 H70 M30,65 H70" />
    </IconWrapper>
);

export const JournalStarterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M25,10 H75 V90 H25 Z M35,25 H65 M35,40 H65" />
        <path d="M45,65 H55 M50,60 V70" />
    </IconWrapper>
);

export const ConsistentLoggerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M20,20 H65 V80 H20 Z M30,30 H55" />
        <path d="M30,15 H75 V75 H30" fill="none" />
        <path d="M40,10 H85 V70 H40" fill="none" />
    </IconWrapper>
);
