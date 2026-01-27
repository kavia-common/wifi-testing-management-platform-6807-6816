#!/bin/bash
cd /home/kavia/workspace/code-generation/wifi-testing-management-platform-6807-6816/wifi_test_management_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

