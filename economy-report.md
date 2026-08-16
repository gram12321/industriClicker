# Recipe Economy Report

One fully staffed facility, local input purchases, normal market diffusion, and repairs at 70% condition. Initial margin is a full-cycle initial-market rate including expected maintenance; it does not treat input purchase timing as a loss.

## Recipe windows

Each recipe is assessed in a base market and a Network III market with Local Market Network III and Market Diffusion Network III already owned. The Network III scenario measures recipe resilience; its research is pre-owned and is not charged to facility payback. Every margin cell also shows Generated orders max 25%: a comparison that uses the live deterministic customer catalogue, generated bids, and standard lots, but fulfils no more than 25% of each recipe output. It is not guaranteed demand. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first completed output cycle with a non-positive margin, so a later recovery remains possible.

## Animal Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Raise Cattle | Base market | 1105.00/131.00 | 15.67 | 13.16/9.73/6.85<br>Generated orders max 25%: 8.02/8.49/7.90 | 3.15/31.5% | 68.02 | not reached | 160 |
| Raise Cattle | Network III | 1105.00/131.00 | 15.67 | 13.91/11.28/8.46<br>Generated orders max 25%: 8.50/9.50/9.00 | 2.35/23.5% | 68.02 | not reached | 121 |
| Raise Chicken | Base market | 1105.00/170.00 | 24.68 | 21.11/16.04/11.25<br>Generated orders max 25%: 14.82/15.92/14.06 | 2.59/25.9% | 57.03 | not reached | 73 |
| Raise Chicken | Network III | 1105.00/170.00 | 24.68 | 22.26/18.27/13.26<br>Generated orders max 25%: 15.51/17.38/15.44 | 1.94/19.4% | 57.03 | not reached | 61 |
| Raise Sheep | Base market | 1105.00/150.00 | 23.99 | 20.87/16.68/12.57<br>Generated orders max 25%: 13.96/11.32/15.07 | 3.16/31.6% | 62.78 | not reached | 69 |
| Raise Sheep | Network III | 1105.00/150.00 | 23.99 | 21.74/18.53/14.41<br>Generated orders max 25%: 14.50/12.50/16.29 | 2.37/23.7% | 62.78 | not reached | 60 |

## Assembly Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assemble Industrial Machines | Base market | 8030.00/320.00 | 139.67 | 65.25/22.34/-12.80<br>Generated orders max 25%: 98.04/70.59/45.64 | 59.26/39.5% | 791.34 | 2 | not reached |
| Assemble Industrial Machines | Network III | 8030.00/320.00 | 139.67 | 84.33/52.35/20.38<br>Generated orders max 25%: 111.67/93.46/72.28 | 47.99/32.0% | 840.87 | 2 | not reached |

## Bakery

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bake Bread | Base market | 2660.00/167.00 | 43.11 | 38.73/31.23/22.59<br>Generated orders max 25%: 37.47/35.29/29.60 | 0.72/30.0% | 134.47 | not reached | 97 |
| Bake Bread | Network III | 2660.00/167.00 | 43.11 | 40.12/34.37/25.82<br>Generated orders max 25%: 38.32/37.28/31.73 | 0.54/22.5% | 134.47 | not reached | 83 |
| Bake Cake | Base market | 2660.00/212.00 | 78.21 | 53.35/29.40/15.47<br>Generated orders max 25%: 65.23/49.58/34.57 | 4.81/68.8% | 138.00 | not reached | 162 |
| Bake Cake | Network III | 2660.00/212.00 | 78.21 | 61.50/40.30/23.36<br>Generated orders max 25%: 70.51/57.66/40.81 | 4.29/61.3% | 138.00 | not reached | 72 |
| Bake Meat Pie | Base market | 2660.00/254.00 | 37.93 | 21.57/2.69/-5.81<br>Generated orders max 25%: 24.99/15.35/6.61 | 5.00/62.6% | 148.33 | 26 | not reached |
| Bake Meat Pie | Network III | 2660.00/254.00 | 37.93 | 27.49/13.00/2.50<br>Generated orders max 25%: 29.16/23.68/13.63 | 4.32/54.1% | 148.33 | 62 | not reached |
| Bake Premium Cake | Base market | 2660.00/283.00 | 95.69 | 68.29/37.87/19.33<br>Generated orders max 25%: 80.02/62.44/43.30 | 7.54/62.8% | 143.04 | not reached | 91 |
| Bake Premium Cake | Network III | 2660.00/283.00 | 95.69 | 77.50/52.51/30.95<br>Generated orders max 25%: 85.97/73.33/52.53 | 6.53/54.5% | 143.04 | not reached | 46 |

## Chemical Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Chemicals | Base market | 4240.00/198.00 | 28.93 | 20.83/12.39/7.34<br>Generated orders max 25%: 13.84/8.27/8.57 | 5.74/57.4% | 370.02 | not reached | not reached |
| Produce Chemicals | Network III | 4240.00/198.00 | 28.93 | 23.23/15.99/10.67<br>Generated orders max 25%: 15.33/10.73/11.05 | 4.88/48.8% | 370.02 | not reached | not reached |
| Produce Plastic | Base market | 4240.00/234.00 | 51.54 | 25.55/-3.74/-19.76<br>Generated orders max 25%: 10.76/0.96/-7.29 | 9.99/66.6% | 340.12 | 20 | not reached |
| Produce Plastic | Network III | 4240.00/234.00 | 51.54 | 34.60/12.81/-5.13<br>Generated orders max 25%: 17.47/14.83/5.48 | 8.70/58.0% | 340.12 | 45 | not reached |
| Synthesize Fertilizer | Base market | 4240.00/239.00 | 35.23 | 20.32/5.02/-4.76<br>Generated orders max 25%: 10.49/-0.27/3.65 | 6.88/68.8% | 356.67 | 33 | not reached |
| Synthesize Fertilizer | Network III | 4240.00/239.00 | 35.23 | 25.11/12.85/2.55<br>Generated orders max 25%: 13.71/5.75/9.72 | 6.01/60.1% | 356.67 | 86 | not reached |

## Construction Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Bricks | Base market | 3280.00/194.00 | 54.99 | 13.90/2.75/-0.66<br>Generated orders max 25%: 21.89/17.83/13.59 | 1.23/81.7% | 208.00 | 21 | not reached |
| Produce Bricks | Network III | 3280.00/194.00 | 54.99 | 22.33/8.17/3.16<br>Generated orders max 25%: 28.40/22.36/16.85 | 1.16/77.5% | 208.00 | 155 | not reached |
| Produce Cement | Base market | 3280.00/241.00 | 47.28 | 22.76/2.91/-6.26<br>Generated orders max 25%: 12.35/6.58/6.61 | 3.46/76.9% | 243.16 | 25 | not reached |
| Produce Cement | Network III | 3280.00/241.00 | 47.28 | 30.63/12.59/1.15<br>Generated orders max 25%: 17.76/14.16/12.79 | 3.14/69.9% | 243.16 | 59 | not reached |
| Produce Construction Materials | Base market | 3280.00/376.00 | 41.08 | 22.23/6.12/-5.51<br>Generated orders max 25%: 11.63/15.66/7.09 | 14.25/83.8% | 195.31 | 38 | not reached |
| Produce Construction Materials | Network III | 3280.00/376.00 | 41.08 | 27.46/13.97/1.88<br>Generated orders max 25%: 14.95/21.46/13.22 | 12.80/75.3% | 217.28 | 82 | not reached |
| Produce Reinforced Concrete | Base market | 3280.00/343.00 | 116.33 | 64.41/22.21/-2.55<br>Generated orders max 25%: 43.86/45.18/26.04 | 18.20/82.7% | 282.98 | 46 | not reached |
| Produce Reinforced Concrete | Network III | 3280.00/343.00 | 116.33 | 79.83/41.66/13.55<br>Generated orders max 25%: 54.22/60.37/39.74 | 16.67/75.8% | 282.98 | 116 | not reached |

## Electronics Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Advanced Components | Base market | 5350.00/286.00 | 131.12 | 87.51/53.51/30.34<br>Generated orders max 25%: 45.59/81.04/60.87 | 32.67/32.7% | 452.08 | 228 | 169 |
| Produce Advanced Components | Network III | 5350.00/286.00 | 131.12 | 98.58/74.12/50.46<br>Generated orders max 25%: 53.40/97.17/77.17 | 26.59/26.6% | 452.08 | not reached | 82 |
| Produce Silicon | Base market | 5350.00/211.00 | 37.71 | 27.01/16.72/9.39<br>Generated orders max 25%: 17.80/22.55/19.39 | 14.37/59.9% | 413.59 | not reached | not reached |
| Produce Silicon | Network III | 5350.00/211.00 | 37.71 | 29.93/21.59/14.02<br>Generated orders max 25%: 19.60/25.89/22.84 | 12.13/50.6% | 413.59 | not reached | not reached |

## Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grow Fruit | Base market | 295.00/124.00 | 9.50 | 8.19/6.74/5.47<br>Generated orders max 25%: 5.28/7.32/6.77 | 0.12/13.4% | 14.15 | not reached | 42 |
| Grow Fruit | Network III | 295.00/124.00 | 9.50 | 8.64/7.41/6.02<br>Generated orders max 25%: 5.57/7.78/7.16 | 0.09/10.1% | 14.15 | not reached | 38 |
| Grow Grain | Base market | 295.00/108.00 | 6.31 | 2.58/0.48/-0.07<br>Generated orders max 25%: -1.80/2.39/1.72 | 0.16/19.9% | 16.33 | 24 | not reached |
| Grow Grain | Network III | 295.00/108.00 | 6.31 | 3.95/2.11/1.33<br>Generated orders max 25%: -0.75/3.68/2.86 | 0.12/15.0% | 16.33 | 191 | not reached |
| Grow Sugar | Base market | 295.00/104.00 | 2.54 | 1.26/0.22/-0.08<br>Generated orders max 25%: -0.90/0.95/0.78 | 0.06/8.6% | 14.72 | 24 | not reached |
| Grow Sugar | Network III | 295.00/104.00 | 2.54 | 1.78/0.95/0.55<br>Generated orders max 25%: -0.47/1.59/1.34 | 0.05/6.5% | 14.72 | 206 | not reached |

## Industrial Processing Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electric Circuits | Base market | 2130.00/219.00 | 95.73 | 70.31/40.33/20.02<br>Generated orders max 25%: 35.22/41.38/36.50 | 6.16/24.6% | 173.28 | 230 | 46 |
| Produce Electric Circuits | Network III | 2130.00/219.00 | 95.73 | 78.16/56.88/37.81<br>Generated orders max 25%: 41.17/55.10/51.67 | 4.80/19.2% | 173.28 | not reached | 31 |
| Produce Steel | Base market | 2130.00/171.00 | 54.20 | 27.99/4.17/-8.17<br>Generated orders max 25%: 15.73/11.46/6.63 | 5.41/77.3% | 159.35 | 27 | not reached |
| Produce Steel | Network III | 2130.00/171.00 | 54.20 | 36.97/16.02/1.51<br>Generated orders max 25%: 21.99/20.89/14.84 | 4.88/69.7% | 159.35 | 62 | not reached |

## Mine

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mine Coal | Base market | 715.00/89.00 | 35.06 | 17.81/6.87/2.21<br>Generated orders max 25%: 12.43/15.26/10.56 | 1.41/78.6% | 50.47 | 136 | not reached |
| Mine Coal | Network III | 715.00/89.00 | 35.06 | 23.10/11.76/5.66<br>Generated orders max 25%: 16.16/19.10/13.40 | 1.30/72.5% | 50.47 | not reached | 63 |
| Mine Copper | Base market | 715.00/135.00 | 17.31 | 8.72/1.97/-1.46<br>Generated orders max 25%: 1.79/-2.52/3.03 | 2.39/47.8% | 53.57 | 31 | not reached |
| Mine Copper | Network III | 715.00/135.00 | 17.31 | 11.79/5.97/2.14<br>Generated orders max 25%: 4.03/0.49/5.87 | 1.99/39.9% | 53.57 | 133 | not reached |
| Mine Gold | Base market | 715.00/131.00 | 36.41 | 26.33/16.50/10.61<br>Generated orders max 25%: 30.03/21.86/17.65 | 43.70/54.6% | 56.57 | not reached | 36 |
| Mine Gold | Network III | 715.00/131.00 | 36.41 | 29.64/21.04/14.66<br>Generated orders max 25%: 32.27/25.08/20.66 | 36.85/46.1% | 56.57 | not reached | 28 |
| Mine Iron | Base market | 715.00/94.00 | 20.19 | 9.47/0.63/-3.78<br>Generated orders max 25%: 2.19/5.28/1.97 | 2.56/56.9% | 51.83 | 23 | not reached |
| Mine Iron | Network III | 715.00/94.00 | 20.19 | 13.29/5.68/0.66<br>Generated orders max 25%: 4.94/9.14/5.54 | 2.19/48.7% | 51.83 | 67 | not reached |

## Power Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coal Power | Base market | 2150.00/128.00 | 6.04 | 2.49/0.71/-0.32<br>Generated orders max 25%: -0.15/0.40/0.67 | 0.11/27.5% | 184.17 | 36 | not reached |
| Coal Power | Network III | 2150.00/128.00 | 6.04 | 3.58/2.03/0.98<br>Generated orders max 25%: 0.62/1.48/1.77 | 0.09/23.0% | 184.17 | 147 | not reached |
| Solar Power | Base market | 2150.00/100.00 | 0.89 | 0.64/0.49/0.37<br>Generated orders max 25%: -0.14/-0.20/0.36 | 0.04/10.0% | 146.59 | 103 | not reached |
| Solar Power | Network III | 2150.00/100.00 | 0.89 | 0.71/0.57/0.44<br>Generated orders max 25%: -0.10/-0.16/0.41 | 0.03/7.7% | 146.59 | 103 | not reached |

## Quarry

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quarry Clay | Base market | 1305.00/104.00 | 8.79 | 6.49/4.25/3.14<br>Generated orders max 25%: 3.23/1.75/3.74 | 0.18/22.6% | 67.86 | not reached | not reached |
| Quarry Clay | Network III | 1305.00/104.00 | 8.79 | 7.34/5.48/4.08<br>Generated orders max 25%: 3.82/2.63/4.43 | 0.14/17.5% | 67.86 | not reached | not reached |
| Quarry Minerals | Base market | 1305.00/144.00 | 19.79 | 11.56/6.52/4.69<br>Generated orders max 25%: 6.81/9.17/8.29 | 0.40/40.3% | 67.86 | not reached | not reached |
| Quarry Minerals | Network III | 1305.00/144.00 | 19.79 | 14.32/9.38/6.76<br>Generated orders max 25%: 8.73/11.30/9.86 | 0.34/33.6% | 67.86 | not reached | 192 |
| Quarry Sand | Base market | 1305.00/84.00 | 9.29 | 4.86/1.28/0.24<br>Generated orders max 25%: 1.85/3.33/1.43 | 0.18/44.2% | 66.31 | 33 | not reached |
| Quarry Sand | Network III | 1305.00/84.00 | 9.29 | 6.47/3.25/1.66<br>Generated orders max 25%: 2.97/4.81/2.53 | 0.15/37.4% | 66.31 | not reached | not reached |
| Quarry Stone | Base market | 1305.00/124.00 | 31.04 | 19.16/9.99/6.42<br>Generated orders max 25%: 11.60/13.09/11.09 | 0.95/47.5% | 70.55 | not reached | 223 |
| Quarry Stone | Network III | 1305.00/124.00 | 31.04 | 23.33/14.85/9.99<br>Generated orders max 25%: 14.53/16.72/13.84 | 0.79/39.6% | 70.55 | not reached | 112 |

## Small Utility Works

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electricity | Base market | 635.00/74.00 | 7.46 | 6.38/5.70/4.74<br>Generated orders max 25%: 4.79/6.13/4.79 | 0.06/15.2% | 30.70 | not reached | 124 |
| Produce Electricity | Network III | 635.00/74.00 | 7.46 | 6.69/6.00/4.98<br>Generated orders max 25%: 4.98/6.33/4.93 | 0.05/12.2% | 30.70 | not reached | 116 |
| Produce Water | Base market | 635.00/53.00 | 2.55 | 2.10/1.65/1.32<br>Generated orders max 25%: 1.52/1.22/1.58 | 0.03/28.9% | 26.32 | not reached | not reached |
| Produce Water | Network III | 635.00/53.00 | 2.55 | 2.26/1.86/1.49<br>Generated orders max 25%: 1.62/1.36/1.69 | 0.02/23.1% | 26.32 | not reached | not reached |

## Water Well

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Electric Pumping | Base market | 550.00/91.00 | 2.30 | 0.51/-0.49/-0.61<br>Generated orders max 25%: -0.48/-0.29/0.06 | 0.04/42.8% | 25.40 | 11 | not reached |
| Electric Pumping | Network III | 550.00/91.00 | 2.30 | 1.12/0.14/-0.15<br>Generated orders max 25%: -0.05/0.18/0.41 | 0.04/36.2% | 25.40 | 24 | not reached |
| Manual Pumping | Base market | 550.00/46.00 | 2.62 | 2.16/1.71/1.38<br>Generated orders max 25%: 1.59/1.28/1.63 | 0.03/28.9% | 22.80 | not reached | not reached |
| Manual Pumping | Network III | 550.00/46.00 | 2.62 | 2.32/1.92/1.54<br>Generated orders max 25%: 1.68/1.42/1.74 | 0.02/23.1% | 22.80 | not reached | not reached |

## Connected-chain economy (180 minutes)

Each row runs all listed facilities in one shared base market. Upstream production is available to downstream facilities before each minute ends; the chain retains the following minute's required inputs and sells every other produced good. Every margin cell also shows Generated orders max 25%: real generated customer orders may fulfil only from the chain's named primary outputs, up to 25% of their produced volume. Bids and lot sizes use live sales rules, so the realised share can be lower. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first output minute with a non-positive margin, so a later recovery remains possible. Setup cost includes land, Construction Materials, Industrial Machines, and each distinct recipe-unlock research cost. Construction demand consumes the participating facilities' total Construction Materials and Industrial Machines requirement evenly through the 180-minute scenario; it is external demand, not a player expense. A scenario that stalls a facility is treated as an invalid report scenario.

| chain | primary output | facilities | setup cost (EUR) | market input cost (EUR) | margin 15m/60m/180m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Staples: utilities -> Farm | Grain, Sugar | Small Utility Works x2, Farm x2 | 2199.00 | 1985.46 | 14.81/11.28/8.51<br>Generated orders max 25%: 8.27/13.56/11.77 | not reached | not reached |
| Extraction: utilities -> Mine | Coal, Iron, Copper | Small Utility Works x2, Mine x3 | 3860.00 | 8226.56 | 40.86/13.66/-1.54<br>Electricity max 1.5x: 41.63/14.72/0.47<br>Generated orders max 25%: 21.27/30.28/16.87 | 46 | not reached |
| Fertilizer bridge: quarry -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2 | 12565.00 | 2499.93 | 56.66/6.35/-80.53<br>Generated orders max 25%: 50.12/8.63/-77.27 | 45 | not reached |
| Fertilizer bridge: market inputs -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Chemical Plant x1, Farm x2 | 6678.00 | 3890.34 | 12.68/-0.78/1.91<br>Generated orders max 25%: 6.13/1.49/5.17 | 86 | not reached |
| Fertilizer: quarry -> Fertilizer | Fertilizer | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 11763.00 | 375.04 | 52.10/-7.31/-71.81<br>Generated orders max 25%: 42.27/-12.61/-68.84 | 45 | not reached |
| Plastic: quarry -> Plastic | Plastic | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 11758.00 | 466.93 | 62.16/1.39/-65.22<br>Generated orders max 25%: 47.37/6.09/-56.77 | 41 | not reached |
| Steel: mines -> Steel | Steel | Small Utility Works x2, Mine x2, Industrial Processing Factory x1 | 5311.00 | 4764.07 | 62.95/32.42/14.35<br>Electricity max 1.5x: 62.95/32.42/14.73<br>Generated orders max 25%: 50.70/39.72/29.15 | 123 | not reached |
| Poultry -> Cake | Cake | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 16313.00 | 2866.53 | 126.29/70.11/-263.84<br>Generated orders max 25%: 138.17/90.30/-244.73 | 46 | not reached |
| Cattle -> Meat Pie | Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 16316.00 | 4028.57 | 88.42/41.84/-291.81<br>Generated orders max 25%: 91.84/54.50/-279.82 | 35 | not reached |
| Animal farm and bakery: inputs -> Cake, Premium Cake, and Meat Pie | Cake, Premium Cake, Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2, Animal Farm x3, Bakery x3 | 25080.00 | 5161.06 | 250.91/165.56/-117.59<br>Electricity max 1.5x: 251.44/166.32/-116.95<br>Generated orders max 25%: 260.92/216.10/-67.92 | 31 | not reached |
| Construction: inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Mine x2, Quarry x3, Industrial Processing Factory x1, Construction Factory x4 | 25334.00 | 16312.88 | 247.79/236.25/134.38<br>Electricity max 1.5x: 264.92/255.38/155.13<br>Generated orders max 25%: 228.61/183.55/1.84 | 1 | not reached |
| Industrial Machines: inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Quarry x2, Chemical Plant x2, Mine x4, Electronics Factory x2, Industrial Processing Factory x2, Assembly Plant x1 | 42175.00 | 26554.39 | 625.85/388.95/-81.32<br>Electricity max 1.5x: 664.01/428.50/-37.50<br>Generated orders max 25%: 587.35/420.69/-171.83 | 1 | not reached |
| Construction Materials: market inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Construction Factory x1 | 6575.00 | 4557.93 | 219.03/24.30/-0.61<br>Generated orders max 25%: 180.14/35.81/12.39 | 1 | not reached |
| Industrial Machines: market inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Assembly Plant x1 | 11269.00 | 21738.16 | 98.36/-565.37/19.35<br>Generated orders max 25%: 120.55/-519.42/32.47 | 1 | 192 |

