# Recipe Economy Report

One fully staffed facility, local input purchases, normal market diffusion, assigned-staff wages, and repairs at 70% condition. Initial margin is a full-cycle initial-market rate including expected maintenance and wages; it does not treat input purchase timing as a loss.

## Recipe windows

Each recipe is assessed in a base market and a Network III market with Local Market Network III and Market Diffusion Network III already owned. The facility is fully staffed, and all assigned-worker wages are included in every margin and payback calculation. The Network III scenario measures recipe resilience; its research is pre-owned and is not charged to facility payback. Every margin cell also shows Generated orders max 25%: a comparison that uses the live deterministic customer catalogue, generated bids, and standard lots, but fulfils no more than 25% of each recipe output. It is not guaranteed demand. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first completed output cycle with a non-positive margin, so a later recovery remains possible.

## Animal Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Raise Cattle | Base market | 892.50/131.00 | 11.59 | 9.38/6.89/4.33<br>Generated orders max 25%: 4.98/3.48/2.83 | 2.78/27.8% | 50.45 | 120.00 | not reached | 213 |
| Raise Cattle | Network III | 892.50/131.00 | 11.59 | 9.98/8.15/5.63<br>Generated orders max 25%: 5.36/4.29/3.71 | 2.05/20.5% | 50.44 | 120.00 | not reached | 158 |
| Raise Chicken | Base market | 892.50/170.00 | 19.28 | 16.44/12.44/8.42<br>Generated orders max 25%: 10.96/9.94/6.08 | 2.40/24.0% | 42.65 | 120.00 | not reached | 78 |
| Raise Chicken | Network III | 892.50/170.00 | 19.28 | 17.38/14.28/10.14<br>Generated orders max 25%: 11.53/11.12/7.25 | 1.77/17.7% | 42.64 | 120.00 | not reached | 64 |
| Raise Sheep | Base market | 892.50/150.00 | 18.70 | 16.36/12.96/9.16<br>Generated orders max 25%: 10.32/8.18/7.69 | 2.71/27.1% | 46.70 | 120.00 | not reached | 73 |
| Raise Sheep | Network III | 892.50/150.00 | 18.70 | 17.08/14.45/10.63<br>Generated orders max 25%: 10.76/9.13/8.65 | 2.02/20.2% | 46.69 | 120.00 | not reached | 63 |

## Assembly Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assemble Industrial Machines | Base market | 6330.00/320.00 | 80.35 | 28.49/14.83/-0.44<br>Generated orders max 25%: -14.99/-11.79/-24.99 | 43.64/29.1% | 463.25 | 720.00 | 3 | not reached |
| Assemble Industrial Machines | Network III | 6330.00/320.00 | 80.35 | 37.98/31.23/17.17<br>Generated orders max 25%: -8.27/0.31/-11.44 | 34.49/23.0% | 493.79 | 720.00 | 3 | not reached |

## Bakery

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bake Bread | Base market | 1980.00/167.00 | 38.30 | 34.04/27.71/19.97<br>Generated orders max 25%: 23.08/21.00/14.40 | 0.70/29.1% | 96.16 | 120.00 | not reached | 76 |
| Bake Bread | Network III | 1980.00/167.00 | 38.30 | 35.31/30.54/22.95<br>Generated orders max 25%: 23.86/22.79/16.35 | 0.52/21.7% | 96.14 | 120.00 | not reached | 67 |
| Bake Cake | Base market | 1980.00/212.00 | 70.71 | 48.18/26.48/13.53<br>Generated orders max 25%: 35.01/21.72/10.27 | 4.73/67.5% | 98.70 | 120.00 | 186 | 103 |
| Bake Cake | Network III | 1980.00/212.00 | 70.71 | 56.00/36.67/21.03<br>Generated orders max 25%: 40.07/29.21/16.16 | 4.19/59.9% | 98.67 | 120.00 | not reached | 51 |
| Bake Meat Pie | Base market | 1980.00/254.00 | 33.58 | 18.48/1.81/-5.98<br>Generated orders max 25%: 8.50/-2.68/-9.14 | 4.80/60.0% | 105.68 | 120.00 | 27 | not reached |
| Bake Meat Pie | Network III | 1980.00/254.00 | 33.58 | 24.06/11.25/1.67<br>Generated orders max 25%: 12.42/4.91/-2.71 | 4.12/51.6% | 105.65 | 120.00 | 56 | not reached |
| Bake Premium Cake | Base market | 1980.00/283.00 | 86.88 | 61.07/34.67/17.30<br>Generated orders max 25%: 42.68/25.76/11.44 | 7.19/59.9% | 102.06 | 120.00 | 180 | 54 |
| Bake Premium Cake | Network III | 1980.00/283.00 | 86.88 | 69.57/48.17/28.05<br>Generated orders max 25%: 48.16/35.72/19.92 | 6.21/51.8% | 102.04 | 120.00 | not reached | 34 |

## Chemical Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Chemicals | Base market | 3220.00/198.00 | 13.48 | 7.88/4.00/0.38<br>Generated orders max 25%: 3.03/0.61/-1.96 | 5.12/51.2% | 223.86 | 420.00 | 49 | not reached |
| Produce Chemicals | Network III | 3220.00/198.00 | 13.48 | 9.08/6.34/2.61<br>Generated orders max 25%: 3.75/2.16/-0.37 | 4.18/41.8% | 223.81 | 420.00 | 89 | not reached |
| Produce Plastic | Base market | 3220.00/234.00 | 28.72 | 13.50/-2.36/-12.30<br>Generated orders max 25%: 2.80/-9.12/-13.13 | 8.87/59.2% | 203.78 | 420.00 | 23 | not reached |
| Produce Plastic | Network III | 3220.00/234.00 | 28.72 | 18.17/7.46/-3.19<br>Generated orders max 25%: 6.16/-1.19/-5.45 | 7.44/49.6% | 203.73 | 420.00 | 31 | not reached |
| Synthesize Fertilizer | Base market | 3220.00/239.00 | 17.70 | 8.68/0.21/-6.22<br>Generated orders max 25%: 1.57/-4.19/-4.40 | 6.23/62.3% | 214.57 | 420.00 | 12 | not reached |
| Synthesize Fertilizer | Network III | 3220.00/239.00 | 17.70 | 11.25/5.11/-1.47<br>Generated orders max 25%: 3.24/-0.59/-0.62 | 5.24/52.4% | 214.52 | 420.00 | 30 | not reached |

## Construction Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Bricks | Base market | 2430.00/194.00 | 30.47 | 4.10/-3.67/-6.05<br>Generated orders max 25%: 0.32/-0.88/-5.87 | 1.10/73.1% | 125.97 | 480.00 | 8 | not reached |
| Produce Bricks | Network III | 2430.00/194.00 | 30.47 | 10.25/0.63/-3.14<br>Generated orders max 25%: 4.90/2.63/-3.45 | 1.01/67.4% | 125.94 | 480.00 | 15 | not reached |
| Produce Cement | Base market | 2430.00/241.00 | 25.27 | 10.89/-1.90/-8.44<br>Generated orders max 25%: 2.81/1.20/-8.48 | 3.18/70.7% | 145.60 | 480.00 | 14 | not reached |
| Produce Cement | Network III | 2430.00/241.00 | 25.27 | 15.77/4.81/-3.22<br>Generated orders max 25%: 6.06/6.26/-4.28 | 2.81/62.5% | 145.57 | 480.00 | 27 | not reached |
| Produce Construction Materials | Base market | 2430.00/376.00 | -2.29 | -7.98/-10.12/-13.64<br>Generated orders max 25%: -12.64/-7.22/-13.35 | 5.48/64.5% | 150.88 | 480.00 | 3 | not reached |
| Produce Construction Materials | Network III | 2430.00/376.00 | -2.29 | -6.80/-7.71/-10.63<br>Generated orders max 25%: -11.88/-5.55/-11.01 | 4.36/51.3% | 160.09 | 480.00 | 3 | not reached |
| Produce Reinforced Concrete | Base market | 2430.00/343.00 | 73.24 | 42.73/15.19/-2.40<br>Generated orders max 25%: 26.62/16.02/-3.60 | 17.15/77.9% | 165.01 | 480.00 | 45 | not reached |
| Produce Reinforced Concrete | Network III | 2430.00/343.00 | 73.24 | 52.55/28.41/9.06<br>Generated orders max 25%: 33.03/25.91/5.79 | 15.30/69.5% | 164.97 | 480.00 | 89 | not reached |

## Electronics Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Advanced Components | Base market | 4075.00/286.00 | 90.46 | 57.15/42.36/27.20<br>Generated orders max 25%: 26.88/25.26/9.38 | 28.90/28.9% | 284.24 | 360.00 | not reached | 138 |
| Produce Advanced Components | Network III | 4075.00/286.00 | 90.46 | 63.63/55.70/40.37<br>Generated orders max 25%: 31.38/35.45/19.82 | 22.61/22.6% | 284.18 | 360.00 | not reached | 81 |
| Produce Silicon | Base market | 4075.00/211.00 | 22.37 | 15.45/9.04/3.66<br>Generated orders max 25%: 8.37/8.32/1.84 | 12.83/53.5% | 260.25 | 360.00 | 129 | not reached |
| Produce Silicon | Network III | 4075.00/211.00 | 22.37 | 17.27/12.38/6.91<br>Generated orders max 25%: 9.48/10.55/4.18 | 10.46/43.6% | 260.19 | 360.00 | 138 | not reached |

## Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grow Fruit | Base market | 252.50/124.00 | 7.73 | 6.53/5.29/4.16<br>Generated orders max 25%: 3.86/4.29/2.70 | 0.12/12.8% | 11.62 | 60.00 | not reached | 46 |
| Grow Fruit | Network III | 252.50/124.00 | 7.73 | 6.95/5.91/4.68<br>Generated orders max 25%: 4.13/4.72/3.06 | 0.09/9.6% | 11.62 | 60.00 | not reached | 41 |
| Grow Grain | Base market | 252.50/108.00 | 4.81 | 1.25/-0.56/-0.98<br>Generated orders max 25%: -2.75/-2.71/-3.40 | 0.14/17.2% | 13.35 | 60.00 | 13 | not reached |
| Grow Grain | Network III | 252.50/108.00 | 4.81 | 2.60/1.03/0.34<br>Generated orders max 25%: -1.71/-1.45/-2.32 | 0.10/12.9% | 13.35 | 60.00 | 91 | not reached |
| Grow Sugar | Base market | 252.50/104.00 | 1.35 | 0.17/-0.75/-1.02<br>Generated orders max 25%: -1.81/-0.93/-1.97 | 0.06/8.1% | 12.07 | 60.00 | 10 | not reached |
| Grow Sugar | Network III | 252.50/104.00 | 1.35 | 0.65/-0.05/-0.42<br>Generated orders max 25%: -1.41/-0.34/-1.45 | 0.04/6.2% | 12.06 | 60.00 | 22 | not reached |

## Industrial Processing Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electric Circuits | Base market | 1705.00/219.00 | 63.93 | 47.48/30.69/18.01<br>Generated orders max 25%: 21.08/19.88/3.55 | 5.08/20.3% | 114.11 | 360.00 | not reached | 52 |
| Produce Electric Circuits | Network III | 1705.00/219.00 | 63.93 | 52.25/40.63/28.71<br>Generated orders max 25%: 24.66/27.96/12.54 | 3.85/15.4% | 114.09 | 360.00 | not reached | 37 |
| Produce Steel | Base market | 1705.00/171.00 | 33.68 | 16.97/1.31/-7.52<br>Generated orders max 25%: 7.33/1.88/-8.50 | 5.02/71.8% | 105.64 | 360.00 | 24 | not reached |
| Produce Steel | Network III | 1705.00/171.00 | 33.68 | 22.68/9.67/-0.58<br>Generated orders max 25%: 11.19/8.30/-2.81 | 4.41/63.0% | 105.62 | 360.00 | 49 | not reached |

## Mine

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mine Coal | Base market | 672.50/89.00 | 21.27 | 9.60/1.68/-1.94<br>Generated orders max 25%: 5.23/2.89/-2.12 | 1.33/73.9% | 40.20 | 300.00 | 24 | not reached |
| Mine Coal | Network III | 672.50/89.00 | 21.27 | 13.41/5.59/0.84<br>Generated orders max 25%: 7.84/5.89/0.11 | 1.20/66.7% | 40.20 | 300.00 | 62 | not reached |
| Mine Copper | Base market | 672.50/135.00 | 7.96 | 2.20/-2.26/-4.58<br>Generated orders max 25%: -3.21/-6.05/-5.08 | 2.12/42.3% | 42.51 | 300.00 | 12 | not reached |
| Mine Copper | Network III | 672.50/135.00 | 7.96 | 4.29/0.65/-1.97<br>Generated orders max 25%: -1.66/-3.88/-3.06 | 1.71/34.2% | 42.51 | 300.00 | 31 | not reached |
| Mine Gold | Base market | 672.50/131.00 | 22.29 | 15.41/9.18/4.78<br>Generated orders max 25%: 8.61/7.47/2.51 | 39.01/48.8% | 44.75 | 300.00 | 68 | 100 |
| Mine Gold | Network III | 672.50/131.00 | 22.29 | 17.60/12.48/7.76<br>Generated orders max 25%: 10.09/9.77/4.68 | 31.93/39.9% | 44.75 | 300.00 | 190 | 52 |
| Mine Iron | Base market | 672.50/94.00 | 10.12 | 3.04/-2.98/-6.01<br>Generated orders max 25%: -2.76/-6.72/-6.02 | 2.30/51.1% | 41.15 | 300.00 | 13 | not reached |
| Mine Iron | Network III | 672.50/94.00 | 10.12 | 5.70/0.72/-2.77<br>Generated orders max 25%: -0.84/-3.94/-3.47 | 1.91/42.4% | 41.15 | 300.00 | 29 | not reached |

## Power Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coal Power | Base market | 1725.00/128.00 | -4.63 | -6.69/-7.69/-8.30<br>Generated orders max 25%: -8.60/-9.30/-8.64 | 0.10/24.2% | 116.69 | 540.00 | 1 | not reached |
| Coal Power | Network III | 1725.00/128.00 | -4.63 | -6.02/-6.89/-7.51<br>Generated orders max 25%: -8.14/-8.68/-8.00 | 0.08/19.7% | 116.67 | 540.00 | 1 | not reached |
| Solar Power | Base market | 1725.00/100.00 | -8.24 | -8.40/-8.48/-8.63<br>Generated orders max 25%: -8.94/-8.98/-9.05 | 0.03/7.4% | 94.11 | 540.00 | 1 | not reached |
| Solar Power | Network III | 1725.00/100.00 | -8.24 | -8.36/-8.44/-8.58<br>Generated orders max 25%: -8.92/-8.96/-9.02 | 0.02/5.5% | 94.09 | 540.00 | 1 | not reached |

## Quarry

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quarry Clay | Base market | 965.00/104.00 | 4.33 | 2.62/1.00/0.07<br>Generated orders max 25%: -0.09/-1.15/-0.50 | 0.16/20.1% | 45.25 | 180.00 | 54 | not reached |
| Quarry Clay | Network III | 965.00/104.00 | 4.33 | 3.26/1.95/0.83<br>Generated orders max 25%: 0.36/-0.48/0.05 | 0.12/15.5% | 45.24 | 180.00 | 116 | not reached |
| Quarry Minerals | Base market | 965.00/144.00 | 13.27 | 6.99/3.19/1.64<br>Generated orders max 25%: 3.00/3.06/0.30 | 0.37/36.6% | 45.25 | 180.00 | 178 | not reached |
| Quarry Minerals | Network III | 965.00/144.00 | 13.27 | 9.19/5.56/3.42<br>Generated orders max 25%: 4.52/4.81/1.64 | 0.30/30.2% | 45.24 | 180.00 | not reached | not reached |
| Quarry Sand | Base market | 965.00/84.00 | 4.73 | 1.39/-1.31/-2.28<br>Generated orders max 25%: -1.14/-2.98/-2.40 | 0.17/41.6% | 44.32 | 180.00 | 13 | not reached |
| Quarry Sand | Network III | 965.00/84.00 | 4.73 | 2.63/0.29/-1.07<br>Generated orders max 25%: -0.28/-1.80/-1.47 | 0.14/34.8% | 44.31 | 180.00 | 26 | not reached |
| Quarry Stone | Base market | 965.00/124.00 | 22.42 | 13.27/6.43/3.34<br>Generated orders max 25%: 6.95/2.26/2.74 | 0.82/41.0% | 46.88 | 180.00 | 190 | not reached |
| Quarry Stone | Network III | 965.00/124.00 | 22.42 | 16.56/10.47/6.35<br>Generated orders max 25%: 9.28/5.26/5.05 | 0.68/34.2% | 46.87 | 180.00 | not reached | 131 |

## Small Utility Works

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electricity | Base market | 592.50/74.00 | 6.49 | 5.30/4.65/3.73<br>Generated orders max 25%: 3.76/3.30/3.68 | 0.06/15.3% | 28.68 | 60.00 | not reached | 151 |
| Produce Electricity | Network III | 592.50/74.00 | 6.49 | 5.65/4.99/3.99<br>Generated orders max 25%: 3.97/3.52/3.85 | 0.05/12.3% | 28.67 | 60.00 | not reached | 138 |
| Produce Water | Base market | 592.50/53.00 | 1.59 | 1.11/0.66/0.34<br>Generated orders max 25%: 0.54/0.24/0.52 | 0.03/29.1% | 24.59 | 60.00 | 168 | not reached |
| Produce Water | Network III | 592.50/53.00 | 1.59 | 1.28/0.88/0.51<br>Generated orders max 25%: 0.65/0.38/0.64 | 0.02/23.3% | 24.59 | 60.00 | 201 | not reached |

## Water Well

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Electric Pumping | Base market | 465.00/91.00 | 1.37 | -0.57/-1.53/-1.63<br>Generated orders max 25%: -1.52/-0.64/-1.62 | 0.04/43.0% | 21.51 | 60.00 | 5 | not reached |
| Electric Pumping | Network III | 465.00/91.00 | 1.37 | 0.10/-0.86/-1.14<br>Generated orders max 25%: -1.05/-0.13/-1.24 | 0.04/36.3% | 21.51 | 60.00 | 9 | not reached |
| Manual Pumping | Base market | 465.00/46.00 | 1.68 | 1.20/0.75/0.42<br>Generated orders max 25%: 0.63/0.33/0.60 | 0.03/29.1% | 19.31 | 60.00 | 201 | not reached |
| Manual Pumping | Network III | 465.00/46.00 | 1.68 | 1.37/0.97/0.59<br>Generated orders max 25%: 0.74/0.47/0.72 | 0.02/23.3% | 19.31 | 60.00 | 201 | not reached |

## Connected-chain economy (180 minutes)

Each row runs all listed facilities in one shared base market. Upstream production is available to downstream facilities before each minute ends; the chain retains the following minute's required inputs and sells every other produced good. Every fully staffed facility pays its assigned-worker wages in every margin and payback calculation. Every margin cell also shows Generated orders max 25%: real generated customer orders may fulfil only from the chain's named primary outputs, up to 25% of their produced volume. Bids and lot sizes use live sales rules, so the realised share can be lower. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first output minute with a non-positive margin, so a later recovery remains possible. Setup cost includes land, Construction Materials, Industrial Machines, and each distinct recipe-unlock research cost. Construction demand consumes the participating facilities' total Construction Materials and Industrial Machines requirement evenly through the 180-minute scenario; it is external demand, not a player expense. A scenario that stalls a facility is treated as an invalid report scenario.

| chain | primary output | facilities | setup cost (EUR) | market input cost (EUR) | staff wages 180m | margin 15m/60m/180m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Staples: utilities -> Farm | Grain, Sugar | Small Utility Works x2, Farm x2 | 2029.00 | 1713.64 | 720.00 | 10.13/7.52/4.89<br>Generated orders max 25%: 4.15/3.61/1.02 | not reached | not reached |
| Extraction: utilities -> Mine | Coal, Iron, Copper | Small Utility Works x2, Mine x3 | 3647.50 | 5163.89 | 3060.00 | 20.74/1.89/-8.74<br>Electricity max 1.5x: 20.74/1.89/-8.50<br>Generated orders max 25%: 5.17/-4.41/-14.35 | 26 | not reached |
| Fertilizer bridge: quarry -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2 | 10015.00 | 1949.23 | 3780.00 | 24.83/0.21/-4.08<br>Generated orders max 25%: 18.85/-3.70/-7.95 | 38 | not reached |
| Fertilizer bridge: market inputs -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Chemical Plant x1, Farm x2 | 5488.00 | 2498.17 | 1980.00 | 13.05/8.96/2.71<br>Generated orders max 25%: 7.07/5.05/-1.16 | 67 | not reached |
| Fertilizer: quarry -> Fertilizer | Fertilizer | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 9298.00 | 128.50 | 3420.00 | 20.35/-1.42/-6.29<br>Generated orders max 25%: 13.24/-5.83/-4.46 | 38 | not reached |
| Plastic: quarry -> Plastic | Plastic | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 9293.00 | 276.60 | 3420.00 | 28.12/4.79/0.05<br>Generated orders max 25%: 17.42/-1.97/-0.77 | 39 | not reached |
| Steel: mines -> Steel | Steel | Small Utility Works x2, Mine x2, Industrial Processing Factory x1 | 4716.00 | 2873.99 | 3240.00 | 41.49/17.45/2.20<br>Generated orders max 25%: 31.84/18.02/1.23 | 39 | not reached |
| Poultry -> Cake | Cake | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 12913.00 | 2230.90 | 4320.00 | 90.08/-0.52/-16.72<br>Generated orders max 25%: 76.92/-5.28/-19.97 | 71 | not reached |
| Cattle -> Meat Pie | Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 12916.00 | 3449.80 | 4320.00 | 54.80/-27.89/-49.35<br>Generated orders max 25%: 44.81/-32.38/-52.50 | 38 | not reached |
| Animal farm and bakery: inputs -> Cake, Premium Cake, and Meat Pie | Cake, Premium Cake, Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2, Animal Farm x3, Bakery x3 | 19852.50 | 4115.50 | 5940.00 | 193.55/107.33/-232.43<br>Electricity max 1.5x: 193.55/107.35/-232.42<br>Generated orders max 25%: 152.01/85.70/-245.79 | 101 | not reached |
| Construction: inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Mine x2, Quarry x3, Industrial Processing Factory x1, Construction Factory x4 | 19894.00 | 11623.99 | 12060.00 | 113.99/95.72/-13.49<br>Electricity max 1.5x: 123.97/107.29/-2.01<br>Generated orders max 25%: 101.08/81.81/-110.19 | 1 | not reached |
| Industrial Machines: inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Quarry x2, Chemical Plant x2, Mine x4, Electronics Factory x2, Industrial Processing Factory x2, Assembly Plant x1 | 33675.00 | 20049.76 | 15480.00 | 348.16/220.18/-107.72<br>Electricity max 1.5x: 367.97/242.25/-84.83<br>Generated orders max 25%: 258.90/177.76/-146.09 | 1 | not reached |
| Construction Materials: market inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Construction Factory x1 | 5215.00 | 3034.85 | 3240.00 | 5.13/-11.99/-20.02<br>Generated orders max 25%: -4.59/-9.73/-19.73 | 1 | not reached |
| Industrial Machines: market inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Assembly Plant x1 | 9059.00 | 20157.75 | 3960.00 | -275.82/-0.33/-15.19<br>Generated orders max 25%: -327.30/-29.25/-40.58 | 1 | not reached |

