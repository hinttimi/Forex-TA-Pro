import { useContext } from 'react';
import { MarketIntelContext } from '../context/MarketIntelContext';

export const useMarketIntel = () => {
  const context = useContext(MarketIntelContext);
  if (context === undefined) {
    throw new Error('useMarketIntel must be used within a MarketIntelProvider');
  }
  return context;
};
