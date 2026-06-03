import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import { SitesService } from "./sites.service";
import type { CreateSiteDto } from "./dto/create-site.dto";
import type { UpdateSiteDto } from "./dto/update-site.dto";
import type { parseListSitesQuery } from "./dto/list-sites-query.dto";

@Controller()
export class SitesMicroserviceController {
  constructor(@Inject(SitesService) private readonly sites: SitesService) {}

  @MessagePattern(FIRE_PATTERNS.SITE_CREATE)
  async createSite(@Payload() dto: CreateSiteDto) {
    try {
      return await this.sites.create(dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.SITE_LIST)
  async listSites(@Payload() params: ReturnType<typeof parseListSitesQuery>) {
    try {
      return await this.sites.list(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.SITE_VIEW)
  async viewSite(@Payload() data: { id: string }) {
    try {
      return await this.sites.view(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.SITE_UPDATE)
  async updateSite(@Payload() data: { id: string; dto: UpdateSiteDto }) {
    try {
      return await this.sites.update(data.id, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.SITE_REMOVE)
  async removeSite(@Payload() data: { id: string }) {
    try {
      return await this.sites.remove(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
