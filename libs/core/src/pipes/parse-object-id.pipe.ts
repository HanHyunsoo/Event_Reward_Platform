import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * 10버전에서는 해당 파이프가 없어서 아래 링크를 참조하여 파일을 추가함
 * @link https://github.com/nestjs/mongoose/blob/master/lib/pipes/parse-object-id.pipe.ts
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string): Types.ObjectId {
    const isValidObjectId = Types.ObjectId.isValid(value);

    if (!isValidObjectId) {
      throw new BadRequestException(
        `Invalid ObjectId: '${value}' is not a valid MongoDB ObjectId`,
      );
    }

    return new Types.ObjectId(value);
  }
}
