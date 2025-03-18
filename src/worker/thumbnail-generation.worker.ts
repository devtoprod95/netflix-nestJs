import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor('thumbnail-generation')
export class ThubmnailGenerationProcess extends WorkerHost {
    async process(job: Job, token?: string) {
        const { fileId, filePath } = job.data;

        console.log(job.data);

        return 0;
    }
}