import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@ApiTags('Dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan dashboard penjualan dan stok' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard' })
  summary() {
    return this.dashboardService.summary();
  }
}
