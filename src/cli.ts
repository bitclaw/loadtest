#!/usr/bin/env node
import { Command } from 'commander';
import { registerReportCommand } from './cli/commands/report';
import { registerRunCommand } from './cli/commands/run';

const program = new Command();

program
  .name('loadtest')
  .description('Load testing CLI for sqlite-saas apps')
  .version('0.1.0');

registerRunCommand(program);
registerReportCommand(program);

program.parse();
