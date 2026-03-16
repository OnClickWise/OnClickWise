export interface Investor {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  patrimony: number;
}

export interface Portfolio {
  id: string;
  name: string;
  userId?: string;
  ownerName: string;
  totalValue: number;
  initialAmount: number;
  investedTotal: number;
  currentAssetsTotal?: number;
  profitTotal?: number;
  createdAt: string;
}

export interface InvestmentAsset {
  id: string;
  portfolioId: string;
  portfolioName?: string;
  assetName: string;
  assetType: string;
  category?: string;
  broker?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  createdAt: string;
}

export interface Contribution {
  id: string;
  portfolioId: string;
  portfolioName?: string;
  investmentId?: string;
  assetName?: string;
  type: 'aporte' | 'retirada';
  value: number;
  quantity?: number;
  price?: number;
  date: string;
  note?: string;
}

export interface FinancialFlow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  value: number;
  date: string;
}

export interface Dividend {
  id: string;
  investmentId: string;
  assetName?: string;
  portfolioName?: string;
  value: number;
  date: string;
  type: string;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  description?: string;
}
