import { RequestHandler } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';

type CreateOrderBody = {
  payment: 'card' | 'online';
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
};

const createOrder: RequestHandler = async (req, res, next) => {
  try {
    // request body is validated by celebrate middleware
    const body = req.body as CreateOrderBody;
    const { total, items } = body;

    const uniqueItemIds = Array.from(new Set(items));

    const products = await Product.find({ _id: { $in: uniqueItemIds } }).lean();
    if (products.length !== uniqueItemIds.length) {
      throw new BadRequestError('Some items do not exist');
    }

    const notForSale = products.find((p) => p.price === null);
    if (notForSale) {
      throw new BadRequestError('Some items are not for sale');
    }

    const sum = products.reduce((acc, p) => acc + (p.price ?? 0), 0);
    if (sum !== total) {
      throw new BadRequestError('Total does not match items sum');
    }

    res.status(201).send({
      id: faker.string.uuid(),
      total,
    });
  } catch (err) {
    next(err);
  }
};

export default createOrder;
