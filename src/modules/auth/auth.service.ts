import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { MailService } from 'src/modules/mail/mail.service';
import { ForgotPasswordDto } from 'src/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/modules/auth/dto/reset-password.dto';
import { VerifyOtpDto } from 'src/modules/auth/dto/verify-otp.dto';
import { UserStatus } from 'src/common/enum/user.status.enum';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User, UserDocument } from 'src/modules/users/schema/user.schema';
import { Role } from 'src/common/enum/user_role.enum';

@Injectable()
export class AuthService {
  private readonly otpExpiryMs: number;
  constructor(
    private usersService: UsersService,
    private readonly notificationService: NotificationService,
    private fileUploadService: FileUploadService,
    private mailService: MailService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.otpExpiryMs =
      (+this.config.get<number>('OTP_EXPIRATION_MINUTES')! || 15) * 60 * 1000;
  }

  async signup(dto: SignupAuthDto, file?: Express.Multer.File) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Email already exists',
      });
    }

    const hash = await bcrypt.hash(dto.password, 10);

    let imageUrl: string | undefined;
    if (file) {
      // Assuming fileUploadService.handleUpload is defined elsewhere
      // and fileUploadService is injected in the constructor
      // imageUrl = await this.fileUploadService.handleUpload(file);
      imageUrl = 'mock-image-url'; // Placeholder for demonstration
    }

    const user = await this.usersService.createUser({
      ...dto,
      password: hash,
      imageUrl,
      status: UserStatus.PENDING,
    });

    const userPlainObject = user.toObject({
      getters: true, // Include any virtual properties
      virtuals: false,
    });
    // Destructuring a plain object doesn't include the Mongoose metadata.
    const { password, refreshToken, ...userWithoutSensitiveData } =
      userPlainObject; // Notify all admins

    const admins = await this.usersService.findAllByRole(Role.ADMIN);
    await Promise.all(
      admins.map(
        (
          admin, 
        ) =>
          this.notificationService.createNotification({
            title: 'New signup',
            body: `${user.email} has signed up and needs approval.`,
            user: admin.id,
            metadata: { signup: true, newUserId: userPlainObject._id },
          }),
      ),
    );

    return {
      user: userWithoutSensitiveData,
    };
  }

  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    switch (user.status) {
      case UserStatus.PENDING:
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Your account is pending approval by administrator',
        });
      case UserStatus.REJECTED:
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message:
            'Your account has been rejected. Please contact administrator',
        });
      case UserStatus.BLOCKED:
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message:
            'Your account has been blocked. Please contact administrator',
        });
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.updateRefreshToken(
      user.id,
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access Denied - Invalid refresh token',
      });
    }

    // status check
    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `Account is ${user.status.toLowerCase()}. Access denied`,
      });
    }

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Invalid refresh token',
      });
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.updateRefreshToken(
      user.id,
      await bcrypt.hash(tokens.refreshToken, 10),
    );
    return tokens;
  }

  private async getTokens(userId: string, email: string, role: string) {
    const payload = { userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACC_EXPIRATION'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REF_EXPIRATION'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  // Generate & email OTP
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No account found with this email address',
      });
    }

    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.REJECTED
    ) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `Cannot reset password. Account is ${user.status.toLowerCase()}`,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(code, 10);
    user.resetPasswordCodeHash = hash;
    user.resetPasswordExpires = new Date(Date.now() + this.otpExpiryMs);
    await user.save();

    await this.mailService.sendResetPasswordOtp(dto.email, code);
    return { message: 'OTP sent to your email' };
  }

  // Verify OTP & issue resetToken
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'OTP not found or expired. Please request a new OTP',
      });
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'OTP has expired. Please request a new OTP',
      });
    }

    const match = await bcrypt.compare(
      dto.code.toString(),
      user.resetPasswordCodeHash,
    );
    if (!match) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid OTP. Please check the code and try again',
      });
    }

    // Issue a JWT scoped for password reset
    const payload = { sub: user.id, email: user.email };
    const resetToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_RESET_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACC_EXPIRATION'),
    });

    // clear OTP fields now or after reset
    user.resetPasswordCodeHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { resetToken };
  }

  // Reset password using resetToken
  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(dto.resetToken, {
        secret: this.config.get<string>('JWT_RESET_SECRET'),
      });
    } catch (err) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'Invalid or expired reset token. Please request a new password reset',
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User account no longer exists',
      });
    }

    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.REJECTED
    ) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `Cannot reset password. Account is ${user.status.toLowerCase()}`,
      });
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.refreshToken = null;
    await user.save();

    return { message: 'Password reset successful' };
  }
}
