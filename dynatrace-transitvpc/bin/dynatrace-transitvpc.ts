#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TransitvpcStack } from '../lib/transitvpc-stack';
import { TargetvpcStack } from '../lib/targetvpc-stack';

const app = new cdk.App();

const ireland = new TargetvpcStack(app, 'TargetvpcStack', {
  env: {
    region: 'eu-west-1', account: '614844069056'
  }
});

const london = new TransitvpcStack(app, 'TransitvpcStack', {
  env: {
    region: 'eu-west-2', account: '614844069056'
  }
});
