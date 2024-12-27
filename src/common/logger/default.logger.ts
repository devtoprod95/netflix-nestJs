import { ConsoleLogger, Injectable } from "@nestjs/common";

@Injectable()
export class DefaulLogger extends ConsoleLogger {
    warn(message: unknown, ...rest: unknown[]): void {
        super.warn(message, ...rest);
    }
}