import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

async function setup() {
  console.log('🚀 Setting up Personal Context Hub backend...\n');

  try {
    // Check if .env exists
    const envPath = join(__dirname, '..', '.env');
    if (!existsSync(envPath)) {
      console.error('❌ .env file not found!');
      console.log('📝 Please create .env file:');
      console.log('   1. Copy .env.example to .env');
      console.log('   2. Update DATABASE_URL with your PostgreSQL credentials');
      console.log('   3. Set a random JWT_SECRET\n');
      process.exit(1);
    }

    // Load environment variables manually
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
        process.env[key] = value;
      }
    });

    const dbUrl = envVars.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in .env file');
    }

    // Check if DATABASE_URL has been configured
    if (dbUrl.includes('username:password')) {
      console.error('❌ DATABASE_URL not configured!');
      console.log('📝 Please update .env file with your PostgreSQL credentials:');
      console.log('   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/personal_context_hub"\n');
      process.exit(1);
    }

    // Parse the database URL
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/([^?]+)/);
    if (!urlMatch) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, dbName] = urlMatch;

    console.log(`📦 Attempting to create database "${dbName}"...\n`);

    // Try to create database using node-postgres or psql
    const createDbUrl = `postgresql://${user}:${password}@${host}:${port}/postgres`;

    try {
      // Try using psql command
      await execAsync(`psql "${createDbUrl}" -c "CREATE DATABASE ${dbName};"`, {
        env: { ...process.env, PGPASSWORD: password },
        shell: true
      });
      console.log('✅ Database created successfully!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Database already exists!\n');
      } else if (error.message.includes('psql') || error.message.includes('not found')) {
        console.log('⚠️  Could not auto-create database (psql not found)');
        console.log('📝 Please create the database manually:');
        console.log(`   Method 1: psql -U ${user} -c "CREATE DATABASE ${dbName};"`);
        console.log(`   Method 2: Use pgAdmin or your PostgreSQL GUI`);
        console.log('   Method 3: Connect to PostgreSQL and run: CREATE DATABASE personal_context_hub;\n');

        // Continue anyway - migrations will fail if DB doesn't exist
      } else {
        throw error;
      }
    }

    // Run Prisma migrations
    console.log('📊 Running Prisma migrations...');
    try {
      await execAsync('npx prisma migrate dev --name init', {
        env: process.env,
        shell: true
      });
      console.log('✅ Migrations completed!\n');
    } catch (error) {
      console.error('❌ Migration failed!');
      console.log('\n💡 Make sure:');
      console.log('   1. PostgreSQL is running');
      console.log('   2. Database exists (create it manually if needed)');
      console.log('   3. Credentials in .env are correct\n');
      throw error;
    }

    // Generate Prisma Client
    console.log('🔧 Generating Prisma Client...');
    await execAsync('npx prisma generate', { shell: true });
    console.log('✅ Prisma Client generated!\n');

    console.log('🎉 Setup completed successfully!\n');
    console.log('You can now run: npm run dev');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Manual setup instructions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create database manually:');
    console.log('   psql -U postgres -c "CREATE DATABASE personal_context_hub;"');
    console.log('   OR use pgAdmin/your database tool');
    console.log('3. Run: npm run prisma:migrate\n');
    process.exit(1);
  }
}

setup();
