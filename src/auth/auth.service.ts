import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

import { UserService } from '../user/user.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtTokens } from './interfaces/jwt-tokens.interface';
import { Admin, AdminDocument } from '../admin/schemas/admin.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

 

  async registerDevice(registerDeviceDto: RegisterDeviceDto): Promise<{
    deviceToken: string;
    refreshToken: string;
    userId: string;
    createdAt: Date;
  }> {
    let user = await this.userService.findByDeviceId(
      registerDeviceDto.deviceId,
    );

    if (!user) {
      user = await this.userService.create(registerDeviceDto);
    }

    const tokens = this.generateTokens(user.deviceId, 'device');

    await this.userService.updateRefreshToken(
      user.deviceId,
      tokens.refreshToken,
    );

    return {
      deviceToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user._id.toString(),
      createdAt: user.createdAt,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<JwtTokens> {
    const { deviceId, refreshToken } = refreshTokenDto;

    const user = await this.userService.findByDeviceId(deviceId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.generateTokens(deviceId, 'device');
    await this.userService.updateRefreshToken(deviceId, tokens.refreshToken);

    return tokens;
  }

  async validateDevice(deviceId: string) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new UnauthorizedException('Invalid device token');
    }
    return user;
  }

  async registerAdmin(
    username: string,
    password: string,
    email: string,
  ): Promise<AdminDocument> {
    // Check if admin already exists
    const existingAdmin = await this.adminModel.findOne({ username }).exec();
    if (existingAdmin) {
      throw new ForbiddenException('Admin user already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const twoFactorSecret = speakeasy.generateSecret({ length: 20 }).base32;

    const admin = new this.adminModel({
      username,
      passwordHash,
      email,
      twoFactorSecret,
      twoFactorEnabled: false,
      isActive: true,
    });

    return admin.save();
  }

  async validateAdmin(username: string, password: string): Promise<any> {
    const admin = await this.adminModel
      .findOne({ username, isActive: true })
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      twoFactorEnabled: admin.twoFactorEnabled,
    };
  }

  async verifyTwoFactor(adminId: string, token: string): Promise<boolean> {
    const admin = await this.adminModel.findById(adminId).exec();

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 30 seconds before/after
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    return true;
  }

  async loginAdmin(loginAdminDto: LoginAdminDto) {
    // Validate admin credentials
    const admin = await this.validateAdmin(
      loginAdminDto.username,
      loginAdminDto.password,
    );

    // Verify 2FA if enabled
    if (admin.twoFactorEnabled) {
      await this.verifyTwoFactor(admin.id, loginAdminDto.otp);
    }

    // Update last login
    await this.adminModel.findByIdAndUpdate(admin.id, {
      lastLogin: new Date(),
    });

    // Generate admin JWT
    const payload = {
      username: admin.username,
      sub: admin.id,
      role: admin.role,
      type: 'admin',
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('ADMIN_JWT_SECRET'),
        expiresIn:
          this.configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '1h',
      }),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async findAdminByUsername(username: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ username }).exec();
  }

  async findAdminById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }

  async updateAdmin(
    adminId: string,
    updateData: Partial<AdminDocument>,
  ): Promise<AdminDocument> {
    const admin = await this.adminModel
      .findByIdAndUpdate(adminId, updateData, { new: true })
      .exec();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  async enableTwoFactor(
    adminId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const admin = await this.adminModel.findById(adminId).exec();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Generate a new secret if not already set
    if (!admin.twoFactorSecret) {
      const secret = speakeasy.generateSecret({
        name: `MakaylaJam (${admin.username})`,
        length: 20,
      });

      admin.twoFactorSecret = secret.base32;
      await admin.save();
    }

    // Generate QR code URL
    const otpauthUrl = speakeasy.otpauthURL({
      secret: admin.twoFactorSecret,
      label: admin.username,
      issuer: 'MakaylaJam',
      encoding: 'base32',
    });

    return {
      secret: admin.twoFactorSecret,
      qrCodeUrl: otpauthUrl,
    };
  }

  async disableTwoFactor(adminId: string): Promise<AdminDocument> {
    const admin = await this.adminModel
      .findByIdAndUpdate(
        adminId,
        {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
        { new: true },
      )
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async verifyAdminTwoFactor(adminId: string, token: string): Promise<boolean> {
    const admin = await this.adminModel.findById(adminId).exec();
    if (!admin || !admin.twoFactorSecret) {
      throw new NotFoundException('2FA not setup for this admin');
    }

    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      await this.adminModel.findByIdAndUpdate(adminId, {
        twoFactorEnabled: true,
      });
    }

    return verified;
  }

  async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AdminDocument> {
    const admin = await this.adminModel.findById(adminId).exec();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const updatedAdmin = await this.adminModel
      .findByIdAndUpdate(
        adminId,
        { passwordHash: newPasswordHash },
        { new: true },
      )
      .exec();

    if (!updatedAdmin) {
      throw new NotFoundException('Admin not found');
    }

    return updatedAdmin;
  }

  async deactivateAdmin(adminId: string): Promise<AdminDocument> {
    const admin = await this.adminModel
      .findByIdAndUpdate(adminId, { isActive: false }, { new: true })
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async activateAdmin(adminId: string): Promise<AdminDocument> {
    const admin = await this.adminModel
      .findByIdAndUpdate(adminId, { isActive: true }, { new: true })
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async listAdmins(): Promise<AdminDocument[]> {
    return this.adminModel.find().sort({ createdAt: -1 }).exec();
  }

  private generateTokens(deviceId: string, type: string): JwtTokens {
    const payload = {
      sub: deviceId,
      deviceId,
      type,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken };
  }
}
