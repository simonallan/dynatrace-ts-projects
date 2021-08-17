# Dynatrace Activegate

![dynatrace-activegate](images/dynatrace-activegate.png)

## Overview

Dynatrace is CRUK's central monitoring platform. The system employs a central cluster of servers to process data and a web of [ActiveGates](https://www.dynatrace.com/support/help/setup-and-configuration/dynatrace-activegate/basic-concepts/when-do-i-need-to-install-an-activegate/) that act like proxies, relaying data from agents back to the cluster. ActiveGates are placed in environments local to where data collection is needed. To extend Dynatrace into the new Landing Zone accounts we need to deploy new ActiveGates into the shared VPCs and ensure secure connectivity back to the cluster.

## Purpose

The purpose of this project is to automate the provision of ActiveGates as part of lifecycle management. Placing these in an autoscaling group gives us the advantage of automatic machine replacement in the case of emergencies and a platform for performing safe, controlled updates to the instances themselves.

Launching this stack into an environment will create an autoscaling group configured with an EC2 instance launch configuration. This is configured to download and install the Dynatrace Activegate server on provisioning a new instance. This in turn sets-up the instance for monitoring on a CRUK-managed, CIS hardened Ubuntu server. The instance is registered with the Dynatrace cluster and is configured as a new target for local Dynatrace agents. The new Activegate is also added to SSM to provide secure SSH access to the box if needed.

## Deploying the ActiveGate stack

### Setting Application Parameters

A small set of parameters will need to be updated to launch this stack in to fresh environments:

**`bin/dynatrace-activegate.ts`**

Parameter                         | Description
:----                             | :----
`account`                         | Explicitly set per environment
`region`                          | Explicitly set per environment

**`lib/dynatrace_activegate_stack.ts`**

Parameter                         | Description
:----                             | :----
`vpc_id`                          | Explicitly set per environment
`cdk.Tags.of(this).add`           | The CRUK tagging defaults are applied to every object in the stack
`sg_activegate.add_ingress_rule`  | Security Groups must allow traffic on port 443 and 9999

**`lib\user-data.sh`**
Parameter                         | Description
:----                             | :----
`SVCENDPOINT`                     | A Privatelink service endpoint DNS address


### Launch the stack in the Shared Servcies account

Currently the `dynatrace-activegate` stack is deployed from a laptop; a deployment pipeline is planned in the very near future. The TransitVPC script creates two stacks; one in each region that the VPC peering has to bridge. Deploy these with

```bash
cdk deploy (--profile <profilename> / env. credentials) --all
```
