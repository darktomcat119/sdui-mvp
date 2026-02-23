import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/constants/roles.constant';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    municipalityId?: string | null,
  ): Promise<PaginatedResponseDto<Omit<User, 'passwordHash'>>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const qb = this.userRepo.createQueryBuilder('user');
    qb.leftJoinAndSelect('user.municipality', 'municipality');

    if (municipalityId) {
      qb.where('user.municipalityId = :municipalityId', { municipalityId });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const sanitized = users.map((u) => {
      const { passwordHash, ...rest } = u as any;
      return rest;
    });

    return new PaginatedResponseDto(sanitized, total, page, limit);
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['municipality'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByEmailAndMunicipality(
    email: string,
    municipalityId: string | null,
  ): Promise<User | null> {
    const qb = this.userRepo.createQueryBuilder('user');
    qb.where('user.email = :email', { email });
    if (municipalityId) {
      qb.andWhere('user.municipalityId = :municipalityId', { municipalityId });
    } else {
      qb.andWhere('user.municipalityId IS NULL');
    }
    return qb.getOne();
  }

  async create(
    dto: CreateUserDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Municipal admins can only create users in their own municipality
    if (
      currentUser.role === UserRole.MUNICIPAL_ADMIN &&
      dto.municipalityId !== currentUser.municipalityId
    ) {
      throw new ForbiddenException(
        'You can only create users in your own municipality',
      );
    }

    // Check for existing user with same email in same municipality
    const existing = await this.findByEmailAndMunicipality(
      dto.email,
      dto.municipalityId || null,
    );
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      municipalityId: dto.municipalityId || null,
      avatarFilename: dto.avatarFilename || null,
    });

    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: dto.municipalityId || null,
      sourceIp,
      action: 'user.create',
      module: 'users',
      entityType: 'user',
      entityId: saved.id,
      dataAfter: {
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        role: saved.role,
        municipalityId: saved.municipalityId,
      },
    });

    const { passwordHash: _, ...result } = saved as any;
    return result;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Municipal admins can only update users in their own municipality
    if (
      currentUser.role === UserRole.MUNICIPAL_ADMIN &&
      user.municipalityId !== currentUser.municipalityId
    ) {
      throw new ForbiddenException(
        'You can only update users in your own municipality',
      );
    }

    const dataBefore = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    if (dto.email) user.email = dto.email;
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role;
    if (dto.avatarFilename !== undefined) user.avatarFilename = dto.avatarFilename;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: user.municipalityId,
      sourceIp,
      action: 'user.update',
      module: 'users',
      entityType: 'user',
      entityId: saved.id,
      dataBefore,
      dataAfter: {
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        role: saved.role,
      },
    });

    const { passwordHash: _, ...result } = saved as any;
    return result;
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive',
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      currentUser.role === UserRole.MUNICIPAL_ADMIN &&
      user.municipalityId !== currentUser.municipalityId
    ) {
      throw new ForbiddenException(
        'You can only manage users in your own municipality',
      );
    }

    const dataBefore = { status: user.status };
    user.status = status;
    if (status === 'active') {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: user.municipalityId,
      sourceIp,
      action: `user.${status === 'active' ? 'activate' : 'deactivate'}`,
      module: 'users',
      entityType: 'user',
      entityId: saved.id,
      dataBefore,
      dataAfter: { status: saved.status },
    });

    const { passwordHash: _, ...result } = saved as any;
    return result;
  }
}
