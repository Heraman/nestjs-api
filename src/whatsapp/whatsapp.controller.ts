import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(AuthGuard)
  @Post('send')
  async sendText(@Body() data: { phone: string; message: string }) {
    await this.whatsappService.sendMessage(data.phone, data.message);
    return { status: 'success', message: 'Pesan sedang dikirim' };
  }
  
  @UseGuards(AuthGuard)
  @Post('otp')
  async sendOtp(@Body() data: { phone: string; otp: string }) {
    await this.whatsappService.sendOtp(data.phone, data.otp);
    return { status: 'success', message: 'Pesan sedang dikirim' };
  }
}
