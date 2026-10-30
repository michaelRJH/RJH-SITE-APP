#!/bin/bash
D=/tmp/claude-0/-home-claude/3bdf11f6-1731-5200-b8a6-28887e20452a/scratchpad/site
curl -s -o /dev/null localhost:8765 || { cd $D && setsid nohup python3 -m http.server 8765 >/dev/null 2>&1 < /dev/null & sleep 1; }
