import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClaimHistoryDocument } from '../schemas/claim-history.schema';
import { ClaimHistory } from '../schemas/claim-history.schema';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ClaimHistoriesService {
  constructor(
    @InjectModel(ClaimHistory.name)
    private claimHistoryModel: Model<ClaimHistoryDocument>,
    @Inject('USERS_SERVICE') private readonly userClient: ClientProxy,
  ) {}
}
