set -uo pipefail

PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeXTy96HP29D0bQEfkHtEuYy8nzhsURicKqrC4VMeA0 boke-azure-vm"
RG="blog-rg"
VM="boke"
USER_NAME="azureuser"

# whitelist from previous run, ordered by latency to mainland China
REGIONS="koreacentral indonesiacentral uaenorth indiasouthcentral swedencentral"
SIZES="Standard_B2s Standard_B2ats_v2 Standard_B1ms Standard_B1s"

echo "==== 0/4 warm up token ===="
az account get-access-token --query accessToken -o none 2>/dev/null || true
echo "  subscription: $(az account show --query name -o tsv)"

echo "==== 1/4 prepare resource group ===="
RG_OK=""
for r in $REGIONS; do
    for i in 1 2 3; do
        if out=$(az group create -n "$RG" -l "$r" -o none 2>&1); then
            RG_OK="$r"
            break 2
        fi
        echo "  group try $i @ $r: $(echo "$out" | tail -2 | tr '\n' ' ' | cut -c1-140)"
        sleep 8
    done
done
if [ -z "$RG_OK" ]; then
    echo "RESOURCE_GROUP_FAILED"
    exit 1
fi
echo "  resource group ready in $RG_OK"

echo "==== 2/4 create vm (with retry) ===="
CREATED=""
for r in $REGIONS; do
    for s in $SIZES; do
        for i in 1 2 3; do
            echo "  try $i: $s @ $r"
            if out=$(az vm create -n "$VM" -g "$RG" -l "$r" \
                    --image Ubuntu2404 --size "$s" \
                    --admin-username "$USER_NAME" --ssh-key-values "$PUBKEY" \
                    --public-ip-sku Standard --nsg-rule SSH -o none 2>&1); then
                CREATED="$r $s"
                break 3
            fi
            echo "    err: $(echo "$out" | tail -3 | tr '\n' ' ' | cut -c1-200)"
            if echo "$out" | grep -qiE "SkuNotAvailable|not available in this region|QuotaExceeded|InvalidParameter|InvalidTemplate"; then
                break
            fi
            if echo "$out" | grep -qiE "already exists|Conflict"; then
                if az vm show -n "$VM" -g "$RG" -o none 2>/dev/null; then
                    CREATED="$r $s"
                    break 3
                fi
            fi
            sleep 10
        done
    done
done

if [ -z "$CREATED" ]; then
    echo "ALL_FAILED - copy the lines above and send back"
    exit 1
fi
LOC=$(echo "$CREATED" | cut -d' ' -f1)
SIZE=$(echo "$CREATED" | cut -d' ' -f2)
echo "  created: $VM ($SIZE) in $LOC"

echo "==== 3/4 open ports 80 443 ===="
for p in 80 443; do
    for i in 1 2 3; do
        if az vm open-port -n "$VM" -g "$RG" --port "$p" --priority $((300 + p)) -o none 2>/dev/null; then
            echo "  port $p open"
            break
        fi
        sleep 6
    done
done

echo "==== 4/4 result ===="
IP=$(az vm show -d -n "$VM" -g "$RG" --query publicIps -o tsv 2>/dev/null)
echo ""
echo "########## RESULT ##########"
echo "REGION=$LOC"
echo "SIZE=$SIZE"
echo "PUBLIC_IP=$IP"
echo "USER=$USER_NAME"
echo "############################"
