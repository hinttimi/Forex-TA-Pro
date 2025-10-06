
import { useContext } from 'react';
import { BadgesContext } from '../context/BadgesContext';

export const useBadges = () => {
  const context = useContext(BadgesContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgesProvider');
  }
  return context;
};
