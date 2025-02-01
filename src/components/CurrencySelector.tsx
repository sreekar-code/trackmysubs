import React from 'react';
import { useCurrency, currencies } from '../contexts/CurrencyContext';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="block w-24 sm:w-auto rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      {Object.entries(currencies).map(([code, { name }]) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
};

export default CurrencySelector;