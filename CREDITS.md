# Credits & Inspirations

## Dashboard Shell Pattern
The sidebar + topbar layout with collapsible navigation groups is inspired by [TailAdmin](https://tailadmin.com/), an open-source admin dashboard template. We adapted the structure to a dark-mode Material-inspired design system using custom CSS variables.

## Chart & Data Visualization Pattern
The environmental dashboard's chart compositions (line trends, scope breakdown pie, department bar charts) draw inspiration from open-source ESG analytics dashboards and reporting tools. Chart implementation uses [Recharts](https://recharts.org/), a React charting library built on D3.

## Gamification Rule Engine Pattern
The JSON-driven badge unlock rule engine (`Badge.check_eligibility()` evaluating `unlock_rule` JSON) is inspired by the approach used in open-source Django gamification frameworks like [django-badgify](https://github.com/ulule/django-badgify), adapted to use declarative JSON rules instead of Python recipe classes for easier admin management.
