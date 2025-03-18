import { Module } from "@nestjs/common";
import { ThubmnailGenerationProcess } from "./thumbnail-generation.worker";

@Module({
    providers: [ThubmnailGenerationProcess]
})
export class WorkerModule {}