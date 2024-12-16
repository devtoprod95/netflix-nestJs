import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
    transform(value: string, metadata: ArgumentMetadata): string {
        if( !value ){
            return value;
        }

        // 글자 길이가 3미만인지 체크
        if(value.length < 3){
            throw new BadRequestException("영화의 제목은 3자 이상 작성해주세요!");
        }

        return value;
    }

}