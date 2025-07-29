import { Test, TestingModule } from '@nestjs/testing';
import { LegalPageService } from './legal-page.service';

describe('LegalPageService', () => {
  let service: LegalPageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegalPageService],
    }).compile();

    service = module.get<LegalPageService>(LegalPageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
