import { IsString, IsEmail } from "class-validator";

export class CreateAuthDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

}
