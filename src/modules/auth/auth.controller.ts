import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RefreshTokenGuard } from 'src/common/guard/refresh-token.guard';
import { ForgotPasswordDto } from 'src/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/modules/auth/dto/reset-password.dto';
import { VerifyOtpDto } from 'src/modules/auth/dto/verify-otp.dto';
import { UseGlobalFileInterceptor } from 'src/common/decorator/globalFileInterceptor.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  async signup(
    @Body() dto: SignupAuthDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.authService.signup(dto, file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Account created successfully, pending approval',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginAuthDto) {
    const tokens = await this.authService.login(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: tokens,
    };
  }

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'OTP sent to your email successfully',
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'OTP verified successfully',
      data: result,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const tokens = await this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }
}
