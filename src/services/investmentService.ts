import { getAuthToken } from '@/lib/cookies';
import { Contribution, Dividend, FinancialFlow, FinancialGoal, InvestmentAsset, Investor, Portfolio } from '@/types/investments';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api`;

type InvestorApi = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

type PortfolioApi = {
  id: string;
  name: string;
  user_id?: string;
  owner_name?: string;
  initial_amount: number | string;
  invested_total?: number | string;
  current_assets_total?: number | string;
  profit_total?: number | string;
  current_total?: number | string;
  created_at: string;
};

type InvestmentAssetApi = {
  id: string;
  portfolio_id: string;
  portfolio_name?: string;
  asset_name: string;
  asset_type: string;
  category?: string | null;
  broker?: string | null;
  quantity: number | string;
  average_price: number | string;
  current_price?: number | string;
  total_invested: number | string;
  current_value?: number | string;
  profit?: number | string;
  profit_percentage?: number | string;
  created_at: string;
};

type ContributionApi = {
  id: string;
  portfolio_id: string;
  portfolio_name?: string;
  investment_id?: string;
  asset_name?: string;
  type: 'aporte' | 'retirada';
  value: number | string;
  quantity?: number | string | null;
  price?: number | string | null;
  date: string;
  note?: string | null;
};

type FinancialFlowApi = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description?: string | null;
  value: number | string;
  date: string;
};

type DividendApi = {
  id: string;
  investment_id: string;
  asset_name?: string;
  portfolio_name?: string;
  value: number | string;
  date: string;
  type: string;
  notes?: string | null;
};

type FinancialGoalApi = {
  id: string;
  name: string;
  category: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date?: string | null;
  description?: string | null;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  // Não adicionar Content-Type para requisições sem body (GET, DELETE)
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: HeadersInit = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string | string[] };
        if (Array.isArray(parsed.message)) {
          throw new Error(parsed.message.join(", "));
        }
        if (parsed.message) {
          throw new Error(parsed.message);
        }
      } catch {
        throw new Error(text);
      }
    }
    throw new Error(`Erro ao acessar ${endpoint}`);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function mapInvestor(data: InvestorApi): Investor {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    status: data.is_active ? 'active' : 'inactive',
    createdAt: data.created_at,
    patrimony: 0,
  };
}

function mapPortfolio(data: PortfolioApi): Portfolio {
  const initialAmount = Number(data.initial_amount || 0);
  const investedTotal = Number(data.invested_total || 0);
  const currentTotal = Number(data.current_total || initialAmount + investedTotal);

  return {
    id: data.id,
    name: data.name,
    userId: data.user_id,
    ownerName: data.owner_name || 'Minha carteira',
    initialAmount,
    investedTotal,
    currentAssetsTotal: Number(data.current_assets_total || 0),
    profitTotal: Number(data.profit_total || 0),
    totalValue: currentTotal,
    createdAt: data.created_at,
  };
}

function mapInvestmentAsset(data: InvestmentAssetApi): InvestmentAsset {
  return {
    id: data.id,
    portfolioId: data.portfolio_id,
    portfolioName: data.portfolio_name,
    assetName: data.asset_name,
    assetType: data.asset_type,
    category: data.category || undefined,
    broker: data.broker || undefined,
    quantity: Number(data.quantity || 0),
    averagePrice: Number(data.average_price || 0),
    currentPrice: Number(data.current_price || data.average_price || 0),
    totalInvested: Number(data.total_invested || 0),
    currentValue: Number(data.current_value || 0),
    profit: Number(data.profit || 0),
    profitPercentage: Number(data.profit_percentage || 0),
    createdAt: data.created_at,
  };
}

function mapContribution(data: ContributionApi): Contribution {
  return {
    id: data.id,
    portfolioId: data.portfolio_id,
    portfolioName: data.portfolio_name,
    investmentId: data.investment_id,
    assetName: data.asset_name,
    type: data.type,
    value: Number(data.value || 0),
    quantity: data.quantity !== null && data.quantity !== undefined ? Number(data.quantity) : undefined,
    price: data.price !== null && data.price !== undefined ? Number(data.price) : undefined,
    date: data.date,
    note: data.note || undefined,
  };
}

function mapFinancialFlow(data: FinancialFlowApi): FinancialFlow {
  return {
    id: data.id,
    type: data.type,
    category: data.category,
    description: data.description || undefined,
    value: Number(data.value || 0),
    date: data.date,
  };
}

function mapDividend(data: DividendApi): Dividend {
  return {
    id: data.id,
    investmentId: data.investment_id,
    assetName: data.asset_name,
    portfolioName: data.portfolio_name,
    value: Number(data.value || 0),
    date: data.date,
    type: data.type,
    notes: data.notes || undefined,
  };
}

function mapFinancialGoal(data: FinancialGoalApi): FinancialGoal {
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    targetAmount: Number(data.target_amount || 0),
    currentAmount: Number(data.current_amount || 0),
    targetDate: data.target_date || undefined,
    description: data.description || undefined,
  };
}

export const investmentService = {
  async getInvestors(): Promise<Investor[]> {
    const response = await request<InvestorApi[]>('/investors', { method: 'GET' });
    return response.map(mapInvestor);
  },

  async createInvestor(data: { name: string; email: string }): Promise<Investor> {
    const response = await request<InvestorApi>('/investors', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return mapInvestor(response);
  },

  async getPortfolios(): Promise<Portfolio[]> {
    const response = await request<PortfolioApi[]>('/portfolios', { method: 'GET' });
    return response.map(mapPortfolio);
  },

  async createPortfolio(data: {
    name: string;
    initialAmount: number;
    description?: string;
  }): Promise<Portfolio> {
    const response = await request<PortfolioApi>('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return mapPortfolio(response);
  },

  async getInvestments(portfolioId: string): Promise<InvestmentAsset[]> {
    const response = await request<InvestmentAssetApi[]>(`/investments?portfolioId=${portfolioId}`, {
      method: 'GET',
    });

    return response.map(mapInvestmentAsset);
  },

  async createInvestment(data: {
    portfolioId: string;
    assetName: string;
    assetType: string;
    category?: string;
    broker?: string;
    quantity: number;
    averagePrice: number;
    currentPrice?: number;
  }): Promise<InvestmentAsset> {
    const response = await request<InvestmentAssetApi>('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return mapInvestmentAsset(response);
  },

  async updateInvestment(
    id: string,
    data: {
      assetName?: string;
      assetType?: string;
      category?: string;
      broker?: string;
      quantity?: number;
      averagePrice?: number;
      currentPrice?: number;
    },
  ): Promise<InvestmentAsset> {
    const response = await request<InvestmentAssetApi>(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return mapInvestmentAsset(response);
  },

  async deleteInvestment(id: string): Promise<void> {
    await request(`/investments/${id}`, {
      method: 'DELETE',
    });
  },

  async getContributions(portfolioId?: string): Promise<Contribution[]> {
    const suffix = portfolioId ? `?portfolioId=${portfolioId}` : '';
    const response = await request<ContributionApi[]>(`/contributions${suffix}`, {
      method: 'GET',
    });

    return response.map(mapContribution);
  },

  async createContribution(data: {
    portfolioId: string;
    investmentId?: string;
    type: 'aporte' | 'retirada';
    value: number;
    quantity?: number;
    price?: number;
    date?: string;
    note?: string;
  }): Promise<Contribution> {
    const response = await request<ContributionApi>('/contributions', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return mapContribution(response);
  },

  async deleteContribution(id: string): Promise<void> {
    await request(`/contributions/${id}`, {
      method: 'DELETE',
    });
  },

  async getFinancialFlows(): Promise<FinancialFlow[]> {
    const response = await request<FinancialFlowApi[]>('/financial-flows', {
      method: 'GET',
    });

    return response.map(mapFinancialFlow);
  },

  async createFinancialFlow(data: {
    type: 'income' | 'expense';
    category: string;
    description?: string;
    value: number;
    date?: string;
  }): Promise<FinancialFlow> {
    const response = await request<FinancialFlowApi>('/financial-flows', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return mapFinancialFlow(response);
  },

  async deleteFinancialFlow(id: string): Promise<void> {
    await request(`/financial-flows/${id}`, {
      method: 'DELETE',
    });
  },

  async refreshInvestmentPrices(): Promise<{ updated: number }> {
    return request<{ updated: number }>('/investments/refresh-prices', {
      method: 'POST',
    });
  },

  async updatePortfolio(
    id: string,
    data: { name?: string; description?: string; initialAmount?: number },
  ): Promise<Portfolio> {
    const response = await request<PortfolioApi>(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapPortfolio(response);
  },

  async deletePortfolio(id: string): Promise<void> {
    await request(`/portfolios/${id}`, { method: 'DELETE' });
  },

  async deletePortfolioCascade(id: string): Promise<void> {
    const [investments, contributions, dividends] = await Promise.all([
      this.getInvestments(id),
      this.getContributions(id),
      this.getDividends(),
    ]);

    const investmentIds = new Set(investments.map((item) => item.id));
    const relatedDividends = dividends.filter((item) => item.investmentId && investmentIds.has(item.investmentId));

    await Promise.all([
      ...relatedDividends.map((item) => this.deleteDividend(item.id)),
      ...contributions.map((item) => this.deleteContribution(item.id)),
      ...investments.map((item) => this.deleteInvestment(item.id)),
    ]);

    await this.deletePortfolio(id);
  },

  async updateContribution(
    id: string,
    data: {
      type?: 'aporte' | 'retirada';
      value?: number;
      quantity?: number;
      price?: number;
      date?: string;
      note?: string;
    },
  ): Promise<Contribution> {
    const response = await request<ContributionApi>(`/contributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapContribution(response);
  },

  async updateFinancialFlow(
    id: string,
    data: { type?: 'income' | 'expense'; category?: string; description?: string; value?: number; date?: string },
  ): Promise<FinancialFlow> {
    const response = await request<FinancialFlowApi>(`/financial-flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapFinancialFlow(response);
  },

  async updateDividend(
    id: string,
    data: { value?: number; date?: string; type?: string; notes?: string },
  ): Promise<Dividend> {
    const response = await request<DividendApi>(`/dividends/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapDividend(response);
  },

  async getDividends(): Promise<Dividend[]> {
    const response = await request<DividendApi[]>('/dividends', { method: 'GET' });
    return response.map(mapDividend);
  },

  async createDividend(data: {
    investmentId: string;
    value: number;
    date?: string;
    type?: string;
    notes?: string;
  }): Promise<Dividend> {
    const response = await request<DividendApi>('/dividends', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapDividend(response);
  },

  async deleteDividend(id: string): Promise<void> {
    await request(`/dividends/${id}`, { method: 'DELETE' });
  },

  async getFinancialGoals(): Promise<FinancialGoal[]> {
    const response = await request<FinancialGoalApi[]>('/financial-goals', { method: 'GET' });
    return response.map(mapFinancialGoal);
  },

  async createFinancialGoal(data: {
    name: string;
    category: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    description?: string;
  }): Promise<FinancialGoal> {
    const response = await request<FinancialGoalApi>('/financial-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapFinancialGoal(response);
  },

  async updateFinancialGoal(id: string, data: {
    name?: string;
    category?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: string;
    description?: string;
  }): Promise<FinancialGoal> {
    const response = await request<FinancialGoalApi>(`/financial-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapFinancialGoal(response);
  },

  async deleteFinancialGoal(id: string): Promise<void> {
    await request(`/financial-goals/${id}`, { method: 'DELETE' });
  },
};
