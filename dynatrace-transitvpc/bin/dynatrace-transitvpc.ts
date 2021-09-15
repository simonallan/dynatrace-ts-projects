#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { transitVpcStack } from '../lib/transitvpc-stack';
import { targetVpcStack } from '../lib/targetvpc-stack';

// targetvpc_id: "vpc-17f02973"
// interface targetvpcprops extends cdk.StackProps {
//   targetvpcid: "vpc-17f02973"
// }

const app = new cdk.App();

const vpcProps = {
  targetVpcId: "vpc-17f02973"
}

const ireland = new targetVpcStack(app, 'targetVpcStack', vpcProps, {
  env: {
    region: 'eu-west-1', account: '614844069056',
  },
});

const london = new transitVpcStack(app, 'transitVpcStack', {
  env: {
    region: 'eu-west-2', account: '614844069056'
  }
});
