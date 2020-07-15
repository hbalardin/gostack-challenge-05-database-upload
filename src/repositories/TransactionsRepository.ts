import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface ParsedTransaction {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: Category | undefined;
  created_at: Date;
  updated_at: Date;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const { income, outcome } = transactions.reduce(
      (accumulator: Balance, currentValue: Transaction): Balance => {
        switch (currentValue.type) {
          case 'income':
            accumulator.income += Number(currentValue.value);
            break;
          case 'outcome':
            accumulator.outcome += Number(currentValue.value);
            break;
          default:
            break;
        }

        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }

  public async getTransactionsWithCategories(): Promise<ParsedTransaction[]> {
    const categoriesRepository = getRepository(Category);

    const transactions = await this.find();

    const parsedTransactions = transactions.map(async transaction => {
      const {
        id,
        title,
        value,
        type,
        category_id,
        created_at,
        updated_at,
      } = transaction;

      const category = await categoriesRepository.findOne(category_id);

      return {
        id,
        title,
        value,
        type,
        category,
        created_at,
        updated_at,
      };
    });

    return parsedTransactions;
  }
}

export default TransactionsRepository;
