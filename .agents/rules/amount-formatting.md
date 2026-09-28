---
description: Rule for formatting currency and amounts in inputs and displays
---

# Amount Formatting Rule

Whenever you are building UI components that require the user to input an amount (e.g., fees, prices, salaries, etc.) or when displaying amounts:
1. Ensure the amount input fields have comma separation formatted automatically as the user types (e.g. 10000 becomes 10,000). Use `type="text"` instead of `type="number"` and format on `onChange`. Ensure the unformatted number is sent to the backend.
2. When displaying amounts, always use Indian number format (`toLocaleString('en-IN')` or similar depending on the context).
3. Consistently apply this formatting rule across the entire application unless specifically requested otherwise by the user.
