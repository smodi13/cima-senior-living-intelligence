# Cima Senior Living Intelligence: Financial Methodology Review (2026-11-02)

## Authority and scope

This financial review is prepared by ChatGPT as the independent investment-analysis owner. Claude Code may implement the approved formulas in software, write tests, update files and deploy. It should not independently alter financial assumptions, investor economics or the real estate investment recommendation.

The reviewed workbook is the authoritative new reference for the financial logic in this update. Do not assume it is reconciled with the live website until engineering parity checks pass.

## What changed

1. The six real estate acquisition operating cases, inputs, assumptions, annual forecasts, financing schedules, base/down/up property IRRs, property MOICs, maximum bids and original sensitivities were **not changed**.
2. `Sources!G10:G12` now includes the verified NIC article URL with the trailing slash; `Sources!G14` uses the verified official CBRE URL.
3. `LP Waterfall!M6:N10` was revised to show GP capital participation plus GP promote explicitly, while preserving the original 90% LP / 10% GP equity contributions, 8% LP-only annual preference, capital-return-first ordering, 20% GP promote input and annual modeling horizon.
4. `LP Waterfall!W6:W10` calculates the GP co-investment share of residual, `X6:X10` calculates the GP promote on the LP residual share. `N` is the sum of those two sources; `M` is the residual allocated to LPs. The resulting profit split, after LP capital return and pref, is 72% LP and 28% GP in the current case (90% LP share less 20% of that LP share = 72%; 10% GP co-invest + 18% promote = 28%). The percentages here are calculated explanations, not additional hardcoded model inputs.
5. The `Debt Treatment` worksheet separately presents the original sponsor-funded loan payoff treatment and an **illustrative limited-recourse exit-only variant** that floors sale equity proceeds at zero without forgiving annual operating deficits. Neither is a claim regarding the actual loan guaranty or lender remedies.
6. The companion reviewed investment committee memo updates investor-level results and financing discussion. It replaces the prior memo for employer-facing use.

## Key results, North Texas Base

- Base property-level leveraged IRR: unchanged, approximately 19.2%.
- LP contribution: approximately $21.8 million.
- GP co-investment: approximately $2.4 million.
- LP-level modeled IRR with revised illustrative waterfall: approximately 17.5%.
- GP-level modeled IRR with revised illustrative waterfall: approximately 31.3%.
- LP distributions: approximately $44.5 million.
- GP distributions: approximately $8.5 million.
- Return of LP and GP capital plus LP preferred distributions remain calculated as before.

## Sale payoff gaps, existing downside cases

- North Texas Downside: approximately $4,750,480 after sale costs.
- Katy Downside: approximately $1,365,406 after sale costs.

Under the original sponsor-supported treatment, the funding gap is part of the negative terminal equity cash flow. Under the limited-recourse exit-only illustration, terminal sale cash distributed to equity is zero when the net property sale proceeds fall below the lender payoff amount. This is NOT a full legal model of bankruptcy, recourse carve-outs, future cash calls, deficiency judgments or lender workouts.

## Engineering acceptance tests

1. Compare all six annual real estate cases and all original operating/financing/return metrics against the newly reviewed workbook. Values should be unchanged from the earlier reference.
2. Compare all five `LP Waterfall` years, including columns M, N, O, P, W and X and LP / GP IRRs in cells B19 and B20.
3. Verify `GP residual = GP co-invest residual + GP promote`, and that LP and GP distributions equal available distributable cash in each year.
4. Verify the new `Debt Treatment` sheet for all six cases, including the difference between alternative and original Year 5 equity cash flows being equal to the modeled exit payoff gap.
5. Preserve other prior tests, interactive controls, source links and downloadable files.
6. Replace the public Excel and investment memo with the reviewed versions only after the application engine and tests have been updated to match.
7. Preserve attribution that the model is independent, illustrative and not endorsed by Cima.
8. Update GitHub README screenshots after the revision and conduct production smoke tests on the deployed site.

## Important lender diligence

The 1.25x DSCR threshold in the Inputs sheet is an internal analyst screen, NOT a covenant claimed for this Cima transaction. Fannie Mae's public Seniors Housing Financing Term Sheet lists minimum 1.40x DSCR when more than 50% assisted living and/or dementia care, and 1.30x when more than 50% independent living, but the actual transaction's lender and loan terms are not established by the public acquisition announcement. Source: https://multifamily.fanniemae.com/financing-options/seniors-housing/seniors-housing-financing-term-sheet

## Additional methodological caveats

The LP preference is simple annual accrual on beginning unrecovered LP capital and is tracked until paid. Capital return before preferred return is intentional in this illustrative model. It is not represented as Cima's LPA. No GP catch-up, clawback or tax distributions are modeled. Annual property-level underwriting is not monthly lending underwriting.
