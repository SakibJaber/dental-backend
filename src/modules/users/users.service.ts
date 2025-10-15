import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStatus } from 'src/common/enum/user.status.enum';
import { Role } from 'src/common/enum/user_role.enum';
import { Address, AddressDocument } from 'src/modules/address/address.schema';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User, UserDocument } from 'src/modules/users/schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    private fileUploadService: FileUploadService,
    private readonly notificationService: NotificationService,
  ) {}

  // Find user by email
  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  // Find all users by role
  async findAllByRole(role: Role): Promise<UserDocument[]> {
    return await this.userModel
      .find({ role })
      .select('-password -refreshToken')
      .exec();
  }

  // Find user by ID
  async findById(id: string): Promise<UserDocument | null> {
    return await this.userModel.findById(id).exec();
  }

  // Find user by ID with addresses
  async findByIdWithAddresses(id: string): Promise<any> {
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Find addresses for the user with lean() to improve performance
    const addresses = await this.addressModel
      .find({ userId: id })
      .lean()
      .exec();

    return {
      ...user,
      addresses,
    };
  }

  // Get all users with optional filtering and pagination
  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: Role,
    status?: UserStatus,
    search?: string,
  ): Promise<{ users: UserDocument[]; total: number; pages: number }> {
    const query: any = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // Get users by role
  async findByRole(role: Role): Promise<UserDocument[]> {
    return await this.userModel
      .find({ role })
      .select('-password -refreshToken')
      .exec();
  }

  // Get users by status
  async findByStatus(status: UserStatus): Promise<UserDocument[]> {
    return await this.userModel
      .find({ status })
      .select('-password -refreshToken')
      .exec();
  }

  // Create new user
  async createUser(data: Partial<User>): Promise<UserDocument> {
    if (!data.email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = new this.userModel(data);
    const savedUser = await user.save();

    const admins = await this.userModel.find({ role: Role.ADMIN }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: 'New User Registration',
          body: `${data.email} has registered as ${data.role}`,
          user: admin.id.toString(),
          metadata: { signup: true, newUserId: savedUser._id },
        }),
      ),
    );

    return savedUser;
  }

  async updateOwnProfile(
    userId: string,
    dto: Partial<
      Pick<
        User,
        'firstName' | 'lastName' | 'phone' | 'gdcNumber' | 'clinicName'
      >
    >,
    file?: Express.Multer.File,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Prevent changing restricted fields through this endpoint
    const allowed = ['firstName', 'lastName', 'phone', 'gdcNumber', 'clinicName']
      .reduce((obj, key) => (key in dto ? { ...obj, [key]: dto[key as keyof typeof dto] } : obj), {});

    if (file) {
      const imageUrl = await this.fileUploadService.handleUpload(file);
      allowed['imageUrl'] = imageUrl;
    }

    Object.assign(user, allowed);
    await user.save();

    // sanitize output
    const { password, refreshToken, ...safe } = user.toObject({
      getters: true,
      virtuals: false,
    });
    return safe;
  }
 
  // Update user profile
  async updateUser(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    Object.assign(user, updateData);
    return await user.save();
  }

  // Update user status
  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<{ message: string; user: UserDocument }> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    user.status = status;

    if (status === UserStatus.BLOCKED || status === UserStatus.REJECTED) {
      user.refreshToken = null;
    }

    await user.save();

    await this.notificationService.createNotification({
      title: 'Account Status Updated',
      body: `Your account status has been updated to "${status}"`,
      user: user.id.toString(),
      metadata: { status },
    });

    const admins = await this.userModel.find({ role: Role.ADMIN }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: `User ${status}`,
          body: `User ${user.email} (${user._id}) status changed to ${status.toLowerCase()}.`,
          user: admin.id.toString(),
          metadata: { changedUserId: user._id, newStatus: status },
        }),
      ),
    );

    return {
      message: `User status updated to ${status}`,
      user: await this.userModel.findById(id).select('-password -refreshToken'),
    };
  }

  // Update refresh token
  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { refreshToken },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Delete user
  async deleteUser(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<Role, number>;
    byStatus: Record<UserStatus, number>;
  }> {
    const [total, byRole, byStatus] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.userModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const roleStats = byRole.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<Role, number>,
    );

    const statusStats = byStatus.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<UserStatus, number>,
    );

    return { total, byRole: roleStats, byStatus: statusStats };
  }
}
