/**
 * Database client/server checks: PostgreSQL, MySQL, Redis, MongoDB, SQLite.
 * These verify the *client* tooling is present; running-server detection is
 * surfaced via the port scanner.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import type { Check } from '../core/types.js';

export const databaseChecks: Check[] = [
  toolCheck({
    id: 'postgres',
    title: 'PostgreSQL (psql)',
    category: 'databases',
    bin: 'psql',
    scored: false,
    tags: ['postgres', 'sql', 'db'],
    install: {
      description: 'Install PostgreSQL client',
      command: 'brew install libpq  # or postgresql',
      url: 'https://www.postgresql.org/download/',
    },
  }),
  toolCheck({
    id: 'mysql',
    title: 'MySQL',
    category: 'databases',
    bin: ['mysql', 'mariadb'],
    scored: false,
    tags: ['sql', 'db'],
    install: {
      description: 'Install MySQL client',
      command: 'brew install mysql-client',
      url: 'https://dev.mysql.com/downloads/',
    },
  }),
  toolCheck({
    id: 'redis',
    title: 'Redis (redis-cli)',
    category: 'databases',
    bin: 'redis-cli',
    scored: false,
    tags: ['cache', 'db', 'kv'],
    install: {
      description: 'Install Redis',
      command: 'brew install redis',
      url: 'https://redis.io/download/',
    },
  }),
  toolCheck({
    id: 'mongodb',
    title: 'MongoDB (mongosh)',
    category: 'databases',
    bin: ['mongosh', 'mongo'],
    scored: false,
    tags: ['nosql', 'db'],
    install: {
      description: 'Install the MongoDB Shell',
      command: 'brew install mongosh',
      url: 'https://www.mongodb.com/try/download/shell',
    },
  }),
  toolCheck({
    id: 'sqlite',
    title: 'SQLite',
    category: 'databases',
    bin: 'sqlite3',
    scored: false,
    tags: ['sql', 'db', 'embedded'],
    install: {
      description: 'Install SQLite',
      command: 'brew install sqlite',
      url: 'https://www.sqlite.org/download.html',
    },
  }),
];
