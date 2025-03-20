import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { join } from "path";
import { cwd } from "process";
import * as ffmpegFluent from 'fluent-ffmpeg';

@Processor('thumbnail-generation')
export class ThubmnailGenerationProcess extends WorkerHost {
    async process(job: Job, token?: string) {
        const { fileId, filePath } = job.data;

        const outputDir = join(cwd(), 'public', 'thumbnail');
        const outputThumbailPath = join(outputDir, `${fileId}.png`);

        ffmpegFluent(filePath)
            .screenshots({
                count: 1,
                filename: `${fileId}.png`,
                folder: outputDir,
                size: '320x240'
            })
            .on('end', () => {
                console.log(`성공 fileId: ${fileId}`);
            })
            .on('error', (err) => {
                console.log(err);
                console.log(`실패 fileId: ${fileId}`);
            })
    }
}