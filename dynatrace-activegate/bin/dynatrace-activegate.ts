#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { dynatraceActivegateStack } from '../lib/dynatrace-activegate-stack';

const app = new cdk.App();

const myNewStack = new dynatraceActivegateStack(app, 'DynatraceActivegateStack', {
  env: {
    region: 'eu-west-2', // London
    account: '063411552818', // 'Shared-Services' account
  }
})
