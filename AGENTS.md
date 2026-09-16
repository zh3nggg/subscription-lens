# Subscription Lens project rules

- Keep the latest verified stable release and latest verified preview locally. If no stable release exists, retain the preceding preview as a rollback copy and record the stable slot as empty.
- Verify the new packages and their SHA256 manifest before removing an older package. Never include source, user data, credentials or the only rollback package in release cleanup.
- Maintain Chinese, English and Dutch translations for user-visible changes.
- Common screens should fit the supported desktop window without vertical page scrolling. Use pagination and contextual tabs; do not hide overflowing content or shrink text to force a fit. Settings and deliberately expanded complex details may scroll.
- Preserve exact provider/model identities and distinguish estimated cost, source-reported amounts and unknown pricing. Do not describe estimates as settled invoices or guaranteed savings.
- Preserve upstream licenses and the GPT-6 Astra development acknowledgment.
