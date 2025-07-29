import { Test, TestingModule } from '@nestjs/testing';
import { LegalPageController } from './legal-page.controller';
import { LegalPageService } from './legal-page.service';

describe('LegalPageController', () => {
  let controller: LegalPageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalPageController],
      providers: [LegalPageService],
    }).compile();

    controller = module.get<LegalPageController>(LegalPageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
