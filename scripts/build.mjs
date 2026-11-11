import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:process.env.NODE_OPTIONS || '--max-old-space-size=640'}});
child.on('exit',code=>process.exit(code ?? 1));
