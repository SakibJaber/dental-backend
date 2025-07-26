import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/modules/users/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  updateRefreshToken(id: string, refreshToken: string | null) {
    return this.userModel.findByIdAndUpdate(id, { refreshToken });
  }

  async createUser(data: Partial<User>) {
    const user = new this.userModel(data);
    return user.save();
  }
}
