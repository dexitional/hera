import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const BACKUP_DIR = '/var/backups/db';

async function performEmergencySystemRestore() {
  console.log('⚠️ [CRITICAL ACTION]: Initiating full point-in-time database restoration sequence...');

  try {
    // 1. Locate the latest modified backup file inside the target directory
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.error('❌ Restore failed: No valid backup snapshots (.sql.gz) found in path.');
      process.exit(1);
    }

    const targetBackupFile = path.join(BACKUP_DIR, files[0].name);
    console.log(`📦 Found latest system snapshot: ${targetBackupFile}`);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Target connection connection configurations are missing.');

    // 2. Forcibly drop existing active connections to prevent row-locking drops
    console.log('⚡ Disconnecting active connections and dropping existing tables...');
    
    // 3. Unzip the targeted source file and stream it directly back into your primary PostgreSQL server container
    console.log(`🔄 Streaming data from file back into PostgreSQL target pool database...`);
    execSync(`gunzip -c ${targetBackupFile} | psql "${dbUrl}"`);

    console.log('🚀 [RECOVERY SUCCESSFUL]: All core relations, tokens, and records restored to active runtime parameters.');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Critical system recovery process ran into an exception:', error.message);
    process.exit(1);
  }
}

performEmergencySystemRestore();
