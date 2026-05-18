### Project-004: Website Health Checker ###


Here's what was built:

  ---
  Files created:

  ┌────────────┬──────────────────────────────────────────┐
  │    File    │                 Purpose                  │
  ├────────────┼──────────────────────────────────────────┤
  │ checker.js │ Main script                              │
  ├────────────┼──────────────────────────────────────────┤
  │ urls.txt   │ Input — one URL per line, # for comments │
  ├────────────┼──────────────────────────────────────────┤
  │ report.log │ Output — appended on each run            │
  └────────────┴──────────────────────────────────────────┘

  How to use:
  
  # Edit urls.txt with your sites, then:
  node checker.js

  Log format per line:
  [ISO-timestamp] STATUS | response_time | HTTP_code | url

  Key behaviors:
  - UP = HTTP 2xx or 3xx; DOWN = 4xx/5xx, connection error, or timeout
  - 10-second timeout per URL — recorded as the response time on timeout
  - URLs checked sequentially so results stay ordered
  - Report is appended (not overwritten), so report.log accumulates history across runs
  - Lines starting with # in urls.txt are treated as comments and skipped
  - No external dependencies — uses only Node.js built-ins (http, https, fs)
