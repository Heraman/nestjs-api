import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return user;
  }

  async register(dto: CreateAuthDto) {
    const checkEmail = await this.findEmail(dto.email);
    if (checkEmail) {
      throw new ConflictException('Email already exists');
    }

    const newUser = await this.prisma.user.create({
      data: {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
      },
    });
    return newUser;
  }

  async login(dto: CreateAuthDto) {
    const user = await this.findEmail(dto.email);
    if (user && (await bcrypt.compare(dto.password, user.password))) {
      const { password, refreshToken, ...result } = user;
      const payload = { sub: user.id, email: user.email, role: user.role };

      const aToken = await this.jwtService.signAsync(payload, {
        secret: process.env.SECRET_KEY_JWT,
        expiresIn: '15m',
      });

      const rToken = await this.jwtService.signAsync(payload, {
        secret: process.env.SECRET_REFRESH,
        expiresIn: '7d',
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: rToken },
      });

      return {
        ...result,
        access_token: aToken,
        refresh_token: rToken,
      };
    }

    throw new UnauthorizedException();
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },        
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_REFRESH,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedException();
      }

      const newAccessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: process.env.SECRET_KEY_JWT, expiresIn: '15m' },
      );

      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
