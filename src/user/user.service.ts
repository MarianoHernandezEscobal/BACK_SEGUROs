import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }) {

    const existing = await this.userModel.findOne({ email: data.email });

    if (existing) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new this.userModel({
      ...data,
      password: hashedPassword,
    });

    await user.save();
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
      },
      message: 'User created',
    };
  }

  async updateUser(userId: string, data: Partial<User>) {

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      data,
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
      },
      message: 'User updated',
    };
  }

  async login(email: string, password: string) {

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas. Por favor, intenta de nuevo.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales invalidas. Por favor, intenta de nuevo.');
    }

    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
      },
      message: 'Login successful',
    };
  }
  async makeAdmin(id: string) {
    const user = await this.userModel.findByIdAndUpdate(id, { admin: true }, { new: true });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
      },
      message: 'User made admin',
    };
  }

  //funcion privada para generar el token Bearer

  private generateToken(user: UserDocument) {
    return 'Bearer ' + this.jwtService.sign({
      id: user._id,
      email: user.email,
      admin: user.admin,
    });
  }
}