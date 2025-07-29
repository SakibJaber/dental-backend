import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UploadedFile,
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
  @UseGlobalFileInterceptor({ fieldName: 'image' })
  signup(
    @Body() dto: SignupAuthDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.signup(dto,file);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  @Post('forgot')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }
}
