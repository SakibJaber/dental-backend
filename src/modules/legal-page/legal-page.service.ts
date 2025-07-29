import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLegalPageDto } from './dto/create-legal-page.dto';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import {
  LegalPage,
  LegalPageDocument,
} from 'src/modules/legal-page/legal-page.schema';

@Injectable()
export class LegalPageService {
  constructor(
    @InjectModel(LegalPage.name)
    private readonly legalPageModel: Model<LegalPageDocument>,
  ) {}

  async create(dto: CreateLegalPageDto): Promise<LegalPage> {
    const exists = await this.legalPageModel.findOne({ slug: dto.slug });
    if (exists) {
      throw new ConflictException(`${dto.slug} page already exists`);
    }
    const page = new this.legalPageModel(dto);
    return page.save();
  }

  async findBySlug(slug: 'about' | 'terms' | 'privacy'): Promise<LegalPage> {
    const page = await this.legalPageModel.findOne({ slug }).exec();
    if (!page) {
      throw new NotFoundException(`${slug} page not found`);
    }
    return page;
  }

  async update(
    slug: 'about' | 'terms' | 'privacy',
    dto: UpdateLegalPageDto,
  ): Promise<LegalPage> {
    const updated = await this.legalPageModel.findOneAndUpdate(
      { slug },
      { $set: dto },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`${slug} page not found`);
    }
    return updated;
  }

  async findAll(): Promise<LegalPage[]> {
    return this.legalPageModel.find().sort({ createdAt: -1 }).exec();
  }
}
