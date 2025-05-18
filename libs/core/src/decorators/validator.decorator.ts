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

export function IsAnyEnum(
  enums: object[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAnyEnum',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return enums.some((enumType) =>
            Object.values(enumType).includes(value),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid enum value from one of the allowed enums`;
        },
      },
    });
  };
}
