import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { UserStatus } from 'src/common/enum/user.status.enum';
import { Role } from 'src/common/enum/user_role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current user profile with addresses
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return await this.usersService.findByIdWithAddresses(req.user.userId);
  }

  // Get all users with pagination and filtering (Admin only)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return await this.usersService.findAll(page, limit, role, status, search);
  }

  // Get user by ID with addresses
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id') id: string, @Request() req) {
    // Users can view their own profile with addresses, admins can view any profile
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }

    return await this.usersService.findByIdWithAddresses(id);
  }

  // Update user profile
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
  ) {
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (req.user.role !== Role.ADMIN) {
      delete updateData.role;
      delete updateData.status;
    }

    return await this.usersService.updateUser(id, updateData);
  }

  // Admin only endpoints
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveUser(@Param('id') id: string) {
    return await this.usersService.updateStatus(id, UserStatus.APPROVED);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectUser(@Param('id') id: string) {
    return await this.usersService.updateStatus(id, UserStatus.REJECTED);
  }

  @Patch(':id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async blockUser(@Param('id') id: string) {
    return await this.usersService.updateStatus(id, UserStatus.BLOCKED);
  }

  @Patch(':id/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async unblockUser(@Param('id') id: string) {
    return await this.usersService.updateStatus(id, UserStatus.APPROVED);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return await this.usersService.deleteUser(id);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUserStats() {
    return await this.usersService.getUserStats();
  }

  @Get('role/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUsersByRole(@Param('role') role: Role) {
    return await this.usersService.findByRole(role);
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUsersByStatus(@Param('status') status: UserStatus) {
    return await this.usersService.findByStatus(status);
  }
}