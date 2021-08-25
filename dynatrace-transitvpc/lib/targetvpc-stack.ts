import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'

export class TargetvpcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The what???? (identify the VPC for the reader)
    const targetvpc_id = "vpc-17f02973"

    // Dynamically returns target VPC info
    const targetvpc = ec2.Vpc.fromLookup(this, 'targetvpc', {
        vpcId: targetvpc_id
    })
  }
}
