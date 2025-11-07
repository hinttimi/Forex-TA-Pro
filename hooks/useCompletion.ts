import { useContext } from 'react';
import { CompletionContext, CountableEvent } from '../context/CompletionContext';

export const useCompletion = () => {
  const context = useContext(CompletionContext);
  if (!context) {
    throw new Error('useCompletion must be used within a CompletionProvider');
  }

  const { incrementCount, ...rest } = context;

  const logTradeLogged = () => incrementCount('loggedTrades');

  return { 
    ...rest,
    logTradeLogged,
  };
};