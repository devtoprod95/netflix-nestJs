import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, registerDecorator, Validate, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint()
class PasswordValidator implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        // 비밀번호 길이는 4-8
        return value.length > 4 && value.length < 8;
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return '비밀번호의 길이는 4~8자 여야합니다. 입력된 비밀번호: $value';
    }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: PasswordValidator,
        });
    }
}

export class UpdateMovieDto {
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsOptional()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsOptional()
    @IsNumber()
    directorId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    @IsNumber({}, {
        each: true,
    })
    genreIds: number[];

    // null || undefined
    // @IsDefined()
    // @IsNotEmpty()
    // @IsIn(['a', 'b'])
    // @IsNotIn(['a', 'b'])
    // @Validate(PasswordValidator)
    // @IsPasswordValid()
    // test: string;
}