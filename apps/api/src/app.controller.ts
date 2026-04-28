import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      success: true,
      data: { status: 'ok', message: 'Bilnov API is running', version: '1.0.0' },
    };
  }
}
