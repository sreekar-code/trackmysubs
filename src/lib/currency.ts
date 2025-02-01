interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRates> => {
  const now = Date.now();
  
  // Return cached rates if they're still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/09712e264e2fe621ee1ec1c4/latest/${baseCurrency}`
    );
    const data = await response.json();
    
    if (data.result === 'success') {
      cachedRates = data.conversion_rates;
      lastFetchTime = now;
      return data.conversion_rates;
    } else {
      throw new Error('Failed to fetch exchange rates');
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await fetchExchangeRates(fromCurrency);
  const rate = rates[toCurrency];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  return amount * rate;
}; 