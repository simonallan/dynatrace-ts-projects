#!/bin/bash -xe

# Dynatrace ActiveGate installation
# ActiveGate Purpose: Routes OneAgent metrics to Dynatrace Managed cluster.

# Log user-data and send to /dev/console
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
  yum -y update
  echo "Hello from user-data!"

# Upstream Dynatrace ActiveGate service
# Obtained from the Dyntrace PrivateLink endpoint (Network account)
SVCENDPOINT="vpce-0c250a1f4e92602b1-prbp4976.vpce-svc-025328360521f0768.eu-west-2.vpce.amazonaws.com"
SVCPORT="9999"
TENEANTID="36699b27-c445-47c0-b72d-09150c4d693f"

# Download the install script
wget -O Dynatrace-ActiveGate-Linux-x86-1.213.142.sh \
    "https://$SVCENDPOINT:$SVCPORT/e/$TENANTID/api/v1/deployment/installer/gateway/unix/latest?arch=x86&flavor=default" \
    --header="Authorization: Api-Token lV4KLwSaTiyAfE_fFShXY" --no-check-certificate

# Verify signature
wget https://ca.dynatrace.com/dt-root.cert.pem ; \
    ( echo 'Content-Type: multipart/signed; protocol="application/x-pkcs7-signature"; micalg="sha-256"; boundary="--SIGNED-INSTALLER"'; \
    echo ; echo ; echo '----SIGNED-INSTALLER' ; \
    cat Dynatrace-ActiveGate-Linux-x86-1.213.142.sh ) | openssl cms -verify -CAfile dt-root.cert.pem > /dev/null

# Run the installer
# /bin/sh Dynatrace-ActiveGate-Linux-x86-1.213.142.sh PROXY=$SVCENDPOINT

