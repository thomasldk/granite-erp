
import { BackupService } from './services/BackupService';

async function main() {
    console.log('🔄 Triggering immediate manual backup...');
    const backupService = new BackupService();
    await backupService.performBackupToDisk();
    console.log('✅ Manual backup command finished.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
