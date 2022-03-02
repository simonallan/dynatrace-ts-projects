import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { readFileSync } from 'fs';

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

    // Needs improving! Filter for latest AMI, don't hardcode images
    // Set AMI to CIS hardened Ubuntu Linux 20.04 LTS
    const linux_ami = new ec2.GenericLinuxImage({
      'eu-west-2': 'ami-00c442ed0876cbc2b',
      'eu-west-3': 'ami-07bed4309217a9aab',
    })

    // Read-in userData from file
    const user_data = readFileSync('./src/user-data.sh', 'utf8');

    const activegate_sg = new ec2.SecurityGroup(this, 'activegate_sg', {
      securityGroupName: 'activegate_sg',
      description: 'Allows Dynatrace traffic IN for autoscaling group',
      vpc: vpc_id,
    })

    // Allow Activegate traffic
    activegate_sg.addIngressRule(
      ec2.Peer.ipv4('172.20.0.0/24'),
      ec2.Port.tcp(443),
      'Allow Activegate traffic from dynatrace-transit-vpc'
    )

    // Allow OneAgent traffic
    activegate_sg.addIngressRule(
      ec2.Peer.ipv4('172.20.0.0/24'),
      ec2.Port.tcp(9999),
      'Allow OneAgent traffic from dynatrace-transit-vpc'
    )

    // IAM policy to allow ActiveGate to assume the 'dynatrace-integration-role' into other LZ accounts
    const aws_monitoring = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [
            'arn:aws:iam::524843571212:role/DynatraceIntegrationRole',
            // Add additional accounts to monitor by adding the ARNs to the list of resources Eg:
            //'arn:aws:iam::<account number>:role/dynatrace-integration-role'
          ],
          actions: ['sts:AssumeRole'],
          effect: iam.Effect.ALLOW
        })
      ]
    })

    // Create ActiveGate IAM role and add policies
    const dynatrace_activegate_role = new iam.Role(this, 'dynatrace-activegate-role', {
      description: 'Dynatrace ActiveGate role',
      roleName: 'DynatraceActiveGateRole',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        dynatrace_aws_integration_policy: aws_monitoring,
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    })

    // Create ASG to provision ActiveGate instances
    new autoscaling.AutoScalingGroup(this, 'activegate-asg', {
      vpc: vpc_id,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: dynatrace_activegate_role,
      securityGroup: activegate_sg,
      userData: ec2.UserData.custom(user_data),
      machineImage: linux_ami,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MEDIUM,
      ),
      minCapacity: 1,
      maxCapacity: 1,
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
