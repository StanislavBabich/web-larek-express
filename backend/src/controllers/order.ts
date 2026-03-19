import { RequestHandler } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';

type CreateOrderBody = {
  payment: 'card' | 'online' | 'cash';
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
};

const createOrder: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateOrderBody;
    const { items } = body;
    const totalNum = typeof body.total === 'string' ? Number(body.total) : body.total;

    if (!Number.isFinite(totalNum)) {
      throw new BadRequestError('Invalid total');
    }

    const uniqueItemIds = Array.from(new Set(items));

    const products = await Product.find({ _id: { $in: uniqueItemIds } }).lean();
    if (products.length !== uniqueItemIds.length) {
      throw new BadRequestError('Some items do not exist');
    }

    const priceById = new Map(
      products.map((p) => [p._id.toString(), p.price]),
    );

    const sum = items.reduce((acc, id) => {
      const price = priceById.get(id);
      if (price === undefined) {
        throw new BadRequestError('Some items do not exist');
      }
      if (price === null) {
        throw new BadRequestError('Some items are not for sale');
      }
      return acc + price;
    }, 0);

    if (sum !== totalNum) {
      throw new BadRequestError('Total does not match items sum');
    }

    res.status(201).send({
      id: faker.string.uuid(),
      total: totalNum,
    });
  } catch (err) {
    next(err);
  }
};

export default createOrder;
