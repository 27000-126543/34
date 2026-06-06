#!/bin/bash
echo "Starting 50 concurrent WebSocket clients..."
for i in $(seq 1 50); do
  echo "Starting client $i"
  node simulateClient.js $i &
done
wait
echo "All clients finished"
