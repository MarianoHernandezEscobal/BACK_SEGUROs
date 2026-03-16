//guard para verificar si el usuario es admin con bearer token

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token missing');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload.admin) {
        throw new ForbiddenException('Usuario no autorizado');
      }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token or user is not admin');
    }
  }
}