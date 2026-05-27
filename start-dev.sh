#!/bin/bash
cd "$(dirname "$0")"
cd server && npm run dev &
sleep 1
cd ../client && npm run dev
