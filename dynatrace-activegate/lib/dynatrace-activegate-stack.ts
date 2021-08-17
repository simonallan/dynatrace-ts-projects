import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';


export class DynatraceActivegateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('product', 'dynatrace-activegate')
    cdk.Tags.of(this).add('Environment', 'integration')
    cdk.Tags.of(this).add('Support-Level', 'verylow')
    cdk.Tags.of(this).add('Cost-Centre', 'cc-abc000')
    cdk.Tags.of(this).add('Sub-Project-Code', 'spc-xyz000')
    cdk.Tags.of(this).add('Name', 'dynatrace-activegate')

    const vpc_id = ec2.Vpc.fromLookup(this, 'vpc-by-id', {
      vpcId: 'vpc-0ed78d1d0d9b9015e',
    }) //shared-dev-vpc

    const linux_ami = new ec2.GenericLinuxImage({
      'eu-west-2': 'ami-00c442ed0876cbc2b',
      'eu-west-3': 'ami-07bed4309217a9aab',
    })  // AMI: CIS hardened Ubuntu Linux 20.04 LTS

    const activegate_sg = new ec2.SecurityGroup(this, 'activegate_sg', {
      securityGroupName: 'activegate_sg',
      description: 'Allows Dynatrace traffic IN for autoscaling group',
      vpc: vpc_id,
    })

    activegate_sg.addIngressRule(
      ec2.Peer.ipv4('172.30.0.0/24'),
      ec2.Port.tcp(443),
      'Allow Activegate traffic from dynatrace-transit-vpc'
    )

    activegate_sg.addIngressRule(
      ec2.Peer.ipv4('172.30.0.0/24'),
      ec2.Port.tcp(9999),
      'Allow OneAgent traffic from dynatrace-transit-vpc'
    )

    const activegate_role = new iam.Role(this, 'activegate_role', {
      description: 'Dynatrace ActiveGate EC2 role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    })

    activegate_role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    )

    new autoscaling.AutoScalingGroup(this, 'activegate-asg', {
      vpc: vpc_id,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: activegate_role,
      securityGroup: activegate_sg,
      userData: ec2.UserData.custom("./lib/user-data.sh"),
      machineImage: linux_ami,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MEDIUM,
      ),
      minCapacity: 1,
      maxCapacity: 2,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: {
            ebsDevice: {
              deleteOnTermination: false,
              volumeSize: 24
            }
          }
        }
      ],
    })
  }
}
