interface ExchangeRateResponse {
  result: string;
  conversion_rates: {
    [key: string]: number;
  };
}

class CurrencyService {
  private exchangeRates: { [key: string]: number } = {};
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 1000 * 60 * 60; // 1 hour

  private async updateExchangeRates(): Promise<void> {
    try {
      const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
      if (!apiKey) {
        console.warn('Exchange rate API key not found. Using fallback rates.');
        this.exchangeRates = {
          USD: 1,
          EUR: 1.08,
          GBP: 1.27,
          JPY: 0.0067,
          AUD: 0.66,
          CAD: 0.74,
          INR: 0.012,
        };
        return;
      }

      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      );
      const data: ExchangeRateResponse = await response.json();
      
      if (data.result === 'success') {
        this.exchangeRates = data.conversion_rates;
        this.lastUpdate = Date.now();
      } else {
        throw new Error('Failed to fetch exchange rates');
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      // Use fallback rates if API call fails
      this.exchangeRates = {
        USD: 1,
        EUR: 1.08,
        GBP: 1.27,
        JPY: 0.0067,
        AUD: 0.66,
        CAD: 0.74,
        INR: 0.012,
      };
    }
  }

  private async ensureRatesUpdated(): Promise<void> {
    if (Date.now() - this.lastUpdate > this.UPDATE_INTERVAL) {
      await this.updateExchangeRates();
    }
  }

  public async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    await this.ensureRatesUpdated();
    
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first (base currency)
    const amountInUSD = amount / this.exchangeRates[fromCurrency];
    // Then convert to target currency
    return amountInUSD * this.exchangeRates[toCurrency];
  }

  public formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

export const currencyService = new CurrencyService(); 