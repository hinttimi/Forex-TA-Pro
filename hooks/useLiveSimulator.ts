import { useContext } from 'react';
import { LiveSimulatorContext } from '../context/LiveSimulatorContext';

export const useLiveSimulator = () => {
  const context = useContext(LiveSimulatorContext);
  if (context === undefined) {
    throw new Error('useLiveSimulator must be used within a LiveSimulatorProvider');
  }
  return context;
};
