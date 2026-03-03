import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { getJwtConfig } from '../../config/jwt.config';
import { getAppConfig } from '../../config/app.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const config = getAppConfig();

    // Find user by email (search across all municipalities for login)
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['municipality'],
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    if (user.status === 'locked') {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 60000,
        );
        throw new ForbiddenException({
          message: 'ACCOUNT_LOCKED',
          minutesLeft,
        });
      }
      // Lock expired, unlock the account
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.userRepo.save(user);
    }

    if (user.status === 'inactive') {
      throw new ForbiddenException({ message: 'ACCOUNT_INACTIVE' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= config.maxFailedAttempts) {
        user.status = 'locked';
        user.lockedUntil = new Date(
          Date.now() + config.lockoutDurationMinutes * 60 * 1000,
        );
        await this.userRepo.save(user);

        await this.auditService.log({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
          municipalityId: user.municipalityId,
          sourceIp: ip,
          action: 'auth.account_locked',
          module: 'auth',
          entityType: 'user',
          entityId: user.id,
          metadata: { failedAttempts: user.failedLoginAttempts },
        });

        throw new ForbiddenException({
          message: 'ACCOUNT_LOCKED',
          minutesLeft: config.lockoutDurationMinutes,
        });
      }

      const attemptsRemaining =
        config.maxFailedAttempts - user.failedLoginAttempts;
      await this.userRepo.save(user);
      throw new UnauthorizedException({
        message: 'INVALID_CREDENTIALS',
        attemptsRemaining,
      });
    }

    // Check municipality is active (for non-system admins)
    if (user.municipality && user.municipality.status !== 'active') {
      throw new ForbiddenException({ message: 'MUNICIPALITY_INACTIVE' });
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user, ip, userAgent);

    await this.auditService.log({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      municipalityId: user.municipalityId,
      sourceIp: ip,
      action: 'auth.login',
      module: 'auth',
      entityType: 'user',
      entityId: user.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        municipalityId: user.municipalityId,
        municipalityName: user.municipality?.name || null,
        avatarFilename: user.avatarFilename || null,
      },
    };
  }

  async refresh(refreshTokenValue: string, ip?: string, userAgent?: string) {
    const tokenHash = this.hashToken(refreshTokenValue);

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Su sesión ha expirado por inactividad. Por seguridad, inicie sesión nuevamente.',
      );
    }

    const user = await this.userRepo.findOne({
      where: { id: storedToken.userId },
      relations: ['municipality'],
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    // Revoke old token (rotation)
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepo.save(storedToken);

    // Generate new tokens
    return this.generateTokens(user, ip, userAgent);
  }

  async logout(userId: string, refreshTokenValue?: string) {
    if (refreshTokenValue) {
      const tokenHash = this.hashToken(refreshTokenValue);
      await this.refreshTokenRepo.update(
        { tokenHash, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    } else {
      // Revoke all tokens for the user
      await this.refreshTokenRepo.update(
        { userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...profile } = user as any;
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    sourceIp?: string,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['municipality'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dataBefore = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarFilename: user.avatarFilename,
    };

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.email) user.email = dto.email;
    if (dto.avatarFilename !== undefined) user.avatarFilename = dto.avatarFilename;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      municipalityId: user.municipalityId,
      sourceIp,
      action: 'auth.profile_update',
      module: 'auth',
      entityType: 'user',
      entityId: user.id,
      dataBefore,
      dataAfter: {
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        avatarFilename: saved.avatarFilename,
      },
    });

    const { passwordHash, ...profile } = saved as any;
    return profile;
  }

  private async generateTokens(
    user: User,
    ip?: string,
    userAgent?: string,
  ) {
    const jwtConfig = getJwtConfig();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      municipalityId: user.municipalityId,
    };

    const accessToken = this.jwtService.sign(
      { ...payload } as Record<string, unknown>,
      { expiresIn: jwtConfig.accessExpiresIn as any },
    );

    // Generate a random refresh token
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshTokenValue);

    // Parse expiration for refresh token
    const refreshExpiresMs = this.parseExpiration(jwtConfig.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + refreshExpiresMs);

    const refreshToken = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: ip || null,
      userAgent: userAgent || null,
    });
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        municipalityId: user.municipalityId,
        municipalityName: (user as any).municipality?.name || null,
        avatarFilename: user.avatarFilename || null,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiration(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const num = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
