import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { UpdateSettingsDto } from "./dto/update-settings.dto";

const DEFAULT_SETTINGS_ID = "default";

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSettings() {
    const row = await this.ensureSettings();
    return {
      expiryWarningDays: row.expiryWarningDays,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getExpiryWarningDays() {
    const row = await this.ensureSettings();
    return row.expiryWarningDays;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const row = await this.prisma.appSettings.upsert({
      where: { id: DEFAULT_SETTINGS_ID },
      update: { expiryWarningDays: dto.expiryWarningDays },
      create: { id: DEFAULT_SETTINGS_ID, expiryWarningDays: dto.expiryWarningDays },
    });

    return {
      expiryWarningDays: row.expiryWarningDays,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async ensureSettings() {
    return this.prisma.appSettings.upsert({
      where: { id: DEFAULT_SETTINGS_ID },
      update: {},
      create: { id: DEFAULT_SETTINGS_ID, expiryWarningDays: 30 },
    });
  }
}
