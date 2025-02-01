interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
  };
}

const API_KEY = '09712e264e2fe621ee1ec1c4';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Cache exchange rates to avoid excessive API calls
let exchangeRatesCache: {
  [key: string]: {
    rates: { [key: string]: number };
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // If currencies are the same, return original amount
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return amount * rate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Return original amount if conversion fails
    return amount;
  }
};

const getExchangeRates = async (baseCurrency: string): Promise<{ [key: string]: number }> => {
  // Check cache first
  const cachedData = exchangeRatesCache[baseCurrency];
  if (
    cachedData &&
    Date.now() - cachedData.timestamp < CACHE_DURATION
  ) {
    return cachedData.rates;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/latest/${baseCurrency}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    // Cache the new rates
    exchangeRatesCache[baseCurrency] = {
      rates: data.conversion_rates,
      timestamp: Date.now(),
    };

    return data.conversion_rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw error;
  }
}; 