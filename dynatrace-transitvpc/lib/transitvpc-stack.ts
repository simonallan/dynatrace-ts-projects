import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2'
import * as elbv2Targets from '@aws-cdk/aws-elasticloadbalancingv2-targets'
import { CfnRoute, Vpc } from '@aws-cdk/aws-ec2';


export class transitVpcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, vpcProps: any, target_vpc: any, props?: cdk.StackProps) {
    super(scope, id, props);

    const service = vpcProps.serviceName;

    // Default tags for all stack objects
    cdk.Tags.of(this).add("product", service + "TransitVpc")
    cdk.Tags.of(this).add("Environment", "dev")
    cdk.Tags.of(this).add("Support-Level", "very low")
    cdk.Tags.of(this).add("Cost-Centre", "cc-abc000")
    cdk.Tags.of(this).add("Sub-Project-Code", "AWS-421")
    cdk.Tags.of(this).add("Name", "dynatrace-transit")
    cdk.Tags.of(this).add("delete_date", "2021-07-01")

    // Create Transit VPC
    const transitVpc = new ec2.Vpc(this, service + 'TransitVpc', {
      cidr: vpcProps.transitVpcCidr,
      maxAzs: 3,
      subnetConfiguration: [{
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 27,
        name: "Isolated",
      }]
    });

    // Peer the Target and Transit VPCs
    const peerTargetVpc = new ec2.CfnVPCPeeringConnection(this, service + 'TransitPeering', {
      peerRegion: target_vpc.env.region,
      peerOwnerId: target_vpc.env.account,
      peerVpcId: vpcProps.targetVpcId,
      //peerVpcId: target_vpc.targetvpc_id,
      vpcId: transitVpc.vpcId
    });

    // Add routes to Transit VPC
    let transitVpcSubnets = transitVpc.isolatedSubnets;
    let i = 1;
    transitVpcSubnets.forEach(subnet => {
      new CfnRoute(this, service + 'TransitPeeringRoute' + i, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: target_vpc.transitVpcCidr
      });
      i++;
    });

    // NLB with cross-zone load balancing enabled
    const lb = new elbv2.NetworkLoadBalancer(this, service + 'LB', {
      vpc: transitVpc,
      crossZoneEnabled: true
    });

    // Instantiate LB targets as static IP addresses
    const target1 = new elbv2Targets.IpTarget(vpcProps.dyna01a);
    const target2 = new elbv2Targets.IpTarget(vpcProps.dyna01b);

    // Create listeners
    const activeGateListener = lb.addListener('activeGateListener', { port: vpcProps.activeGatePort });
    const oneAgentListener = lb.addListener('oneAgentListener', { port: vpcProps.oneAgentPort });

    // Configure LB target for ActiveGate traffic on port 443
    activeGateListener.addTargets('ActiveGateTarget', {
      port: vpcProps.activeGatePort,
      targets: [target1, target2]
    });

    // Configure LB target for OneAgent traffic on port 9999
    oneAgentListener.addTargets('oneAgentTarget', {
      port: vpcProps.oneAgentPort,
      targets: [target1, target2]
    });

    const privateService = new ec2.VpcEndpointService(this, 'service', {
      vpcEndpointServiceLoadBalancers: [lb],
      vpcEndpointServiceName: service + 'EndpointService',
      allowedPrincipals: vpcProps.allowedPrincipals
    });
  }
}
