import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authentifier un utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Retourne access token + refresh token',
  })
  async login(@Body() dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: 'ADMIN' | 'VENDEUR' };
  }> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Regenerer un access token avec le refresh token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 201, description: 'Retourne un nouvel access token' })
  async refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string }> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Deconnecter la session courante' })
  @ApiResponse({ status: 201, description: 'Session deconnectee' })
  async logout(): Promise<{ success: boolean }> {
    return this.authService.logout();
  }
}
