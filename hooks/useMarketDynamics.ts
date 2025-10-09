import { useContext } from 'react';
import { MarketDynamicsContext } from '../context/MarketDynamicsContext';

export const useMarketDynamics = () => {
  const context = useContext(MarketDynamicsContext);
  if (context === undefined) {
    throw new Error('useMarketDynamics must be used within a MarketDynamicsProvider');
  }
  return context;
};
