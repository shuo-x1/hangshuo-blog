import {spawn} from 'node:child_process';
const port=Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('PORT must be between 1 and 65535');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const development=process.argv.includes('--dev');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',development?'dev':'start','-p',String(port),'-H',process.env.HOST || '0.0.0.0'],{stdio:'inherit',env:{...process.env,NODE_ENV:development?'development':'production'}});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code ?? 1));
