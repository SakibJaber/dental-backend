import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserStatus } from 'src/common/enum/user.status.enum';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User, UserDocument } from 'src/modules/users/schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async findAllByRole(role: string) {
    return this.userModel.find({ role }).exec();
  }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  async findByStatus(status: UserStatus) {
    return await this.userModel.find({ status }).exec();
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    user.status = status;

    // Revoke tokens when blocking or rejecting
    if (status === UserStatus.BLOCKED || status === UserStatus.REJECTED) {
      user.refreshToken = null;
    }

    await user.save();

    // Notify user
    await this.notificationService.createNotification({
      title: 'Account Status Updated',
      body: `Your account status is now "${status}"`,
      user: user.id.toString(),
      metadata: { status },
    });

    // Notify admins
    const admins = await this.userModel.find({ role: 'admin' }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: `User ${status}`,
          body: `User ${user.email} (${user._id}) was ${status.toLowerCase()}.`,
          user: admin.id.toString(),
          metadata: { changedUserId: user._id, newStatus: status },
        }),
      ),
    );

    return { message: `User status updated to ${status}` };
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    return await this.userModel.findByIdAndUpdate(id, { refreshToken });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = new this.userModel(data);

    // Notify all admins
    const admins = await this.userModel.find({ role: 'admin' }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Signup',
          body: `${user.email} signed up.`,
          user: admin.id.toString(),
          metadata: { signup: true, newUserId: user._id },
        }),
      ),
    );
    return await user.save();
  }
}
