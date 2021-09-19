import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'

export class targetVpcStack extends cdk.Stack {

  public target_vpc = null;

  constructor(scope: cdk.Construct, id: string, vpcProps: any, props?: cdk.StackProps,) {
    super(scope, id, props);

    const vpcId = vpcProps.targetVpcId;

    // Dynamically returns target VPC info
    const targetVpc = ec2.Vpc.fromLookup(this, 'targetVpc', {
      vpcId: vpcId,
      isDefault: false
    })
  }
}
