#!/usr/bin/env node

import { runCli } from './cli/assess-command.js';

const exitCode = await runCli();
process.exitCode = exitCode;
