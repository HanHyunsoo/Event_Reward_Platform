import { registerDecorator } from 'class-validator';

import { ValidationOptions } from 'class-validator';

import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateAfter', async: false })
class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string | Date, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as [string];
    const object = args.object as Record<string, unknown>;
    const relatedValue = object[relatedPropertyName];

    const startTime = new Date(relatedValue as string);
    const endTime = new Date(propertyValue as string);
    return startTime < endTime;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsDateAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateAfterConstraint,
    });
  };
}
