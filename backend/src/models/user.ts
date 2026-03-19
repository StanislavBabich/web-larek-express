import mongoose, { Document, Schema } from 'mongoose';

export interface IUserToken {
  token: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  tokens: IUserToken[];
}

const userTokenSchema = new Schema<IUserToken>({
  token: {
    type: String,
    required: true,
  },
}, { _id: false });

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    minlength: [2, 'Минимальная длина поля "name" - 2'],
    maxlength: [30, 'Максимальная длина поля "name" - 30'],
    default: 'Ё-мое',
  },
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Поле "password" должно быть заполнено'],
    minlength: [6, 'Минимальная длина поля "password" - 6'],
    select: false,
  },
  tokens: {
    type: [userTokenSchema],
    default: [],
    select: false,
  },
}, {
  versionKey: false,
});

export default mongoose.model<IUser>('user', userSchema);
