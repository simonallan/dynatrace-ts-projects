import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'

export class targetVpcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, targetVpcId: string , props?: cdk.StackProps,) {
    super(scope, id, props);

    const vpcId = targetVpcId

    // Dynamically returns target VPC info
    const vpc_id = ec2.Vpc.fromLookup(this, 'targetVpc', {
        vpcId: vpcId
    })
  }
}
