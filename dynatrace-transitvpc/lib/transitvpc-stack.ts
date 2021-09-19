import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import { CfnRoute, Vpc } from '@aws-cdk/aws-ec2';


export class transitVpcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, vpcProps: any, target_vpc: any, props?: cdk.StackProps) {
    super(scope, id, props);

    // Default tags for all stack objects
    cdk.Tags.of(this).add("product", vpcProps.serviceName + "TransitVpc")
    cdk.Tags.of(this).add("Environment", "dev")
    cdk.Tags.of(this).add("Support-Level", "very low")
    cdk.Tags.of(this).add("Cost-Centre", "cc-abc000")
    cdk.Tags.of(this).add("Sub-Project-Code", "AWS-421")
    cdk.Tags.of(this).add("Name", "dynatrace-transit")
    cdk.Tags.of(this).add("delete_date", "2021-07-01")

    // Create Transit VPC
    const transitVpc = new ec2.Vpc(this, vpcProps.serviceName + 'TransitVpc', {
      cidr: vpcProps.transitVpcCidr,
      maxAzs: 3,
      subnetConfiguration: [{
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 27,
        name: "Isolated",
      }]
    })

    // Peer the Target and Transit VPCs
    const peerTargetVpc = new ec2.CfnVPCPeeringConnection(this, vpcProps.serviceName + 'TransitPeering', {
      peerRegion: target_vpc.env.region,
      peerOwnerId: target_vpc.env.account,
      peerVpcId: vpcProps.targetVpcId,
      vpcId: transitVpc.vpcId
    })

    // Add routes to Transit VPC
    let transitVpcSubnets = transitVpc.isolatedSubnets;
    let i = 1;
    transitVpcSubnets.forEach(subnet => {
      new CfnRoute(this, vpcProps.serviceName + 'PeeringRoute' + i, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: target_vpc.transitVpcCidr
      });
      i++;
    })




    // const transitVpcRoutes = new ec2.CfnRoute(this, vpcProps.serviceName + 'transitVpcRoutes', {
    //   routeTableId:
    // })

  }
}
