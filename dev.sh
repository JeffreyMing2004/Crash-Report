#!/bin/bash
cd "$(dirname "$0")"
cd server && npm run dev &
sleep 2
cd ../client && npm run dev
