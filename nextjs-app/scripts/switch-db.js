// Sync Prisma datasource provider with DATABASE_PROVIDER env (sqlite or postgresql)
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const providerEnv = (process.env.DATABASE_PROVIDER || '').trim().toLowerCase();
const provider = providerEnv === 'postgres' ? 'postgresql' : providerEnv || 'sqlite';
const allowed = ['sqlite', 'postgresql'];

if (!allowed.includes(provider)) {
  console.error(`DATABASE_PROVIDER must be one of: ${allowed.join(', ')}. Received: ${providerEnv || 'undefined'}`);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const replaced = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);

if (schema === replaced) {
  console.log(`Datasource provider already set to ${provider}.`);
} else {
  fs.writeFileSync(schemaPath, replaced, 'utf8');
  console.log(`Datasource provider set to ${provider}.`);
}
