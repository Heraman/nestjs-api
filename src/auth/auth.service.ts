import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

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
        password: await bcrypt.hash(dto.password, 10)
      },
    });
    return newUser;
  }

  async login(dto: CreateAuthDto) {
    const user = await this.findEmail(dto.email); 
    if (user && await bcrypt.compare(dto.password, user.password)) {
      const { password, ...result } = user;
      const payload = { sub: user.id, email: user.email };
      return {
        ...result,
        access_token: await this.jwtService.signAsync(payload, 
          { secret: jwtConstants.secret, 
            expiresIn: '1h' 
          }
        ),
      }
    }

    throw new UnauthorizedException();
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
