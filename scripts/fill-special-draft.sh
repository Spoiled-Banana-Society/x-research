#!/bin/bash
# Fill a special draft: adds 9 wallets to queue + creates Go API draft + fills with bots
# Usage: ./fill-special-draft.sh [jackpot|hof]

TYPE="${1:-jackpot}"
WALLET="0xd3301bC039faF4223dA98bcEB5Fb818C9993620"
API="https://sbs-drafts-api-staging-652484219017.us-central1.run.app"
VERCEL="https://banana-fantasy-sbs.vercel.app"

echo "=== Filling $TYPE special draft ==="

# Step 1: Add 9 fake wallets to the queue (so queue shows 10/10)
echo "Adding 9 players to queue..."
for i in $(seq 1 9); do
  W="0x$(openssl rand -hex 20)"
  curl -s -X POST "$VERCEL/api/admin/set-entries" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$W\",\"${TYPE}Entries\":1}" > /dev/null
  curl -s -X POST "$VERCEL/api/queues" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$W\",\"queueType\":\"$TYPE\"}" > /dev/null
done

# Step 2: Get draftId from queue
sleep 2
DRAFT_ID=$(curl -s "$VERCEL/api/queues" | python3 -c "import sys,json; print(json.load(sys.stdin)['$TYPE']['rounds'][0].get('draftId',''))")
echo "DraftId: $DRAFT_ID"

if [ -z "$DRAFT_ID" ] || [ "$DRAFT_ID" = "None" ] || [ "$DRAFT_ID" = "null" ]; then
  echo "ERROR: No draftId found. Cloud Function may not have assigned one."
  exit 1
fi

# Step 3: Create the Go API draft with user's wallet
echo "Creating Go API draft..."
curl -s -X POST "$API/staging/create-special-draft" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"$TYPE\",\"wallets\":[\"$WALLET\"]}" > /dev/null

# Step 4: Fill with 9 bots on Go API
echo "Filling with 9 bots..."
curl -s -X POST "$API/staging/fill-bots/slow?count=9&leagueId=$DRAFT_ID" > /dev/null

# Step 5: Verify
echo ""
QUEUE_COUNT=$(curl -s "$VERCEL/api/queues" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['$TYPE']['rounds'][0]['members']))")
echo "Queue: $QUEUE_COUNT/10"

curl -s "$API/draft/$DRAFT_ID/state/info" | python3 -c "
import sys,json; d=json.load(sys.stdin)
w='0xd3301bC039faF4223dA98bcEB5Fb818C9993620'.lower()
pos=next((i+1 for i,p in enumerate(d['draftOrder']) if w in p['ownerId'].lower()),0)
print(f'Go API: {len(d[\"draftOrder\"])}/10, pick #{d[\"pickNumber\"]}, you=#{pos}, started={bool(d.get(\"draftStartTime\"))}')
"
echo "=== Done ==="
