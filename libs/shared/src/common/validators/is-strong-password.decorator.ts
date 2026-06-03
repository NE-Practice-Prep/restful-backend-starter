import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName,
      options: {
        message: STRONG_PASSWORD_MESSAGE,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && STRONG_PASSWORD_REGEX.test(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return STRONG_PASSWORD_MESSAGE;
        },
      },
    });
  };
}
