FROM hashicorp/consul-template:0.26.0 as CONSUL

FROM tonlabs/q-server:PR-262-b3.64781d6fd89619bef4aadcf75acd65356e3f080e
COPY --from=CONSUL /bin/consul-template /bin/
# COPY entrypoint.sh entrypoint.sh
ENTRYPOINT []
