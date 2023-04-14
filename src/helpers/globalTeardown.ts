import fs from 'fs';
import path from 'path';
import { FullConfig } from '@playwright/test';

export default async function globalTeardown(config: FullConfig): Promise<void> {
    const currentProjectNames = config.projects.map((project: { name: string; }) => project.name);
    const oldFolder = path.join(process.cwd(), 'results-e2e-raw/');
    const newFolder = path.join(process.cwd(), 'results-e2e/screenshots/');
    fs.mkdirSync(newFolder, { recursive: true });
    if (fs.existsSync(oldFolder)) {
        for (const oldSubFolder of fs.readdirSync(oldFolder)) {
            for (const oldFile of fs.readdirSync(path.join(oldFolder, oldSubFolder))) {
                const oldFilePath = `${oldFolder}/${oldSubFolder}/${oldFile}`;
                const newFile = "00_" + oldSubFolder
                    .substring(oldSubFolder.indexOf("00") + 2)
                    .split('-')
                    .filter(e => !currentProjectNames.includes(e) && !e.includes('retry'))
                    .join('_')
                    .replace('_', ' ');
                const newFilePath = `${newFolder}/${newFile}.${oldFile.split('.').pop()}`;
                fs.copyFileSync(oldFilePath, newFilePath);
            }
        }
    }
    return;
}
